import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { Star, Clock, CheckCircle, PlayCircle, ChevronDown, ChevronUp, Play } from 'lucide-react';
import TrailerModal from '../components/TrailerModal';
import { useAlert } from '../context/AlertContext';

// ─── Yıldız Puanlama Bileşeni ───────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false, size = 'sm' }) {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readOnly}
        onClick={() => !readOnly && onChange(star)}
        onMouseEnter={() => !readOnly && setHover(star)}
        onMouseLeave={() => !readOnly && setHover(0)}
        className={`transition-colors ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <Star
          className={`${sizeClass} transition-colors ${star <= (hover || value)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-zinc-600'
            }`}
        />
      </button>
    ))}
    {value > 0 ? (
      <span className="ml-1 text-xs font-bold text-yellow-400">{value}/10</span>
    ) : null}
  </div>
);
}

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────
function formatTime(totalSeconds) {
  if (!totalSeconds) return null;
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Ana Sayfa Bileşeni ──────────────────────────────────────────────────────
export default function MediaDetails() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Progress state
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [stoppedAt, setStoppedAt] = useState(null);
  const [trailerModalOpen, setTrailerModalOpen] = useState(false);
  const showAlert = useAlert();

  // Episode tracking state
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [userEpisodes, setUserEpisodes] = useState([]);
  const [lastEpisode, setLastEpisode] = useState(null);

  // Bölüm başına hover edilen puan (geçici input)
  const [episodeRatingInput, setEpisodeRatingInput] = useState({});

  const fetchDetails = async () => {
    try {
      const res = await api.get(`/media/${type}/${id}`);
      setData(res.data);

      if (res.data.db_record) {
        const progRes = await api.get(`/progress/${res.data.db_record.id}`);
        if (progRes.data) {
          setStatus(progRes.data.status);
          setRating(progRes.data.rating || '');
          setStoppedAt(progRes.data.stopped_at || null);
        }

        if (type === 'tv') {
          const epRes = await api.get(`/progress/${res.data.db_record.id}/episodes`);
          setUserEpisodes(epRes.data);
          calculateLastEpisode(epRes.data);

          // Mevcut bölüm puanlarını input state'e yükle
          const initialRatings = {};
          epRes.data.forEach(ep => {
            if (ep.rating) {
              initialRatings[`${ep.season_number}_${ep.episode_number}`] = ep.rating;
            }
          });
          setEpisodeRatingInput(initialRatings);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLastEpisode = (episodes) => {
    const watched = episodes.filter(ep => ep.is_watched);
    if (watched.length === 0) { setLastEpisode(null); return; }
    watched.sort((a, b) => {
      if (a.season_number !== b.season_number) return b.season_number - a.season_number;
      return b.episode_number - a.episode_number;
    });
    const last = watched[0];
    setLastEpisode(`S${String(last.season_number).padStart(2, '0')}E${String(last.episode_number).padStart(2, '0')}`);
  };

  useEffect(() => { fetchDetails(); }, [type, id]);

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    if (!status) return showAlert('Lütfen bir durum seçin', 'error');
    try {
      await api.post(`/progress/${data.db_record.id}`, {
        status,
        rating: rating ? parseInt(rating) : null
      });
      showAlert('İzleme durumu güncellendi!', 'success');
      
      if (type === 'tv') {
        const epRes = await api.get(`/progress/${data.db_record.id}/episodes`);
        setUserEpisodes(epRes.data);
        calculateLastEpisode(epRes.data);
      }
    } catch (err) {
      showAlert('Durum güncellenirken hata oluştu', 'error');
    }
  };

  const handleSeasonClick = async (seasonNumber) => {
    if (selectedSeason === seasonNumber) { setSelectedSeason(null); setSeasonData(null); return; }
    setSelectedSeason(seasonNumber);
    setSeasonLoading(true);
    try {
      const res = await api.get(`/media/tv/${id}/season/${seasonNumber}`);
      setSeasonData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSeasonLoading(false);
    }
  };

  // Tüm sezonu toplu olarak izlendi işaretle
  const markAllEpisodes = async (e, season) => {
    e.stopPropagation();
    if (!data.db_record) return showAlert('Lütfen önce dizinin durumunu (İzleniyor vs) kaydedin!', 'error');

    let episodes = [];
    if (selectedSeason === season.season_number && seasonData?.episodes) {
      episodes = seasonData.episodes;
    } else {
      try {
        const res = await api.get(`/media/tv/${id}/season/${season.season_number}`);
        episodes = res.data?.episodes || [];
      } catch (err) {
        return showAlert('Sezon bilgileri alınamadı.', 'error');
      }
    }

    if (episodes.length === 0) return;

    // Sadece yayınlanmış bölümleri filtrele
    const airedEpisodes = episodes.filter(ep => ep.air_date && new Date(ep.air_date) <= new Date());
    if (airedEpisodes.length === 0) return showAlert('Bu sezonda henüz yayınlanmış bölüm yok.', 'error');

    try {
      const results = await Promise.all(
        airedEpisodes.map(ep =>
          api.post(`/progress/${data.db_record.id}/episode`, {
            season_number: ep.season_number,
            episode_number: ep.episode_number,
            is_watched: true
          })
        )
      );

      let updatedEpisodes = [...userEpisodes];
      results.forEach(res => {
        const ep = res.data;
        const idx = updatedEpisodes.findIndex(
          e => e.season_number === ep.season_number && e.episode_number === ep.episode_number
        );
        if (idx >= 0) updatedEpisodes[idx] = ep;
        else updatedEpisodes.push(ep);
      });
      setUserEpisodes(updatedEpisodes);
      calculateLastEpisode(updatedEpisodes);
      showAlert('Tüm sezon işaretlendi.', 'success');
    } catch (err) {
      showAlert('Bazı bölümler işaretlenemedi.', 'error');
    }
  };

  // Tüm sezondaki izlendi işaretlerini kaldır
  const unmarkAllEpisodes = async (e, season) => {
    e.stopPropagation();
    if (!data.db_record) return;

    const seasonEps = userEpisodes.filter(
      ep => ep.season_number === season.season_number && ep.is_watched
    );
    if (seasonEps.length === 0) return;

    try {
      await Promise.all(
        seasonEps.map(ep =>
          api.post(`/progress/${data.db_record.id}/episode`, {
            season_number: ep.season_number,
            episode_number: ep.episode_number,
            is_watched: false
          })
        )
      );

      const updatedEpisodes = userEpisodes.map(ep =>
        ep.season_number === season.season_number ? { ...ep, is_watched: false } : ep
      );
      setUserEpisodes(updatedEpisodes);
      calculateLastEpisode(updatedEpisodes);
      showAlert('Sezondaki işaretler kaldırıldı.', 'success');
    } catch (err) {
      showAlert('İşaret kaldırılamadı.', 'error');
    }
  };

  // Bir sezondaki tüm bölümler izlendi mi?
  const isSeasonWatched = (season) => {
    if (!season.episode_count) return false;
    const watchedCount = userEpisodes.filter(
      e => e.season_number === season.season_number && e.is_watched
    ).length;
    return watchedCount >= season.episode_count;
  };

  // Bölümü izlendi/izlenmedi + puan ile güncelle
  const markEpisode = async (season_number, episode_number, is_watched, episodeRating = null) => {
    if (!data.db_record) return showAlert('Lütfen önce dizinin durumunu (İzleniyor vs) kaydedin!', 'error');
    try {
      const payload = { season_number, episode_number, is_watched };
      if (episodeRating !== null) payload.rating = episodeRating;

      const res = await api.post(`/progress/${data.db_record.id}/episode`, payload);

      let updatedEpisodes = [...userEpisodes];
      const index = updatedEpisodes.findIndex(e => e.season_number === season_number && e.episode_number === episode_number);
      if (index >= 0) {
        updatedEpisodes[index] = res.data;
      } else {
        updatedEpisodes.push(res.data);
      }
      setUserEpisodes(updatedEpisodes);
      calculateLastEpisode(updatedEpisodes);

      // Puan state'ini de güncelle
      if (res.data.rating) {
        setEpisodeRatingInput(prev => ({
          ...prev,
          [`${season_number}_${episode_number}`]: res.data.rating
        }));
      }
    } catch (error) {
      showAlert('Bölüm kaydedilemedi.', 'error');
    }
  };

  // Puan seçilince: izlendi işaretle + puan kaydet
  const handleEpisodeRating = (season_number, episode_number, newRating) => {
    setEpisodeRatingInput(prev => ({ ...prev, [`${season_number}_${episode_number}`]: newRating }));
    markEpisode(season_number, episode_number, true, newRating);
  };

  const getEpisodeData = (season_number, episode_number) => {
    return userEpisodes.find(e => e.season_number === season_number && e.episode_number === episode_number);
  };

  const isEpisodeWatched = (season_number, episode_number) => {
    const ep = getEpisodeData(season_number, episode_number);
    return ep ? ep.is_watched : false;
  };

  // Bölüm yayınlandı mı?
  const isAired = (air_date) => {
    if (!air_date) return false;
    return new Date(air_date) <= new Date();
  };

  const getEpisodeRating = (season_number, episode_number) => {
    return episodeRatingInput[`${season_number}_${episode_number}`] || 0;
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Yükleniyor...</div>;
  if (!data) return <div className="p-8 text-center text-zinc-400">Bulunamadı.</div>;

  const tmdb = data.tmdb_data;

  // Extract Providers (TR öncelikli, yoksa US)
  let providers = [];
  let providerRegion = '';
  if (tmdb['watch/providers']?.results) {
    let regionData = tmdb['watch/providers'].results.TR;
    if (regionData) {
      providerRegion = 'Türkiye';
    } else {
      regionData = tmdb['watch/providers'].results.US;
      if (regionData) providerRegion = 'ABD';
    }

    if (regionData) {
      providers = [...(regionData.flatrate || []), ...(regionData.free || []), ...(regionData.ads || [])];
      providers = Array.from(new Map(providers.map(p => [p.provider_id, p])).values());
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sol Sütun - Afiş */}
        <div className="md:w-1/3 lg:w-1/4 flex-shrink-0">
          <img
            src={`https://image.tmdb.org/t/p/w500${tmdb.poster_path}`}
            alt={tmdb.title || tmdb.name}
            className="w-full rounded-xl shadow-2xl border border-zinc-800"
          />
        </div>

        {/* Sağ Sütun - Bilgiler */}
        <div className="flex-grow">
          <h1 className="text-4xl font-bold text-white mb-2">{tmdb.title || tmdb.name}</h1>
          <p className="text-zinc-400 text-lg mb-6">{tmdb.overview}</p>

          {/* Fragman ve Platformlar */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-6 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <button
              onClick={() => setTrailerModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-red text-white font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-brand-red/20"
            >
              <Play className="w-5 h-5 fill-current" /> Fragmanı İzle
            </button>

            {providers.length > 0 && (
              <div className="flex-1">
                <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                  Şu platformlarda yayında ({providerRegion}):
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {providers.map(p => (
                    <div key={p.provider_id} className="relative group">
                      <img 
                        src={`https://image.tmdb.org/t/p/original${p.logo_path}`} 
                        alt={p.provider_name} 
                        className="w-10 h-10 rounded-lg shadow-md border border-zinc-700 object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                        {p.provider_name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {providers.length === 0 && (
              <div className="flex-1 text-sm text-zinc-500">
                Türkiye veya ABD'de resmi dijital platformda bulunamadı.
              </div>
            )}
          </div>

          {lastEpisode && (
            <div className="mb-6 inline-flex items-center gap-2 bg-brand-blue/20 text-brand-blue px-4 py-2 rounded-lg font-bold border border-brand-blue/30">
              <PlayCircle className="w-5 h-5" /> En Son İzlenen Bölüm: {lastEpisode}
            </div>
          )}

          {/* Genel İzleme Durumu */}
          <div className="card p-6 border-l-4 border-l-brand-red mb-8 relative">
            {stoppedAt !== null && type === 'movie' && (
              <div className="absolute top-4 right-4 bg-zinc-800/80 px-3 py-1.5 rounded text-sm text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-red" /> Kaldığın Süre: <span className="font-bold text-white">{formatTime(stoppedAt)}</span>
              </div>
            )}
            <h3 className="text-xl font-bold text-white mb-4">Genel İzleme Durumun</h3>

            {/* Durum Pill Butonlar */}
            <div className="mb-5">
              <label className="block text-sm text-zinc-400 mb-2">Durum</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'watching', label: '▶ İzleniyor', active: 'bg-brand-blue text-white border-brand-blue', inactive: 'border-zinc-700 text-zinc-400 hover:border-brand-blue hover:text-brand-blue' },
                  { value: 'completed', label: '✓ Tamamlandı', active: 'bg-green-600 text-white border-green-600', inactive: 'border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400' },
                  { value: 'plan_to_watch', label: '⏰ İzlenecekler', active: 'bg-yellow-500 text-zinc-900 border-yellow-500', inactive: 'border-zinc-700 text-zinc-400 hover:border-yellow-500 hover:text-yellow-400' },
                  { value: 'dropped', label: '✕ Bırakıldı', active: 'bg-brand-red text-white border-brand-red', inactive: 'border-zinc-700 text-zinc-400 hover:border-brand-red hover:text-red-400' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(prev => prev === opt.value ? '' : opt.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${status === opt.value ? opt.active : opt.inactive
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Puan + Kaydet */}
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="w-full sm:w-48">
                <label className="block text-sm text-zinc-400 mb-2">Genel Puan (1-10)</label>
                <input
                  type="number" min="1" max="10"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="input-field"
                  placeholder="Puan ver..."
                />
              </div>
              <button
                onClick={handleUpdateProgress}
                disabled={!status}
                className="btn-primary w-full sm:w-auto disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Kaydet
              </button>
            </div>
          </div>

          {/* Sezonlar ve Bölümler */}
          {type === 'tv' && tmdb.seasons && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 border-l-4 border-brand-blue pl-3">Sezonlar</h3>
              <div className="flex flex-col gap-4">
                {tmdb.seasons.filter(s => s.season_number > 0).map(s => (
                  <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleSeasonClick(s.season_number)}
                      className="w-full p-4 flex justify-between items-center hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div>
                        <div className="font-bold text-white mb-1">{s.name}</div>
                        <div className="text-sm text-zinc-400">{s.episode_count} Bölüm</div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isSeasonWatched(s) ? (
                          <>
                            <span className="flex items-center gap-1 text-xs font-medium text-green-500 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Tamamlandı
                            </span>
                            <button
                              onClick={(e) => unmarkAllEpisodes(e, s)}
                              className="flex items-center gap-1 text-xs font-medium bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-2 py-1 rounded-full transition-colors"
                              title="Tüm izlendi işaretlerini kaldır"
                            >
                              Geri Al
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => markAllEpisodes(e, s)}
                            className="flex items-center gap-1 text-xs font-medium bg-brand-blue/10 hover:bg-brand-blue/30 text-brand-blue border border-brand-blue/30 px-2 py-1 rounded-full transition-colors"
                            title="Bu sezonu tümüyle izlendi olarak işaretle"
                          >
                            <CheckCircle className="w-3 h-3" /> İzlendi Olarak İşaretle
                          </button>
                        )}
                        {selectedSeason === s.season_number ? <ChevronUp className="text-brand-blue" /> : <ChevronDown className="text-zinc-500" />}
                      </div>
                    </button>

                    {/* Açılır Bölüm Listesi */}
                    {selectedSeason === s.season_number && (
                      <div className="bg-zinc-950 p-4 border-t border-zinc-800">
                        {seasonLoading ? (
                          <div className="text-center text-zinc-500 py-4">Bölümler yükleniyor...</div>
                        ) : seasonData && seasonData.episodes ? (
                          <div className="flex flex-col gap-4">
                            {seasonData.episodes.map(ep => {
                              const watched = isEpisodeWatched(ep.season_number, ep.episode_number);
                              const userRating = getEpisodeRating(ep.season_number, ep.episode_number);
                              const aired = isAired(ep.air_date);

                              return (
                                <div
                                  key={ep.id}
                                  className={`flex flex-col lg:flex-row gap-4 p-4 rounded-lg border transition-colors ${watched
                                    ? 'bg-zinc-900 border-green-600/30 ring-1 ring-green-600/20'
                                    : 'bg-zinc-900 border-zinc-800/50 hover:border-zinc-700'
                                    }`}
                                >
                                  {/* Bölüm Resmi */}
                                  <div className="lg:w-48 flex-shrink-0 relative">
                                    {ep.still_path ? (
                                      <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} className="w-full rounded object-cover aspect-video" />
                                    ) : (
                                      <div className="w-full aspect-video bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">Resim Yok</div>
                                    )}
                                    {watched && (
                                      <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                                        <CheckCircle className="w-3 h-3 text-white fill-white" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Bölüm İçeriği */}
                                  <div className="flex-grow flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-start flex-wrap gap-2">
                                        <h4 className="font-bold text-white text-lg">{ep.episode_number}. {ep.name}</h4>
                                        <div className="flex gap-3 text-sm">
                                          <div className="flex items-center gap-1 text-yellow-500" title="TMDB Puanı">
                                            <Star className="w-4 h-4 fill-current" /> {ep.vote_average ? ep.vote_average.toFixed(1) : '-'}
                                          </div>
                                          <div className="flex items-center gap-1 text-brand-blue" title="Site Ortalaması">
                                            <Star className="w-4 h-4 fill-current" /> {ep.site_rating ? ep.site_rating.toFixed(1) : '-'}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500 mb-3">
                                        <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ep.runtime || '-'} dk</div>
                                        <div>{ep.air_date || 'Tarih belirtilmedi'}</div>
                                        {!aired && (
                                          <span className="text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                            Henüz Yayınlanmadı
                                          </span>
                                        )}
                                        {watched && getEpisodeData(ep.season_number, ep.episode_number)?.stopped_at && (
                                          <div className="flex items-center gap-1 text-brand-blue font-semibold bg-brand-blue/10 px-2 py-0.5 rounded border border-brand-blue/20">
                                            <Clock className="w-3 h-3" /> Kaldığın Süre: {formatTime(getEpisodeData(ep.season_number, ep.episode_number).stopped_at)}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-sm text-zinc-400 line-clamp-2" title={ep.overview}>{ep.overview || 'Özet bulunmuyor.'}</p>
                                    </div>

                                    {/* Aksiyonlar */}
                                    <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-zinc-800/50 pt-3">
                                      {/* Yıldız Puanlama */}
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs text-zinc-500">Bölüm Puanın</span>
                                        {aired ? (
                                          <>
                                            <StarRating
                                              value={userRating}
                                              onChange={(newRating) => handleEpisodeRating(ep.season_number, ep.episode_number, newRating)}
                                            />
                                            {userRating === 0 && (
                                              <span className="text-xs text-zinc-600 italic">Puan vermek için yıldıza tıkla</span>
                                            )}
                                          </>
                                        ) : (
                                          <span className="text-xs text-zinc-600 italic">Yayınlanmadığı için puan verilemiyor</span>
                                        )}
                                      </div>

                                      {/* İzlendi Butonu */}
                                      {!aired ? (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-600 border border-zinc-700/50 bg-zinc-800/40 px-3 py-1.5 rounded-lg cursor-not-allowed">
                                          <Clock className="w-4 h-4" /> Yayınlanmadı
                                        </span>
                                      ) : watched ? (
                                        <button
                                          onClick={() => markEpisode(ep.season_number, ep.episode_number, false)}
                                          className="flex items-center gap-1.5 text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 whitespace-nowrap"
                                          title="İzlendi işaretini kaldır"
                                        >
                                          <CheckCircle className="w-4 h-4 fill-green-500/30" /> İzlendi
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => markEpisode(ep.season_number, ep.episode_number, true)}
                                          className="flex items-center gap-1.5 text-sm font-medium bg-zinc-800 hover:bg-green-600/20 hover:text-green-400 hover:border-green-600/30 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
                                        >
                                          <CheckCircle className="w-4 h-4 text-zinc-500" /> İzlendi Olarak İşaretle
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-zinc-500">Veri bulunamadı.</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <TrailerModal 
        isOpen={trailerModalOpen}
        onClose={() => setTrailerModalOpen(false)}
        mediaType={type}
        mediaId={id}
        title={tmdb.title || tmdb.name}
      />
    </div>
  );
}
