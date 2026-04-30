# 🎬 Media Tracker

[English](#english) | [Türkçe](#türkçe)

---

## English

A modern media tracking platform where you can manage your personal movie and TV series watch list, update your watching status, and share with the community.

### 🚀 Features
- **TMDB Integration:** Instant access to millions of movies and series.
- **Watching Tracker:** Status management for Watching, Completed, Plan to Watch, and Dropped.
- **Episode Tracking:** Season and episode-based progress recording for series.
- **Profile Management:** Personal bio, favorite genres, and profile photo.
- **Timeline:** See what other users are watching and share posts.
- **Chrome Extension:** Automatically capture data from the platforms you watch (Netflix, etc.).

### 📋 Prerequisites
Before starting the installation, make sure the following are installed on your system:
- PHP 8.2 or higher
- Composer (PHP dependency manager)
- Node.js (v18+) & npm
- MySQL or MariaDB

### 🛠️ Installation Steps
#### 1. Clone the Project
```bash
git clone <repo-url>
cd media-tracker
```
#### 2. Backend (Laravel) Setup
```bash
composer install
cp .env.example .env
php artisan key:generate
```
**.env Settings:** Update the following fields in the `.env` file:
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: Your database credentials.
- `TMDB_API_KEY`: Your API key from TMDB.

```bash
php artisan migrate
php artisan storage:link
```
#### 3. Frontend (React) Setup
```bash
cd media-frontend
npm install
```

### 🖥️ Running the Application
#### Linux (Ubuntu/Debian)
**Backend:** `php artisan serve`
**Frontend:** `cd media-frontend && npm run dev`

#### Windows
**Backend:** `php artisan serve` (PowerShell or CMD)
**Frontend:** `cd media-frontend && npm run dev`

Application will run at http://localhost:5173. Backend will be at http://localhost:8000.

### ⚠️ Important Notes & Troubleshooting
#### Large Profile Photo Uploads
Update `php.ini`:
```ini
upload_max_filesize = 10M
post_max_size = 10M
```
#### CORS Errors
Add `localhost:5173` to `SANCTUM_STATEFUL_DOMAINS` in `.env`.
#### Chrome Extension
Enable "Developer Mode" and "Load unpacked" the `media-extension` folder.

### 📜 License
This project is licensed under the Media Tracker License. See the LICENSE file in the root directory for full terms and conditions.

---

## Türkçe

Kişisel film ve dizi izleme listenizi yönetebileceğiniz, izleme durumunuzu güncelleyebileceğiniz ve toplulukla paylaşım yapabileceğiniz modern bir medya takip platformu.

### 🚀 Özellikler
- **TMDB Entegrasyonu:** Milyonlarca film ve diziye anında erişim.
- **İzleme Takibi:** İzleniyor, Tamamlandı, İzlenecekler ve Bırakıldı durum yönetimi.
- **Bölüm Takibi:** Diziler için sezon ve bölüm bazlı ilerleme kaydı.
- **Profil Yönetimi:** Kişisel biyografi, favori türler ve profil fotoğrafı.
- **Zaman Tüneli:** Diğer kullanıcıların neler izlediğini görme ve paylaşım yapma.
- **Chrome Uzantısı:** İzlediğiniz platformlardan (Netflix vb.) otomatik veri yakalama.

### 📋 Ön Gereksinimler
Kuruluma başlamadan önce sisteminizde şunların yüklü olduğundan emin olun:
- PHP 8.2 veya üzeri
- Composer (PHP bağımlılık yöneticisi)
- Node.js (v18+) & npm
- MySQL veya MariaDB

### 🛠️ Kurulum Adımları
#### 1. Projeyi Klonlayın
```bash
git clone <repo-url>
cd media-tracker
```
#### 2. Backend (Laravel) Kurulumu
```bash
composer install
cp .env.example .env
php artisan key:generate
```
**.env Ayarları:** `.env` dosyasını bir metin editörüyle açın ve şu alanları güncelleyin:
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: Veritabanı bilgileriniz.
- `TMDB_API_KEY`: TMDB üzerinden aldığınız API anahtarı.

```bash
php artisan migrate
php artisan storage:link
```
#### 3. Frontend (React) Kurulumu
```bash
cd media-frontend
npm install
```

### 🖥️ Çalıştırma
#### Linux (Ubuntu/Debian)
**Backend:** `php artisan serve`
**Frontend:** `cd media-frontend && npm run dev`

#### Windows
**Backend:** `php artisan serve` (PowerShell veya CMD)
**Frontend:** `cd media-frontend && npm run dev`

Uygulama varsayılan olarak http://localhost:5173 adresinde çalışacaktır. Backend ise http://localhost:8000 adresinde hizmet verir.

### ⚠️ Önemli Notlar & Sorun Giderme
#### Yüksek Boyutlu Profil Fotoğrafı Yükleme
PHP ayarlarınızı (`php.ini`) güncelleyin:
```ini
upload_max_filesize = 10M
post_max_size = 10M
```
#### CORS Hataları
Laravel tarafında `.env` içindeki `SANCTUM_STATEFUL_DOMAINS` alanına `localhost:5173` adresini eklediğinizden emin olun.
#### Chrome Uzantısı
Tarayıcınızda "Geliştirici Modu"nu açın ve `media-extension` klasörünü "Paketlenmemiş öğe yükle" seçeneği ile seçin.

### 📜 Lisans
Bu proje Media Tracker Lisansı altında lisanslanmıştır. Tüm şartlar ve koşullar için kök dizindeki LICENSE dosyasına bakın.
