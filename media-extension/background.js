// ─── background.js — Service Worker ───────────────────────────────────────────
// Token yönetimi ve API istekleri burada merkezileştirilir.

const API_BASE = 'http://localhost:8000/api';

// İzlenen medyaların listesi (watch_url ile eşleştirmek için)
let watchingList = [];

// Manifest V3'de değişkenler (state) silindiği için chrome.storage kullanıyoruz.
// Ancak çalışma anında hızlı erişim için watchingList'i bellekte de tutuyoruz.

// ─── Auth Token Yönetimi ───────────────────────────────────────────────────────

async function getToken() {
  const storage = await chrome.storage.local.get('auth_token');
  return storage.auth_token;
}

async function fetchWatchingList() {
  const token = await getToken();
  if (!token) return;
  try {
    const res = await apiRequest('GET', '/progress');
    if (res.ok) {
      watchingList = res.data.filter(item => item.status === 'watching' || item.status === 'plan_to_watch');
      console.log('MediaTracker: Watching list updated', watchingList.length);
    }
  } catch (e) {
    console.error('MediaTracker: Failed to fetch watching list', e);
  }
}

// Periyodik olarak listeyi güncelle
if (chrome.alarms) {
  chrome.alarms.create('fetch_list', { periodInMinutes: 15 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetch_list') fetchWatchingList();
  });
} else {
  // Fallback if alarms API is not available (shouldn't happen with correct permissions)
  setInterval(fetchWatchingList, 15 * 60 * 1000);
}

// Başlangıçta listeyi çek (Küçük bir gecikme ile, storage'ın hazır olması için)
setTimeout(fetchWatchingList, 1000);

// Sekme güncellendiğinde URL kontrolü yap ve gerekiyorsa otomatik takibi başlat
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const match = watchingList.find(item => item.watch_url && tab.url.includes(item.watch_url));
    if (match) {
      console.log('MediaTracker: Auto-matching tab to media:', match.media.title);
      const key = `tab_tracking_${tabId}`;
      await chrome.storage.local.set({
        [key]: {
          mediaId: match.media.id,
          title: match.media.title,
          timestamp: Date.now()
        }
      });
    }
  }
});

async function setToken(token) {
  await chrome.storage.local.set({ auth_token: token });
}

async function clearToken() {
  await chrome.storage.local.remove(['auth_token', 'auth_user']);
}

// ─── API Yardımcıları ──────────────────────────────────────────────────────────

async function apiRequest(method, endpoint, body = null) {
  try {
    const token = await getToken();
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return { ok: false, error: 'Sunucudan geçersiz yanıt geldi.', status: response.status };
    }

    if (response.status === 401) {
      await clearToken();
      return { error: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.', status: 401, ok: false };
    }

    return { data, status: response.status, ok: response.ok };
  } catch (err) {
    console.error('API Request Error:', err);
    return { ok: false, error: 'Sunucuya bağlanılamadı.' };
  }
}

// ─── Mesaj Dinleyicisi (Popup ↔ Background) ────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message, _sender)
    .then(sendResponse)
    .catch(err => {
      console.error('Message handling error:', err);
      sendResponse({ ok: false, error: 'Bir hata oluştu.' });
    });
  return true; // async response için gerekli
});

async function handleMessage(message, _sender) {
  switch (message.type) {

    case 'LOGIN': {
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email: message.email, password: message.password })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          await setToken(data.token);
          await chrome.storage.local.set({ auth_user: data.user });
          return { ok: true, user: data.user };
        }
        return { ok: false, error: data.message || 'Giriş başarısız.' };
      } catch (err) {
        console.error('Login Error:', err);
        return { ok: false, error: 'Sunucuya bağlanılamadı.' };
      }
    }

    case 'LOGOUT': {
      await apiRequest('POST', '/logout');
      await clearToken();
      return { ok: true };
    }

    case 'GET_USER': {
      const token = await getToken();
      if (!token) return { ok: false, user: null };
      const { auth_user } = await chrome.storage.local.get('auth_user');
      return { ok: true, user: auth_user };
    }

    case 'SEARCH': {
      const res = await apiRequest('GET', `/media/search?q=${encodeURIComponent(message.query)}`);
      return res;
    }

    case 'GET_PROGRESS': {
      const res = await apiRequest('GET', '/progress');
      return res;
    }

    case 'SAVE_PROGRESS': {
      const res = await apiRequest('POST', `/progress/${message.mediaId}`, {
        status: message.status,
        rating: message.rating || null,
        stopped_at: message.stopped_at !== undefined ? message.stopped_at : null,
        watch_url: message.watch_url || null,
        platform: message.platform || null
      });
      return res;
    }

    case 'SAVE_EPISODE_PROGRESS': {
      const res = await apiRequest('POST', `/progress/${message.mediaId}/episode`, {
        season_number: message.season_number,
        episode_number: message.episode_number,
        is_watched: message.is_watched,
        rating: message.rating || null,
        stopped_at: message.stopped_at !== undefined ? message.stopped_at : null
      });
      return res;
    }

    case 'GET_MEDIA_DETAILS': {
      const res = await apiRequest('GET', `/media/${message.mediaType}/${message.tmdbId}`);
      return res;
    }

    // Tab'ı belirli bir medya ile ilişkilendir (Kalıcı Saklama)
    case 'TRACK_TAB': {
      if (message.tabId && message.mediaId) {
        const key = `tab_tracking_${message.tabId}`;
        await chrome.storage.local.set({
          [key]: {
            mediaId: message.mediaId,
            title: message.title,
            timestamp: Date.now()
          }
        });
        console.log(`MediaTracker: Tab ${message.tabId} is now tracking "${message.title}" (ID: ${message.mediaId})`);
        return { ok: true };
      }
      return { ok: false };
    }

    // Content script'ten gelen akıllı zaman eşitlemesi
    case 'SYNC_TIME': {
      const tabId = _sender?.tab?.id;
      if (!tabId || !message.currentTime) return { ok: false };

      const key = `tab_tracking_${tabId}`;
      const storage = await chrome.storage.local.get(key);
      const trackingInfo = storage[key];
      
      if (trackingInfo && trackingInfo.mediaId) {
        console.log(`MediaTracker: Saving SYNC for "${trackingInfo.title}" @ ${message.currentTime}s`);
        
        // 1. Genel ilerlemeyi güncelle
        const res = await apiRequest('POST', `/progress/${trackingInfo.mediaId}`, {
          stopped_at: Math.floor(message.currentTime),
          status: 'watching'
        });

        // 2. Eğer dizi ise ve bölüm bilgisi varsa, bölüm ilerlemesini de güncelle
        if (message.season && message.episode) {
          await apiRequest('POST', `/progress/${trackingInfo.mediaId}/episode`, {
            season_number: message.season,
            episode_number: message.episode,
            is_watched: false,
            stopped_at: Math.floor(message.currentTime)
          });
        }

        return res;
      }
      return { ok: false, error: 'Takip edilen medya bulunamadı' };
    }

    // React SPA'dan token köprüsü: site içinden mesaj gelirse token kaydet
    case 'BRIDGE_TOKEN': {
      if (message.token) {
        await setToken(message.token);
        if (message.user) await chrome.storage.local.set({ auth_user: message.user });
        return { ok: true };
      }
      return { ok: false };
    }

    default:
      return { ok: false, error: 'Bilinmeyen mesaj tipi.' };
  }
}
