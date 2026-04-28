# 🛡️ Media Tracker - Backend API

Bu klasör, platformun Laravel tabanlı REST API sunucusunu içerir.

## 🚀 Başlangıç

1.  Bağımlılıkları yükleyin:
    ```bash
    composer install
    ```
2.  `.env` dosyasını hazırlayın:
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
3.  Veritabanını yapılandırın ve tabloları oluşturun:
    ```bash
    php artisan migrate
    ```
4.  Depolama linkini oluşturun (profil fotoğrafları için):
    ```bash
    php artisan storage:link
    ```
5.  Sunucuyu başlatın:
    ```bash
    php artisan serve
    ```

## 📂 Teknolojiler

-   **Laravel 11**
-   **Sanctum** (Kimlik Doğrulama)
-   **MySQL**
-   **TMDB API** Entegrasyonu
