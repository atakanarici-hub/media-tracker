# 🎬 Media Tracker

Media Tracker, kullanıcıların izledikleri film ve dizileri organize edebildiği ve izleme ilerlemesini otomatik olarak takip edebildiği bir web uygulamasıdır. Proje, modern web teknolojileri ile geliştirilmiş olup özellikle tarayıcı eklentisi ile sağladığı otomatik izleme takibi özelliğiyle öne çıkar.

Platform, The Movie Database (TMDB) entegrasyonu sayesinde geniş bir içerik kütüphanesine erişim sağlar. Kullanıcılar içerikleri kolayca ekleyebilir, kategorize edebilir ve izleme geçmişlerini detaylı şekilde yönetebilir.

En kritik bileşen olan Chrome eklentisi, farklı video oynatıcılarıyla uyumlu çalışarak kullanıcı müdahalesine gerek kalmadan izleme ilerlemesini takip eder. Video durdurulduğunda veya sekme kapatıldığında, izleme noktası otomatik olarak backend’e iletilir.

---

## 🚀 Öne Çıkan Özellikler

- Otomatik İzleme Takibi: Video oynatıcı event’leri üzerinden çalışan sistem, izleme ilerlemesini gerçek zamanlı olarak kaydeder.
- Platform Bağımsız Çalışma: Netflix, Prime Video ve iframe tabanlı oynatıcılarla uyumlu çalışır.
- Gelişmiş Dashboard: İçerikler; durum, puan, tarih ve isim gibi kriterlere göre filtrelenebilir ve sıralanabilir.
- Akıllı Bölüm Yönetimi: Dizi içeriklerinde bölüm ilerlemesi otomatik olarak yönetilir.
- Düşük Kaynak Tüketimi: Event-driven mimari sayesinde gereksiz işlem yükü oluşturmaz.

---

## 🛠️ Kullanılan Teknolojiler
Backend: PHP 8, Laravel 11, Sanctum, SQLite / MySQL
Frontend: React, Vite, Tailwind CSS, React Router
Extension: JavaScript (ES6), Chrome Manifest V3

---

## ⚙️ Kurulum

Proje üç ana bileşenden oluşur: backend, frontend ve browser extension.

### Backend

cd media-tracker
composer install
cp .env.example .env

.env içerisine TMDB API key eklenir:

TMDB_API_KEY=your_api_key

Devamında:

php artisan key:generate
php artisan migrate
php artisan serve

---

### Frontend

cd media-frontend
npm install
npm run dev

---

### Chrome Extension

- chrome://extensions/ adresine gidilir
- Developer Mode aktif edilir
- “Load unpacked” ile media-extension klasörü yüklenir

---

## 📌 Proje Amacı

Bu proje, modern web geliştirme süreçlerini uçtan uca deneyimlemek amacıyla geliştirilmiştir. Backend, frontend ve browser extension entegrasyonunu tek bir ekosistem içinde birleştirerek gerçek dünya senaryolarına yakın bir çözüm sunar.

---

## 📝 Lisans

Açık kaynaklıdır. Eğitim ve geliştirme amaçlı kullanılabilir.
