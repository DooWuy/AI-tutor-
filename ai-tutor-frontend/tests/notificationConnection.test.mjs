import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tsLoader } from './helpers/loadTs.mjs';

const logs = [];
const { createNotificationConnection, websocketUrl } = tsLoader({ mocks: { '@stomp/stompjs': { Client: class {} } },
  globals: { console: { debug: (...values) => logs.push(values) } } })('src/services/notificationConnection.ts');
const dto = id => ({ id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`, type: 'CLASS_REMINDER', title: 'Title',
  message: 'Message', link: null, isRead: false, createdAt: '2026-10-21T00:00:00Z', metadata: {} });
class FakeClient {
  subscriptions = []; deactivations = 0; disconnects = 0;
  configure(options) { Object.assign(this, options); }
  activate() { this.active = true; }
  async deactivate() { this.deactivations++; this.active = false; }
  forceDisconnect() { this.disconnects++; }
  subscribe(destination, callback) { this.subscriptions.push({ destination, callback }); }
}

test('each reconnect uses the latest token, subscribes before resync and preserves bursts', async () => {
  const client = new FakeClient(), received = [], connections = [];
  let token = 'first';
  const stop = createNotificationConnection({ url: 'ws://test/ws', getToken: () => token,
    onNotification: item => received.push(item.id), onConnectionChange: state => {
      connections.push(state); if (state) assert.ok(client.subscriptions.length > 0);
    } }, () => client);
  await client.beforeConnect(); assert.equal(client.connectHeaders.Authorization, 'Bearer first');
  client.onConnect();
  const event = client.subscriptions[0].callback;
  event({ body: JSON.stringify(dto(1)) }); event({ body: JSON.stringify(dto(2)) });
  event({ body: 'bad json' }); event({ body: JSON.stringify({ type: 'QUIZ_GENERATED', quizId: 'old-signal' }) });
  assert.deepEqual(received, [dto(1).id, dto(2).id]);
  client.onWebSocketClose(); token = 'refreshed';
  await client.beforeConnect(); client.onConnect();
  assert.equal(client.connectHeaders.Authorization, 'Bearer refreshed');
  assert.deepEqual(connections, [true, false, true]);
  stop(); event({ body: JSON.stringify(dto(3)) }); client.onConnect();
  assert.equal(received.length, 2); assert.equal(client.subscriptions.length, 2);
  assert.equal(client.deactivations, 1);
});

test('broker errors trigger reconnect and logout suppresses further connections without logging tokens', async () => {
  const client = new FakeClient(), connected = [];
  let token = 'secret-token';
  const stop = createNotificationConnection({ url: 'wss://test/ws', getToken: () => token, onNotification() {},
    onConnectionChange: value => connected.push(value), dev: false }, () => client);
  client.debug('CONNECT Authorization: Bearer secret-token');
  client.onStompError(); assert.equal(client.disconnects, 1);
  assert.equal(connected.at(-1), false);
  token = null; await client.beforeConnect(); assert.equal(client.active, false);
  stop(); assert.equal(logs.length, 0);
});

test('HTTPS deployments derive secure WebSocket URLs and respect explicit overrides', () => {
  assert.equal(websocketUrl(undefined, 'https://api.example.test/api/v1', 'https://app.example.test'), 'wss://api.example.test/ws');
  assert.equal(websocketUrl(undefined, '/api/v1', 'https://app.example.test/student'), 'wss://app.example.test/ws');
  assert.equal(websocketUrl('wss://gateway.example.test/socket', '', 'https://app.example.test'), 'wss://gateway.example.test/socket');
});
