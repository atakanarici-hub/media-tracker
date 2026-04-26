# 🎬 Media Tracker Projesi

Media Tracker, izlediğiniz dizi ve filmlerin kaydını tutabileceğiniz, TMDB entegrasyonlu ve Chrome Eklentisi destekli gelişmiş bir takip platformudur. 

En dikkat çekici özelliği olan **Akıllı Chrome Eklentisi** sayesinde; Netflix, Prime Video veya resmi olmayan oynatıcılar (iframe kullanan siteler) fark etmeksizin izlediğiniz videoyu otomatik algılar. Videoyu duraklattığınızda veya sekmeyi kapattığınızda, videonun **hangi saniyesinde kaldığınızı otomatik olarak sunucuya kaydeder**.

## 🚀 Özellikler

- **TMDB Entegrasyonu:** Dünyadaki tüm film ve dizileri anında arayıp sisteminize ekleyebilirsiniz.
- **Kapsamlı Dashboard:** İzlediklerinizi duruma (İzleniyor, Tamamlandı vs.), puana, isme veya tarihe göre sıralayabilirsiniz.
- **Akıllı Süre Takibi (Event-Driven):** Chrome eklentisi körleme tarama yapmaz; doğrudan video oynatıcının `play`, `pause` ve `timeupdate` olaylarını dinler. Çok düşük sistem kaynağı tüketir.
- **İframe Desteği:** Resmi olmayan yayıncıların kullandığı "pencere içi pencere" (iframe) oynatıcılara sızarak süreyi kusursuz hesaplar (`all_frames: true` mimarisi).
- **Akıllı Bölüm Atlatma:** Dizi izlerken bir bölümü "Tamamlandı" işaretlediğinizde, otomatik olarak bir sonraki bölümü listeye alır. Tamamlanan içeriklerin sürelerini otomatik sıfırlar.

## 🛠️ Kullanılan Teknolojiler

- **Backend:** PHP 8, Laravel 11, Sanctum (API Güvenliği), SQLite/MySQL
- **Frontend:** React, Vite, Tailwind CSS, React Router, Lucide Icons
- **Eklenti (Extension):** JavaScript (ES6), Chrome Manifest V3, Service Workers

---

## ⚙️ Kurulum Rehberi

Proje üç ayrı parçadan oluşmaktadır: Backend (API), Frontend (Arayüz) ve Extension (Eklenti). Hepsini çalıştırmak için aşağıdaki adımları sırasıyla izleyin.

### 1. Backend Kurulumu (Laravel)
Bu bölüm veritabanını ve API sunucusunu ayağa kaldırır.

1. `media-tracker` klasörüne girin:
   ```bash
   cd media-tracker
   ```
2. Gerekli kütüphaneleri yükleyin:
   ```bash
   composer install
   ```
3. Çevre değişkenleri dosyasını oluşturun:
   ```bash
   cp .env.example .env
   ```
4. `.env` dosyasını açıp TMDB API anahtarınızı girin:
   ```env
   TMDB_API_KEY=senin_tmdb_api_anahtarin
   ```
5. Uygulama şifreleme anahtarını (App Key) oluşturun:
   ```bash
   php artisan key:generate
   ```
6. Veritabanı tablolarını oluşturun:
   ```bash
   php artisan migrate
   ```
7. Sunucuyu başlatın:
   ```bash
   php artisan serve
   ```
   *Sunucu `http://127.0.0.1:8000` adresinde çalışmaya başlayacaktır.*

---

### 2. Frontend Kurulumu (React/Vite)
Kullanıcı arayüzünü ayağa kaldırır.

1. Yeni bir terminal açın ve `media-frontend` klasörüne girin:
   ```bash
   cd media-frontend
   ```
2. Gerekli kütüphaneleri yükleyin:
   ```bash
   npm install
   ```
3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   *Site `http://localhost:5173` adresinde yayına girecektir. Tarayıcınızdan bu adrese giderek uygulamayı kullanabilirsiniz.*

---

### 3. Chrome Eklentisi Kurulumu (Extension)
Videolardaki süreyi otomatik takip eden eklentinin kurulumu.

1. Chrome veya Brave tarayıcınızda adres çubuğuna şunu yazın ve Enter'a basın: 
   `chrome://extensions/`
2. Sağ üst köşedeki **Geliştirici Modu (Developer mode)** anahtarını açık hale getirin.
3. Sol üstte beliren **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
4. Karşınıza çıkan dosya seçici ekranda, projenin içindeki `media-extension` klasörünü seçin.
5. Eklenti tarayıcınıza kurulacaktır. 
6. Eklentiler menüsünden (yapboz ikonu) Media Tracker'ı sabitleyerek rahatça kullanabilirsiniz.

## 📝 Lisans
Bu proje açık kaynaklıdır ve eğitim/portföy amacıyla geliştirilmiştir. İstediğiniz gibi çatallayabilir (fork) ve geliştirebilirsiniz.
