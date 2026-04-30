# 🛡️ Media Tracker - Backend API

[English](#english) | [Türkçe](#türkçe)

---

## English

This folder contains the Laravel-based REST API server for the platform.

### 🚀 Getting Started

1.  **Install dependencies:**
    ```bash
    composer install
    ```
2.  **Prepare `.env` file:**
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
3.  **Configure database and run migrations:**
    ```bash
    php artisan migrate
    ```
4.  **Create storage link** (for profile pictures):
    ```bash
    php artisan storage:link
    ```
5.  **Start the server:**
    ```bash
    php artisan serve
    ```

### 📂 Technologies

-   **Laravel 11**
-   **Sanctum** (Authentication)
-   **MySQL**
-   **TMDB API** Integration

### 📜 License

This project is licensed under the Media Tracker License. See the LICENSE file in the root directory for full terms and conditions.

---

## Türkçe

Bu klasör, platformun Laravel tabanlı REST API sunucusunu içerir.

### 🚀 Başlangıç

1.  **Bağımlılıkları yükleyin:**
    ```bash
    composer install
    ```
2.  **`.env` dosyasını hazırlayın:**
    ```bash
    cp .env.example .env
    php artisan key:generate
    ```
3.  **Veritabanını yapılandırın ve tabloları oluşturun:**
    ```bash
    php artisan migrate
    ```
4.  **Depolama linkini oluşturun** (profil fotoğrafları için):
    ```bash
    php artisan storage:link
    ```
5.  **Sunucuyu başlatın:**
    ```bash
    php artisan serve
    ```

### 📂 Teknolojiler

-   **Laravel 11**
-   **Sanctum** (Kimlik Doğrulama)
-   **MySQL**
-   **TMDB API** Entegrasyonu

### 📜 Lisans

Bu proje Media Tracker Lisansı altında lisanslanmıştır. Tüm şartlar ve koşullar için kök dizindeki LICENSE dosyasına bakın.
