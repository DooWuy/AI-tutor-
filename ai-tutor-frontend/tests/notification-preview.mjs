import { createServer } from 'vite';

const read = new Set();
const server = await createServer({
  define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/__notification-api/api/v1'),
    'import.meta.env.VITE_WS_URL': JSON.stringify('ws://127.0.0.1:9/ws') },
  server: { host: '127.0.0.1', port: 5187, strictPort: true },
  plugins: [{ name: 'synthetic-notification-api', configureServer(server) {
    server.middlewares.use('/__notification-api/api/v1/notifications', (req, res) => {
      const page = new URL(req.headers.referer || 'http://localhost');
      const url = new URL(req.url, 'http://localhost');
      const role = ['STUDENT', 'TEACHER', 'ADMIN'].includes(page.searchParams.get('role')) ? page.searchParams.get('role') : 'STUDENT';
      const mode = page.searchParams.get('mode');
      const items = Array.from({ length: mode === 'empty' ? 0 : 42 }, (_, index) => {
        const number = index + 1;
        const id = `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
        return { id, type: role === 'STUDENT' ? 'CLASS_REMINDER' : 'QUIZ_GENERATED',
          title: role === 'STUDENT' ? `Sắp đến giờ học: ${number % 2 ? 'Toán' : 'Tiếng Việt'}` : 'Đã tạo xong bài trắc nghiệm',
          message: role === 'STUDENT' ? 'Bạn có tiết học lúc 07:15. Hãy chuẩn bị sách vở và vào lớp đúng giờ nhé!'
            : 'Bài trắc nghiệm đã được tạo xong. Bạn có thể mở lại để kiểm tra nội dung.',
          link: role === 'STUDENT' ? '/student/timetable' : `/${role.toLowerCase()}/quizzes/${id}`,
          isRead: read.has(id), createdAt: new Date(Date.UTC(2026, 9, 21, 0, 0) - index * 60000).toISOString(), metadata: {} };
      });
      if (req.method === 'PUT') {
        if (url.pathname === '/read-all') items.forEach(item => read.add(item.id));
        else read.add(url.pathname.split('/')[1]);
      }
      const offset = url.searchParams.get('cursor') === 'second' ? 20 : url.searchParams.get('cursor') === 'last' ? 40 : 0;
      const data = req.method === 'PUT' ? null : url.pathname === '/unread-count' ? { unreadCount: items.filter(n => !n.isRead).length }
        : { items: items.slice(offset, offset + 20), unreadCount: items.filter(n => !n.isRead).length,
          nextCursor: offset + 20 < items.length ? offset === 0 ? 'second' : 'last' : null };
      const respond = () => {
        res.statusCode = mode === 'error' ? 503 : 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: mode !== 'error', data, message: 'Chưa tải được thông báo. Vui lòng thử lại.' }));
      };
      if (mode === 'loading') setTimeout(respond, 15000); else respond();
    });
  } }],
});
await server.listen();
console.log('Preview: http://127.0.0.1:5187/tests/fixtures/notification-preview.html');
