// ─── content.js — Evrensel DOM Parser & Auth Bridge ──────────────────────────
// Her web sayfasında çalışır. Streaming platformlarını spesifik olarak,
// diğer tüm siteleri ise genel yöntemlerle algılar.

(function () {
  'use strict';

  // ─── Auth Bridge ─────────────────────────────────────────────────────────────
  // MediaTracker sitesindeyse token'ı eklentiye aktar
  if (window.location.hostname === 'localhost') {
    const token = localStorage.getItem('auth_token');
    const userRaw = localStorage.getItem('auth_user');
    if (token) {
      const user = userRaw ? JSON.parse(userRaw) : null;
      chrome.runtime.sendMessage({ type: 'BRIDGE_TOKEN', token, user }).catch(() => {});
    }
  }

  let videoElement = null;
  let heartbeatInterval = null;

  console.log('MediaTracker: Content script loaded');

  // ─── Bilinen Platform Algılama ────────────────────────────────────────────────
  const hostname = window.location.hostname;

  function detectKnownPlatform() {
    if (hostname.includes('netflix.com'))
      return {
        name: 'Netflix', icon: '🔴',
        getTitle: () =>
          qs('.watch-title') ||
          qs('[data-uia="video-title"]') ||
          qs('.nfp-title-link') ||
          qs('.title-card-title-header'),
      };
    if (hostname.includes('primevideo.com') || (hostname.includes('amazon.com') && location.pathname.startsWith('/gp/video')))
      return {
        name: 'Prime Video', icon: '🔵',
        getTitle: () =>
          qs('[data-automation-id="title"]') ||
          qs('.atvwebplayersdk-title-text') ||
          qs('.dv-node-dp-title'),
      };
    if (hostname.includes('disneyplus.com'))
      return {
        name: 'Disney+', icon: '🔷',
        getTitle: () => qs('[class*="title-field"]') || qs('[data-testid="title"]'),
      };
    if (hostname.includes('hbomax.com') || hostname.includes('max.com'))
      return {
        name: 'Max', icon: '🟣',
        getTitle: () => qs('[class*="TitleName"]') || qs('[data-testid="title"]'),
      };
    if (hostname.includes('tv.apple.com'))
      return {
        name: 'Apple TV+', icon: '⬛',
        getTitle: () => qs('.shelf-title') || qs('[class*="ProductTitle"]'),
      };
    if (hostname.includes('blutv.com'))
      return { name: 'BluTV', icon: '🟦', getTitle: () => qs('.player-title') };
    if (hostname.includes('exxen.com'))
      return { name: 'Exxen', icon: '🟧', getTitle: () => qs('.player-content-title') };
    if (hostname.includes('gain.tv'))
      return { name: 'Gain', icon: '🟩', getTitle: () => qs('[class*="title"]') };
    if (hostname.includes('tabii.com'))
      return { name: 'Tabii', icon: '🟩', getTitle: () => qs('[class*="ContentTitle"]') };
    return null;
  }

  function qs(selector) {
    const el = document.querySelector(selector);
    return el?.textContent?.trim() || null;
  }

  function findVideo() {
    return document.querySelector('video') || document.querySelector('object') || document.querySelector('embed');
  }

  function getVideoTime() {
    const video = findVideo();
    if (!video || isNaN(video.currentTime)) return null;
    return {
      currentTime: Math.floor(video.currentTime),
      duration: Math.floor(video.duration || 0)
    };
  }

  // ─── Akıllı Video Takibi (Event-Driven) ──────────────────────────────────────
  let lastSyncTime = 0;

  function sendSyncTime(reason = 'timeupdate') {
    const vTime = getVideoTime();
    if (!vTime || vTime.currentTime <= 0) return;

    const detection = detect();
    console.log(`MediaTracker: SYNC (${reason}) - "${detection.title}" @ ${vTime.currentTime}s`);
    chrome.runtime.sendMessage({
      type: 'SYNC_TIME',
      currentTime: vTime.currentTime,
      url: window.location.href,
      title: detection.title,
      season: detection.season,
      episode: detection.episode
    }).catch(() => {});
  }

  function initVideoTracking(video) {
    if (video.dataset.mediaTrackerAttached) return;
    video.dataset.mediaTrackerAttached = 'true';
    console.log('MediaTracker: Attached smart listeners to video.');

    video.addEventListener('play', () => {
      console.log('MediaTracker: Video playing.');
      sendSyncTime('play');
    });

    video.addEventListener('pause', () => {
      console.log('MediaTracker: Video paused.');
      sendSyncTime('pause');
    });

    video.addEventListener('timeupdate', () => {
      const now = Date.now();
      // Her 10 saniyede bir eşitleme (throttle)
      if (now - lastSyncTime > 10000 && !video.paused) {
        lastSyncTime = now;
        sendSyncTime('timeupdate');
      }
    });
  }
  // ─── Genel / Evrensel Algılama ────────────────────────────────────────────────
  // Herhangi bir web sitesinde dizi/film adını bulmak için 7 katmanlı strateji

  function detectGeneric() {
    let season = null;
    let episode = null;
    let title = null;

    // 1. URL Analizi (En iyi Sezon/Bölüm kaynağı)
    const urlInfo = extractFromUrl(window.location.pathname);
    if (urlInfo) {
      season = urlInfo.season;
      episode = urlInfo.episode;
      title = urlInfo.title;
    }

    // 2. Başlık bulmak için diğer yöntemleri de kontrol et
    const getPageTitle = () => {
      // Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content?.trim();
      if (ogTitle && ogTitle.length > 1) return cleanTitle(ogTitle);

      // Twitter Card title
      const twTitle = document.querySelector('meta[name="twitter:title"]')?.content?.trim();
      if (twTitle && twTitle.length > 1) return cleanTitle(twTitle);

      // JSON-LD Structured Data
      const jsonLds = document.querySelectorAll('script[type="application/ld+json"]');
      for (const el of jsonLds) {
        try {
          const data = JSON.parse(el.textContent);
          const items = Array.isArray(data) ? data : [data];
          for (const item of items) {
            const types = ['Movie', 'TVSeries', 'TVEpisode', 'TVSeason', 'VideoObject'];
            if (types.includes(item['@type']) && item.name) {
              return cleanTitle(item.name);
            }
          }
        } catch { /* ignore */ }
      }

      // Popüler video player kütüphaneleri
      if (window.jwplayer) {
        try {
          const jw = window.jwplayer();
          const playlist = jw.getPlaylist?.();
          if (playlist?.[0]?.title) return cleanTitle(playlist[0].title);
          const title = jw.getPlaylistItem?.()?.title;
          if (title) return cleanTitle(title);
        } catch { /* ignore */ }
      }
      if (window.videojs) {
        try {
          const vjs = document.querySelector('.video-js');
          if (vjs?.id) {
            const player = window.videojs(vjs.id);
            const title = player?.options_?.title || player?.currentSrc?.();
            if (title && !title.startsWith('http')) return cleanTitle(title);
          }
        } catch { /* ignore */ }
      }

      // Video elementi var mı? Varsa yakınındaki başlık elementini ara
      const videoEl = document.querySelector('video');
      if (videoEl) {
        const titleEl = findNearestTitle(videoEl);
        if (titleEl) return cleanTitle(titleEl);
      }
      return null;
    };

    const betterTitle = getPageTitle();
    if (betterTitle) {
      title = betterTitle;
    }
    if (!title) {
      title = cleanTitle(document.title);
    }

    // Sayfa başlığından ekstra Sezon/Bölüm çıkarımı (Eğer url'de yoksa)
    if (!season || !episode) {
      const pTitle = document.title || betterTitle || '';
      if (!season) {
        const sMatch = pTitle.match(/(\d+)\.?[ \-_]*(?:sezon|season)/i) || pTitle.match(/(?:sezon|season)[ \-_]*(\d+)/i);
        if (sMatch) season = parseInt(sMatch[1], 10);
      }
      if (!episode) {
        const eMatch = pTitle.match(/(\d+)\.?[ \-_]*(?:bölüm|bolum|episode)/i) || pTitle.match(/(?:bölüm|bolum|episode)[ \-_]*(\d+)/i);
        if (eMatch) episode = parseInt(eMatch[1], 10);
      }
      const sxE = pTitle.match(/(?:^|[ \-_\[\(])(?:s)?(\d+)[xe](\d+)(?:[ \-_\]\)]|$)/i);
      if (sxE) {
        if (!season) season = parseInt(sxE[1], 10);
        if (!episode) episode = parseInt(sxE[2], 10);
      }
    }

    return { title, season, episode };
  }

  // Video elementine en yakın başlık elementini bul
  function findNearestTitle(videoEl) {
    const selectors = ['h1', 'h2', '[class*="title"]', '[class*="Title"]', '[class*="name"]', '[id*="title"]'];

    // Önce parent zincirinde dene
    let el = videoEl.parentElement;
    for (let i = 0; i < 8 && el; i++) {
      for (const sel of selectors) {
        const found = el.querySelector(sel);
        if (found?.textContent?.trim()) return found.textContent.trim();
      }
      el = el.parentElement;
    }

    // Fallback: tüm sayfada ilk h1
    return document.querySelector('h1')?.textContent?.trim() || null;
  }

  function extractFromUrl(path) {
    let season = null;
    let episode = null;

    // Regex ile sezon/bölüm bul
    // "6x2" veya "s06e02"
    const sxE = path.match(/(?:^|\/|[-_])(?:s)?(\d+)[xe](\d+)(?:[-_]|$|\/)/i);
    if (sxE) {
      season = parseInt(sxE[1], 10);
      episode = parseInt(sxE[2], 10);
    }
    // "sezon-2" veya "2-sezon"
    if (!season) {
      const sMatch = path.match(/(?:sezon|season)[-_](\d+)|(\d+)[-_](?:sezon|season)/i);
      if (sMatch) season = parseInt(sMatch[1] || sMatch[2], 10);
    }
    // "bolum-11" veya "11-bolum" veya "ep-11"
    if (!episode) {
      const eMatch = path.match(/(?:bolum|episode|ep)[-_](\d+)|(\d+)[-_](?:bolum|episode|ep)/i);
      if (eMatch) episode = parseInt(eMatch[1] || eMatch[2], 10);
    }

    const segments = path.split('/').filter(s => s.length > 2);
    const ignoredKeywords = ['dizi', 'film', 'movie', 'series', 'watch', 'izle', 'player', 'embed', 'season', 'sezon', 'bolum', 'episode', 'ep'];

    let bestTitle = null;

    for (const seg of segments) {
      const lower = seg.toLowerCase();
      if (ignoredKeywords.includes(lower)) continue;
      if (/^(sezon|season|bolum|episode|ep)[-_]\d+$/.test(lower)) continue;
      if (/^\d+[-_](sezon|season|bolum|episode|ep)$/.test(lower)) continue;
      if (/^\d+$/.test(lower)) continue; // Sadece sayı olanları atla

      let cleaned = seg
        .replace(/[-_]?(?:sezon|season|bolum|episode|ep|s\d+e\d+|\d+[xe]\d+).*$/i, '')
        .replace(/[-_](hdfc|izle|altyazili|dublaj|full|hd|1080p|720p|4k).*$/i, '')
        .replace(/[-_]/g, ' ')
        .trim();

      if (cleaned.length > 2) {
        let finalTitle = cleaned.replace(/\b\w/g, c => c.toUpperCase());
        if (!bestTitle) bestTitle = finalTitle;
      }
    }

    return { title: bestTitle, season, episode };
  }

  function cleanTitle(raw) {
    if (!raw) return null;
    return raw
      .replace(/\s*[|\-–—]\s*.+$/, '')           // sağdaki "| site adı" kaldır
      .replace(/\b(izle|watch|online|hd|4k|full|1080p|720p|türkçe|altyazılı|dublaj|dizipal)\b/gi, '')
      .replace(/\s*(?:sezon|season|bölüm|bolum|episode|s\d+e\d+|\d+x\d+).*/i, '') // Sezon/bölüm kelimelerini ve sonrasını TAMAMEN kes
      .replace(/\s+/g, ' ')
      .trim();
  }

  function detect() {
    const known = detectKnownPlatform();
    const generic = detectGeneric(); // Her durumda url/sayfa analizini yap

    if (known) {
      const knownTitle = known.getTitle();
      return {
        title: knownTitle || generic.title || null,
        season: generic.season,
        episode: generic.episode,
        platform: known.name,
        platformIcon: known.icon,
        confidence: knownTitle || generic.title ? 'high' : 'low',
      };
    }

    // Bilinmeyen site: genel algılama
    const videoInfo = getVideoTime();
    const hasVideo = !!videoInfo;
    const hasTitle = !!generic.title;

    let confidence = 'low';
    if (hasVideo && hasTitle) confidence = 'high';
    else if (hasVideo || hasTitle) confidence = 'medium';

    return {
      title: generic.title || null,
      season: generic.season || null,
      episode: generic.episode || null,
      platform: known ? known.name : null,
      platformIcon: known ? known.icon : (hasVideo ? '🎬' : '🌐'),
      confidence,
      hasVideo,
      currentTime: videoInfo?.currentTime || null,
      duration: videoInfo?.duration || null
    };
  }

  // ─── Observer & Polling Tasarımı ─────────────────────────────────────────────
  // SPA'lar (Netflix, YouTube) için düzenli olarak video elementi arar
  setInterval(() => {
    const video = findVideo();
    if (video) {
      initVideoTracking(video);
    }
  }, 2000);

  // Sayfadan çıkarken son konumu bildir
  window.addEventListener('beforeunload', () => {
    sendSyncTime('unload');
  });

  // ─── Mesaj Dinleyicisi ────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PAGE_TITLE') {
      sendResponse({ ...detect(), url: window.location.href });
    }
    return true;
  });

})();
