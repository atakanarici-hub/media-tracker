# 🎬 Media Tracker - Full Stack Media Management Platform

Modern bir film, dizi ve medya takip platformu. Bu depo (repository), platformun tüm bileşenlerini (Backend, Frontend ve Chrome Uzantısı) içermektedir.

---

## 🏗️ Proje Yapısı

Bu proje üç ana bölümden oluşmaktadır:

1.  **[media-tracker](./media-tracker):** Laravel (PHP) tabanlı REST API Backend.
2.  **[media-frontend](./media-frontend):** React + Vite tabanlı modern Web Frontend.
3.  **[media-extension](./media-extension):** Netflix, Prime Video gibi platformlardan otomatik veri çeken Chrome Uzantısı.

---

## 🚀 Temel Özellikler

-   **TMDB Entegrasyonu:** Milyonlarca film ve dizi verisine anında erişim.
-   **İzleme Durumu:** İzleniyor, Tamamlandı, Planlandı ve Bırakıldı durum yönetimi.
-   **Bölüm Bazlı Takip:** Diziler için sezon ve bölüm bazlı detaylı ilerleme.
-   **Profil & Zaman Tüneli:** Kişisel biyografi, favori türler ve sosyal paylaşım akışı.
-   **Otomatik Tespit:** Chrome uzantısı ile izlediğiniz içeriği otomatik olarak listenize ekleme.

---

## 📋 Sistem Gereksinimleri

-   **PHP:** 8.2+
-   **Node.js:** 18+ (npm ile birlikte)
-   **Composer:** Laravel bağımlılıkları için.
-   **Veritabanı:** MySQL veya MariaDB.
-   **API Key:** Bir [TMDB API Key](https://www.themoviedb.org/settings/api) gereklidir.

---

## 🛠️ Kurulum ve Çalıştırma

### 1. Backend (Laravel) Kurulumu
```bash
cd media-tracker
composer install
cp .env.example .env
php artisan key:generate
```
`.env` dosyasında veritabanı ayarlarınızı ve `TMDB_API_KEY` alanını güncelleyin.
```bash
php artisan migrate
php artisan storage:link
php artisan serve
```

### 2. Frontend (React) Kurulumu
Yeni bir terminalde:
```bash
cd media-frontend
npm install
npm run dev
```

### 3. Chrome Uzantısı Kurulumu
1.  `chrome://extensions/` adresine gidin.
2.  "Geliştirici Modu"nu (Developer Mode) aktif edin.
3.  "Paketlenmemiş öğe yükle" (Load unpacked) butonuna tıklayın.
4.  Bu projedeki `media-extension` klasörünü seçin.

---

## ⚠️ Sorun Giderme

-   **Dosya Yükleme Limitleri:** Büyük profil fotoğrafları için `php.ini` dosyanızda `upload_max_filesize` ve `post_max_size` değerlerini (örneğin 10M) artırın.
-   **CORS Hataları:** Frontend (`localhost:5173`) ile Backend (`localhost:8000`) arasındaki iletişimi sağlamak için `.env` içindeki `SANCTUM_STATEFUL_DOMAINS` ayarının doğru olduğundan emin olun.

---

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.
