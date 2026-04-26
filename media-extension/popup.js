// ─── popup.js — Eklenti Popup Mantığı ─────────────────────────────────────────

// ─── DOM Elementleri ──────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const screens = { login: $('screen-login'), main: $('screen-main') };
const loader = $('loader');

// Login
const inputEmail    = $('input-email');
const inputPassword = $('input-password');
const btnLogin      = $('btn-login');
const loginError    = $('login-error');

// Header
const userBadge = $('user-badge');
const userName  = $('user-name');
const btnLogout = $('btn-logout');

// Platform bar
const platformBar     = $('platform-bar');
const platformIcon    = $('platform-icon');
const platformName    = $('platform-name');
const detectedTitle   = $('detected-title');
const btnUseDetected  = $('btn-use-detected');

// Search
const inputSearch   = $('input-search');
const btnSearch     = $('btn-search');
const searchResults = $('search-results');

// Selected media
const selectedMedia = $('selected-media');
const mediaPoster   = $('media-poster');
const mediaTitle    = $('media-title');
const mediaYear     = $('media-year');
const mediaTypeBadge = $('media-type-badge');
const statusPills   = document.querySelectorAll('.pill');
const starContainer = $('star-rating');
const ratingValue   = $('rating-value');
const btnSave       = $('btn-save');
const saveMsg       = $('save-msg');
const btnClear      = $('btn-clear');

// Time & Episode
const inputMinutes    = $('input-minutes');
const inputSeconds    = $('input-seconds');
const episodeSection  = $('episode-section');
const episodeBadge    = $('episode-badge');
const checkboxWatched = $('checkbox-watched');

// My list
const myList = $('my-list');

// ─── State ────────────────────────────────────────────────────────────────────
let currentMedia = null; // Seçili içerik { tmdbId, mediaType, title, year, poster }
let selectedStatus = '';
let selectedRating = 0;
let hoverRating = 0;
let detectedSeason = null;
let detectedEpisode = null;
let detectedUrl = null;
let detectedPlatform = null;

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

function sendBg(message) {
  return chrome.runtime.sendMessage(message);
}

const STATUS_LABELS = {
  watching:      '▶ İzleniyor',
  completed:     '✓ Tamamlandı',
  plan_to_watch: '⏰ İzlenecekler',
  dropped:       '✕ Bırakıldı',
};

const PLATFORM_ICONS = {
  'Netflix': '🔴', 'Prime Video': '🔵', 'Disney+': '🔷',
  'Max': '🟣', 'Apple TV+': '⬛', 'BluTV': '🟦',
  'Exxen': '🟧', 'Tabii': '🟩',
};

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  showLoader();
  try {
    const { ok, user } = await sendBg({ type: 'GET_USER' });
    if (ok && user) {
      setLoggedIn(user);
      await loadMyList();
      await detectCurrentPage();
    } else {
      showScreen('login');
    }
  } catch (e) {
    showScreen('login');
  } finally {
    hideLoader();
  }
}

function setLoggedIn(user) {
  userName.textContent = user.name || user.email;
  userBadge.classList.remove('hidden');
  showScreen('main');
}

// ─── Giriş ────────────────────────────────────────────────────────────────────
btnLogin.addEventListener('click', async () => {
  const email = inputEmail.value.trim();
  const password = inputPassword.value.trim();
  if (!email || !password) return;

  loginError.classList.add('hidden');
  showLoader();
  const res = await sendBg({ type: 'LOGIN', email, password });
  hideLoader();

  if (res.ok) {
    setLoggedIn(res.user);
    await loadMyList();
    await detectCurrentPage();
  } else {
    loginError.textContent = res.error || 'Giriş başarısız.';
    loginError.classList.remove('hidden');
  }
});

inputPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnLogin.click(); });

// ─── Çıkış ────────────────────────────────────────────────────────────────────
btnLogout.addEventListener('click', async () => {
  await sendBg({ type: 'LOGOUT' });
  userBadge.classList.add('hidden');
  clearSelection();
  platformBar.classList.add('hidden');
  showScreen('login');
});

