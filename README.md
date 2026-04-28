# 🎬 Media Tracker
Kişisel film ve dizi izleme listenizi yönetebileceğiniz, izleme durumunuzu güncelleyebileceğiniz ve toplulukla paylaşım yapabileceğiniz modern bir medya takip platformu.

## 🚀 Özellikler
- **TMDB Entegrasyonu:** Milyonlarca film ve diziye anında erişim.
- **İzleme Takibi:** İzleniyor, Tamamlandı, İzlenecekler ve Bırakıldı durum yönetimi.
- **Bölüm Takibi:** Diziler için sezon ve bölüm bazlı ilerleme kaydı.
- **Profil Yönetimi:** Kişisel biyografi, favori türler ve profil fotoğrafı.
- **Zaman Tüneli:** Diğer kullanıcıların neler izlediğini görme ve paylaşım yapma.
- **Chrome Uzantısı:** İzlediğiniz platformlardan (Netflix vb.) otomatik veri yakalama.

## 📋 Ön Gereksinimler
Kuruluma başlamadan önce sisteminizde şunların yüklü olduğundan emin olun:

- PHP 8.2 veya üzeri
- Composer (PHP bağımlılık yöneticisi)
- Node.js (v18+) & npm
- MySQL veya MariaDB

## 🛠️ Kurulum Adımları
### 1. Projeyi Klonlayın
```bash
git clone <repo-url>
cd media-tracker
```

### 2. Backend (Laravel) Kurulumu
```bash
# Bağımlılıkları yükleyin
composer install
# .env dosyasını oluşturun
cp .env.example .env
# Uygulama anahtarını oluşturun
php artisan key:generate
```
**.env Ayarları:** `.env` dosyasını bir metin editörüyle açın ve şu alanları güncelleyin:
- DB_DATABASE, DB_USERNAME, DB_PASSWORD: Veritabanı bilgileriniz.
- TMDB_API_KEY: TMDB üzerinden aldığınız API anahtarı.

```bash
# Veritabanı tablolarını oluşturun
php artisan migrate
# Dosya yüklemeleri için sembolik link oluşturun
php artisan storage:link
```

### 3. Frontend (React) Kurulumu
Yeni bir terminal açın ve projenin ana dizinine gidin:
```bash
cd media-frontend
npm install
```

## 🖥️ Çalıştırma

### Linux (Ubuntu/Debian)
**Backend:**
```bash
php artisan serve
```
**Frontend:**
```bash
cd media-frontend
npm run dev
```

### Windows
**Backend:** PowerShell veya CMD üzerinden:
```powershell
php artisan serve
```
**Frontend:** Yeni bir terminalde:
```powershell
cd media-frontend
npm run dev
```

Uygulama varsayılan olarak http://localhost:5173 adresinde çalışacaktır. Backend ise http://localhost:8000 adresinde hizmet verir.

## ⚠️ Önemli Notlar & Sorun Giderme
### Yüksek Boyutlu Profil Fotoğrafı Yükleme
Eğer büyük boyutlu fotoğraflar yüklerken hata alıyorsanız, PHP ayarlarınızı (php.ini) güncellemeniz gerekebilir:

```ini
upload_max_filesize = 10M
post_max_size = 10M
```
*Windows'ta php.ini genellikle PHP'nin kurulu olduğu dizindedir. Linux'ta /etc/php/8.x/cli/php.ini ve /etc/php/8.x/fpm/php.ini konumundadır.*

### CORS Hataları
Frontend ve Backend farklı portlarda çalıştığı için tarayıcıda CORS hataları alırsanız, Laravel tarafında config/cors.php veya .env içindeki SANCTUM_STATEFUL_DOMAINS alanına localhost:5173 adresini eklediğinizden emin olun.

### Chrome Uzantısı
Uzantıyı kullanmak için tarayıcınızda "Geliştirici Modu"nu açın ve media-extension klasörünü "Paketlenmemiş öğe yükle" seçeneği ile seçin.

## 📄 Lisans
Açık kaynaklıdır. Eğitim ve geliştirme amaçlı kullanılabilir.
