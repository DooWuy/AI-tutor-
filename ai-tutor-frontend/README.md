# AI Tutor Frontend

React 19 + TypeScript + Vite frontend for AI Tutor.

## Chạy màn hình đăng nhập

1. Khởi động PostgreSQL, Redis và RabbitMQ từ thư mục gốc:
   ```powershell
   docker compose up -d postgres redis rabbitmq
   ```
2. Chạy backend:
   ```powershell
   cd ai-tutor-service
   .\gradlew.bat bootRun
   ```
3. Chạy frontend ở terminal khác:
   ```powershell
   cd ai-tutor-frontend
   Copy-Item .env.example .env.local
   npm install
   npm run dev
   ```
4. Mở `http://localhost:5173`.

API mặc định là `http://localhost:8088/api/v1`. Có thể thay bằng `VITE_API_BASE_URL` trong `.env.local`.

## Kiểm tra

```powershell
npm run lint
npm run build
```

Khi chọn “Ghi nhớ đăng nhập”, access token và user được lưu trong `localStorage`; nếu bỏ chọn thì lưu trong `sessionStorage`. Refresh token vẫn nằm trong HttpOnly cookie do backend quản lý.
