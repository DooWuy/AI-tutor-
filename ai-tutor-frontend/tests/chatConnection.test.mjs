import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tsLoader } from './helpers/loadTs.mjs';

function setup() {
  let session = { user: { userId: 'one' }, accessToken: 'original' };
  const logs = [];
  class Client {
    deactivations = 0; disconnects = 0;
    constructor(options) { Object.assign(this, options); }
    async deactivate() { this.deactivations++; }
    forceDisconnect() { this.disconnects++; }
  }
  const api = tsLoader({ mocks: { '@stomp/stompjs': { Client }, authApi: { getStoredSession: () => session } },
    globals: { window: { location: { href: 'https://app.example.test/student/chat' } },
      console: { debug: (...values) => logs.push(values) } }, env: { VITE_API_BASE_URL: '/api/v1', DEV: false } })('src/services/chatApi.ts');
  return { api, logs, setSession: value => { session = value; } };
}

test('chat derives secure deployment URL and reconnect refreshes the token without logging frames', async () => {
  const { api, logs, setSession } = setup();
  const client = api.createChatStompClient();
  assert.equal(client.brokerURL, 'wss://app.example.test/ws');
  setSession({ user: { userId: 'one' }, accessToken: 'refreshed' });
  await client.beforeConnect();
  assert.equal(client.connectHeaders.Authorization, 'Bearer refreshed');
  client.debug('Authorization: Bearer refreshed');
  assert.equal(logs.length, 0);
  client.onStompError();
  assert.equal(client.disconnects, 1);
});

test('chat stops reconnecting after logout or account switch rather than reusing the previous token', async () => {
  for (const next of [null, { user: { userId: 'two' }, accessToken: 'foreign' }]) {
    const { api, setSession } = setup();
    const client = api.createChatStompClient();
    setSession(next); await client.beforeConnect();
    assert.equal(client.deactivations, 1);
    assert.notEqual(client.connectHeaders.Authorization, 'Bearer foreign');
  }
});