// ─── Sayfa Algılama ───────────────────────────────────────────────────────────
async function detectCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_TITLE' });

    if (response?.title && response.confidence !== 'low') {
      platformIcon.textContent = response.platformIcon || '🎬';
      if (response.platform) {
        platformName.textContent = response.confidence === 'medium'
          ? `${response.platform} · Doğrulama önerilir`
          : response.platform;
        // Resmi platform — platform adını kaydet, URL kaydetme
        detectedPlatform = response.platform;
        detectedUrl = null;
      } else {
        platformName.textContent = response.hasVideo
          ? '🎬 Video sayfası algılandı'
          : '🌐 Sayfadan algılandı';
        // Resmi olmayan site — URL'yi kaydet
        detectedUrl = response.url || null;
        detectedPlatform = null;
      }

      btnUseDetected.dataset.searchQuery = response.title;
      
      let displayTitle = response.title;
      if (response.season && response.episode) {
        detectedSeason = response.season;
        detectedEpisode = response.episode;
      }
      
      // Sadece dizi/film ismini göster
      detectedTitle.textContent = displayTitle;
      platformBar.classList.remove('hidden');

      // OTOMATİK DAKİKA/SANİYE TESPİTİ
      if (response.currentTime !== null) {
        inputMinutes.value = Math.floor(response.currentTime / 60);
        inputSeconds.value = response.currentTime % 60;
        // Eğer bir medya seçiliyse butonu aktif et (zaten seçiliyse loadExistingProgress de çalışmış olabilir)
        if (currentMedia) btnSave.disabled = false;
      }
    }
  } catch {
    // Content script yüklü değilse (normal bir sayfa) sessizce geç
  }
}


btnUseDetected.addEventListener('click', () => {
  const query = btnUseDetected.dataset.searchQuery || detectedTitle.textContent;
  if (query) {
    inputSearch.value = query;
    doSearch(query);
  }
});

// ─── Arama ────────────────────────────────────────────────────────────────────
btnSearch.addEventListener('click', () => doSearch(inputSearch.value.trim()));
inputSearch.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(inputSearch.value.trim()); });

async function doSearch(query) {
  if (!query) return;
  showLoader();
  searchResults.classList.add('hidden');
  searchResults.innerHTML = '';

  const res = await sendBg({ type: 'SEARCH', query });
  hideLoader();

  if (!res.ok || !res.data?.length) {
    searchResults.innerHTML = '<div style="padding:12px;color:#64748b;text-align:center">Sonuç bulunamadı.</div>';
    searchResults.classList.remove('hidden');
    return;
  }

  res.data.slice(0, 8).forEach(item => {
    const div = document.createElement('div');
    div.className = 'search-item';
    const year = (item.release_date || item.first_air_date || '').substring(0, 4);
    const isMovie = item.media_type === 'movie';
    div.innerHTML = `
      <img class="search-item-poster"
        src="${item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : ''}"
        alt="${item.title || item.name}" />
      <div class="search-item-info">
        <div class="search-item-title">${item.title || item.name}</div>
        <div class="search-item-meta">
          <span class="badge ${isMovie ? 'badge-movie' : 'badge-tv'}">${isMovie ? 'Film' : 'Dizi'}</span>
          ${year ? `<span class="badge-year">${year}</span>` : ''}
        </div>
      </div>`;
    div.addEventListener('click', () => selectMedia(item));
    searchResults.appendChild(div);
  });

  searchResults.classList.remove('hidden');
}

// ─── İçerik Seçimi ────────────────────────────────────────────────────────────
function selectMedia(item) {
  const isMovie = item.media_type === 'movie';
  currentMedia = {
    tmdbId: item.id,
    mediaType: item.media_type,
    title: item.title || item.name,
    year: (item.release_date || item.first_air_date || '').substring(0, 4),
    poster: item.poster_path,
  };

  mediaPoster.src = item.poster_path
    ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : '';
  mediaTitle.textContent = currentMedia.title;
  mediaYear.textContent = currentMedia.year;
  mediaTypeBadge.innerHTML = `<span class="badge ${isMovie ? 'badge-movie' : 'badge-tv'}">${isMovie ? 'Film' : 'Dizi'}</span>`;

  searchResults.classList.add('hidden');
  selectedMedia.classList.remove('hidden');
  saveMsg.classList.add('hidden');
  selectedStatus = '';
  selectedRating = 0;
  
  inputMinutes.value = '';
  inputSeconds.value = '';
  
  if (!isMovie && detectedSeason && detectedEpisode) {
    episodeSection.classList.remove('hidden');
    episodeBadge.textContent = `S${detectedSeason}E${detectedEpisode}`;
    checkboxWatched.checked = true;
  } else {
    episodeSection.classList.add('hidden');
  }

  updatePills();
  updateStars(0);
  btnSave.disabled = true;

  // Varsa mevcut durumu yükle
  loadExistingProgress().then(() => {
    // Media seçildiğinde background'a bildir (Auto-save için)
    // Eğer db_record varsa id'si ile gönder
    if (currentMedia.id) {
       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs[0]?.id) {
           sendBg({ 
             type: 'TRACK_TAB', 
             tabId: tabs[0].id, 
             mediaId: currentMedia.id,
             title: currentMedia.title 
           });
         }
       });
    }
  });
}

