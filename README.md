# AquaTeam Web Sitesi (Node.js + Express + SQLite)
Gereksinim: Node.js 22.13+ (yerleşik `node:sqlite` kullanılır).
Çalıştırma: `npm install` → `.env.example` içindeki değişkenleri ortam değişkeni olarak tanımla → `npm start` → http://localhost:3000
Yönetim paneli: `/admin` (ADMIN_USER / ADMIN_PASS). Dosyalar (logo, PDF, .glb, CORAL görseli, basın kiti): `/admin/files`.
Canlıya alma: Render/Azure App Service gibi bir servise GitHub'dan bağla; veritabanı ve yüklemeler DATA_DIR klasöründe tutulur, bu klasör kalıcı disk olmalıdır.

REST API (salt okunur): `/api/posts`, `/api/tests`, `/api/gallery`, `/api/sponsors`, `/api/members` ve `/api/<tablo>/<id>`.
Azure ortam değişkenleri: ADMIN_PASS, SESSION_SECRET, DATA_DIR=/home/data, NODE_ENV=production (+ isteğe bağlı SMTP_*).
