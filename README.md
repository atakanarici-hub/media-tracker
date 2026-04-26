<div align="center">
  <h1>🎬 Media Tracker</h1>
  <p><b>Kullanıcıların izledikleri film ve dizileri organize edebildiği ve izleme ilerlemesini otomatik olarak takip edebildiği gelişmiş bir web uygulamasıdır.</b></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/PHP-8.0+-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
    <img src="https://img.shields.io/badge/Laravel-11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Chrome_Extension-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension" />
  </p>
</div>

---

Proje, modern web teknolojileri ile geliştirilmiş olup özellikle **tarayıcı eklentisi** ile sağladığı otomatik izleme takibi özelliğiyle öne çıkar.

Platform, **The Movie Database (TMDB)** entegrasyonu sayesinde geniş bir içerik kütüphanesine erişim sağlar. Kullanıcılar içerikleri kolayca ekleyebilir, kategorize edebilir ve izleme geçmişlerini detaylı şekilde yönetebilir.

> En kritik bileşen olan Chrome eklentisi, farklı video oynatıcılarıyla uyumlu çalışarak kullanıcı müdahalesine gerek kalmadan izleme ilerlemesini takip eder. Video durdurulduğunda veya sekme kapatıldığında, izleme noktası otomatik olarak backend’e iletilir.

---

## 🚀 Öne Çıkan Özellikler

- **Otomatik İzleme Takibi:** Video oynatıcı event’leri üzerinden çalışan sistem, izleme ilerlemesini gerçek zamanlı olarak kaydeder.
- **Platform Bağımsız Çalışma:** Netflix, Prime Video ve iframe tabanlı oynatıcılarla uyumlu çalışır.
- **Gelişmiş Dashboard:** İçerikler; durum, puan, tarih ve isim gibi kriterlere göre filtrelenebilir ve sıralanabilir.
- **Akıllı Bölüm Yönetimi:** Dizi içeriklerinde bölüm ilerlemesi otomatik olarak yönetilir.
- **Düşük Kaynak Tüketimi:** Event-driven mimari sayesinde gereksiz işlem yükü oluşturmaz.

---

## 🛠️ Teknoloji Stack

<table>
  <tr>
    <td align="center"><b>Backend</b></td>
    <td align="center"><b>Frontend</b></td>
    <td align="center"><b>Browser Extension</b></td>
  </tr>
  <tr valign="top">
    <td>
      <ul>
        <li>PHP 8</li>
        <li>Laravel 11</li>
        <li>Laravel Sanctum <br><i>(Auth & API Security)</i></li>
        <li>SQLite / MySQL</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>React</li>
        <li>Vite</li>
        <li>Tailwind CSS</li>
        <li>React Router</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>JavaScript (ES6+)</li>
        <li>Chrome Manifest V3</li>
        <li>Service Workers</li>
      </ul>
    </td>
  </tr>
</table>

---

## ⚙️ Kurulum

Proje üç ana bileşenden oluşur: **backend**, **frontend** ve **browser extension**.

### 1. Backend

İlk olarak `media-tracker` dizinine girip bağımlılıkları yüklüyoruz:

```bash
cd media-tracker
composer install
cp .env.example .env
```

`.env` dosyası içerisine **TMDB API Key** bilginizi ekleyin:

```env
TMDB_API_KEY=your_api_key
```

Ardından veritabanını oluşturup sunucuyu başlatın:

```bash
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. Frontend

Yeni bir terminal açıp arayüz dizinine girin:

```bash
cd media-frontend
npm install
npm run dev
```

### 3. Chrome Extension

1. Chrome tarayıcınızda adres çubuğuna `chrome://extensions/` yazarak gidin.
2. Sağ üst köşeden **"Developer Mode"** seçeneğini aktif edin.
3. Sol üstteki **"Load unpacked"** butonuna tıklayın ve proje dizinindeki `media-extension` klasörünü seçerek yükleyin.

---

## 📌 Proje Amacı

Bu proje, modern web geliştirme süreçlerini uçtan uca deneyimlemek amacıyla geliştirilmiştir. Backend, frontend ve browser extension entegrasyonunu tek bir ekosistem içinde birleştirerek gerçek dünya senaryolarına yakın bir çözüm sunar.

---

## 📝 Lisans

Açık kaynaklıdır. Eğitim ve geliştirme amaçlı kullanılabilir.