async function loadExistingProgress() {
  const res = await sendBg({ type: 'GET_PROGRESS' });
  if (!res.ok || !res.data) return;

  const existing = res.data.find(p => p.media?.tmdb_id === currentMedia.tmdbId);
  if (existing) {
    selectedStatus = existing.status;
    selectedRating = existing.rating || 0;
    
    if (existing.stopped_at) {
      inputMinutes.value = Math.floor(existing.stopped_at / 60);
      inputSeconds.value = existing.stopped_at % 60;
    }

    updatePills();
    updateStars(selectedRating);
    btnSave.disabled = false;

    // Background tracking için ID'yi sakla
    currentMedia.id = existing.media_id;
    
    // Aktif tab'ı track et
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      sendBg({ 
        type: 'TRACK_TAB', 
        tabId: tab.id, 
        mediaId: currentMedia.id,
        title: currentMedia.title 
      });
    }
  }
}

// ─── Status Pills ─────────────────────────────────────────────────────────────
statusPills.forEach(pill => {
  pill.addEventListener('click', () => {
    const val = pill.dataset.status;
    selectedStatus = selectedStatus === val ? '' : val;
    updatePills();
    btnSave.disabled = !selectedStatus;
  });
});

function updatePills() {
  statusPills.forEach(p => {
    p.classList.toggle('active', p.dataset.status === selectedStatus);
  });
}

// ─── Yıldız Puanlama ──────────────────────────────────────────────────────────
function buildStars() {
  starContainer.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const span = document.createElement('span');
    span.className = 'star';
    span.textContent = '★';
    span.dataset.value = i;

    span.addEventListener('mouseenter', () => {
      hoverRating = i;
      renderStars();
    });
    span.addEventListener('mouseleave', () => {
      hoverRating = 0;
      renderStars();
    });
    span.addEventListener('click', () => {
      selectedRating = selectedRating === i ? 0 : i;
      updateStars(selectedRating);
    });

    starContainer.appendChild(span);
  }
}

function renderStars() {
  const val = hoverRating > 0 ? hoverRating : selectedRating;
  starContainer.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('lit', i < val && hoverRating === 0);
    s.classList.toggle('hover', i < hoverRating);
  });
}

function updateStars(val) {
  selectedRating = val;
  ratingValue.textContent = val > 0 ? `${val}/10` : '—';
  renderStars();
}

// ─── Kaydet ───────────────────────────────────────────────────────────────────
btnSave.addEventListener('click', async () => {
  if (!currentMedia || !selectedStatus) return;

  showLoader();
  // Önce medya detaylarını çek (db_record.id lazım)
  const detailRes = await sendBg({
    type: 'GET_MEDIA_DETAILS',
    mediaType: currentMedia.mediaType,
    tmdbId: currentMedia.tmdbId
  });
  hideLoader();

  if (!detailRes.ok || !detailRes.data?.db_record?.id) {
    showSaveMsg('error', 'İçerik kaydedilemedi. Lütfen tekrar deneyin.');
    return;
  }

  const mediaId = detailRes.data.db_record.id;
  const mVal = inputMinutes.value;
  const sVal = inputSeconds.value;
  let stopped_at = undefined;

  if (mVal !== '' || sVal !== '') {
    const m = parseInt(mVal) || 0;
    const s = parseInt(sVal) || 0;
    stopped_at = (m * 60) + s;
  }

  showLoader();
  let ok = true;

  if (currentMedia.mediaType === 'tv' && detectedSeason && detectedEpisode) {
    const epPayload = {
      type: 'SAVE_EPISODE_PROGRESS',
      mediaId,
      season_number: detectedSeason,
      episode_number: detectedEpisode,
      is_watched: checkboxWatched.checked,
      rating: selectedRating || null
    };
    if (stopped_at !== undefined) epPayload.stopped_at = stopped_at;
    const epRes = await sendBg(epPayload);
    if (!epRes.ok) ok = false;
  }

  const savePayload = {
    type: 'SAVE_PROGRESS',
    mediaId,
    status: selectedStatus,
    rating: selectedRating || null,
    watch_url: detectedUrl || null,
    platform: detectedPlatform || null
  };
  if (stopped_at !== undefined) savePayload.stopped_at = stopped_at;

  const saveRes = await sendBg(savePayload);
  if (!saveRes.ok) ok = false;

  hideLoader();

  if (ok) {
    showSaveMsg('success', `✓ "${currentMedia.title}" listenize eklendi!`);
    await loadMyList();
    
    // Kayıt başarılıysa background tracking başlat
    currentMedia.id = mediaId;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      sendBg({ 
        type: 'TRACK_TAB', 
        tabId: tab.id, 
        mediaId: currentMedia.id,
        title: currentMedia.title 
      });
    }
  } else {
    showSaveMsg('error', 'Kaydedilemedi. Lütfen tekrar deneyin.');
  }
});

function showSaveMsg(type, text) {
  saveMsg.textContent = text;
  saveMsg.className = `save-msg ${type}`;
  saveMsg.classList.remove('hidden');
  setTimeout(() => saveMsg.classList.add('hidden'), 4000);
}

// ─── Temizle ─────────────────────────────────────────────────────────────────
btnClear.addEventListener('click', clearSelection);
function clearSelection() {
  currentMedia = null;
  selectedStatus = '';
  selectedRating = 0;
  selectedMedia.classList.add('hidden');
  searchResults.classList.add('hidden');
  episodeSection.classList.add('hidden');
  inputSearch.value = '';
  inputMinutes.value = '';
  inputSeconds.value = '';
}

// ─── Son Eklenenler Listesi ───────────────────────────────────────────────────
async function loadMyList() {
  const res = await sendBg({ type: 'GET_PROGRESS' });
  if (!res.ok || !res.data?.length) {
    myList.innerHTML = '<div style="color:#475569;font-size:12px;text-align:center;padding:8px">Henüz eklenen içerik yok.</div>';
    return;
  }

  // Sadece izlenen ve izlenecek olanları filtrele
  const filtered = res.data.filter(item => item.status === 'watching' || item.status === 'plan_to_watch');
  
  if (!filtered.length) {
    myList.innerHTML = '<div style="color:#475569;font-size:12px;text-align:center;padding:8px">İzlenen veya izlenecek içerik bulunamadı.</div>';
    return;
  }

  // Son 5 güncellenen/eklenen
  const items = filtered.slice(0, 5); // Backend'den gelen sıra en yeni üstte olabilir. Eğer değilse: filtered.reverse().slice(0, 5);
  myList.innerHTML = '';
  items.forEach(item => {
    if (!item.media) return;
    const div = document.createElement('div');
    div.className = 'list-item';
    const poster = item.media.poster_path
      ? `https://image.tmdb.org/t/p/w92${item.media.poster_path}` : '';
    div.innerHTML = `
      <img class="list-item-poster" src="${poster}" alt="${item.media.title}" />
      <span class="list-item-title">${item.media.title}</span>
      <span class="list-item-status status-${item.status}">${STATUS_LABELS[item.status] || item.status}</span>`;
    
    div.style.cursor = 'pointer';
    div.addEventListener('mouseenter', () => div.style.background = '#22223a');
    div.addEventListener('mouseleave', () => div.style.background = '#1a1a26');
    div.addEventListener('click', () => {
      // Create a mock object that selectMedia can understand
      selectMedia({
        id: item.media.tmdb_id,
        media_type: item.media.type,
        title: item.media.title,
        name: item.media.title,
        poster_path: item.media.poster_path
      });
    });

    myList.appendChild(div);
  });
}

// ─── Başlat ───────────────────────────────────────────────────────────────────
buildStars();
init();
