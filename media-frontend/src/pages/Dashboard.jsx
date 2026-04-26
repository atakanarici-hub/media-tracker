import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { PlayCircle, CheckCircle, Clock, XCircle, Star, ExternalLink, Trash2 } from 'lucide-react';

const STATUS_CONFIG = {
  watching:      { label: 'İzleniyor',     color: 'text-brand-blue',  icon: PlayCircle },
  completed:     { label: 'Tamamlandı',    color: 'text-green-500',   icon: CheckCircle },
  plan_to_watch: { label: 'İzlenecekler',  color: 'text-yellow-500',  icon: Clock },
  dropped:       { label: 'Bırakıldı',     color: 'text-brand-red',   icon: XCircle },
};

const PLATFORM_STYLES = {
  'Netflix':     { icon: '🔴', bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30' },
  'Prime Video': { icon: '🔵', bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30' },
  'Disney+':     { icon: '🔷', bg: 'bg-sky-500/15',    text: 'text-sky-400',    border: 'border-sky-500/30' },
  'Max':         { icon: '🟣', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Apple TV+':   { icon: '⬛', bg: 'bg-zinc-500/15',   text: 'text-zinc-300',   border: 'border-zinc-500/30' },
  'BluTV':       { icon: '🟦', bg: 'bg-blue-600/15',   text: 'text-blue-300',   border: 'border-blue-600/30' },
  'Exxen':       { icon: '🟧', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  'Gain':        { icon: '🟩', bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30' },
  'Tabii':       { icon: '🟩', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get('/progress');
        setProgressData(res.data);
      } catch (err) {
        console.error('Failed to fetch progress');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const handleDelete = async (mediaId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Bu içeriği listenden kaldırmak istediğine emin misin?')) return;
    
    try {
      await api.delete(`/progress/${mediaId}`);
      setProgressData(prev => prev.filter(item => item.media_id !== mediaId));
    } catch (err) {
      console.error('Failed to delete progress', err);
      alert('İçerik kaldırılırken bir hata oluştu.');
    }
  };

  if (loading) return <div className="p-8 text-center text-zinc-400">Yükleniyor...</div>;

  const statusPriority = {
    'watching': 1,
    'plan_to_watch': 2,
    'completed': 3,
    'dropped': 4
  };

  const sortedData = [...progressData].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'status':
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      case 'title':
        return (a.media?.title || '').localeCompare(b.media?.title || '');
      case 'recent':
      default:
        return new Date(b.updated_at) - new Date(a.updated_at);
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white border-l-4 border-brand-red pl-4">İzlediklerim &amp; Listem</h1>
        
        {progressData.length > 0 && (
          <select 
            className="input bg-zinc-900 border-zinc-700 text-sm py-2 px-3 w-full sm:w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="recent">Son Güncellenenler</option>
            <option value="status">Duruma Göre</option>
            <option value="rating">Puana Göre (Yüksek - Düşük)</option>
            <option value="title">İsme Göre (A-Z)</option>
          </select>
        )}
      </div>

      {progressData.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-zinc-400 mb-4">Henüz listene hiçbir şey eklememişsin.</p>
          <Link to="/search" className="btn-primary">Hemen Keşfet</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedData.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || {};
            const StatusIcon = cfg.icon;
            const imdbRating = item.media?.vote_average;
            const siteRating = item.site_avg_rating;
            const pStyle = item.platform ? PLATFORM_STYLES[item.platform] : null;

            return (
              <div key={item.id} className="card group hover:ring-2 hover:ring-brand-blue transition-all duration-300 flex flex-col h-full">
                {/* Poster — tıklanınca detay sayfası */}
                <Link to={`/media/${item.media.type}/${item.media.tmdb_id}`}>
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {item.media.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.media.poster_path}`}
                        alt={item.media.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">Resim Yok</div>
                    )}

                    {/* Durum rozeti */}
                    {StatusIcon && (
                      <div className="absolute top-2 right-2 bg-zinc-900/80 backdrop-blur-sm p-2 rounded-full shadow-lg">
                        <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                    )}

                    {/* Platform rozeti (sol üst) */}
                    {pStyle && (
                      <div className={`absolute top-2 left-2 ${pStyle.bg} backdrop-blur-sm border ${pStyle.border} px-2 py-1 rounded-full shadow-lg flex items-center gap-1`}>
                        <span className="text-xs">{pStyle.icon}</span>
                        <span className={`text-[10px] font-bold ${pStyle.text}`}>{item.platform}</span>
                      </div>
                    )}

                    {/* Puan overlay (sol alt) */}
                    {(imdbRating || siteRating) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 flex gap-3">
                        {imdbRating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-yellow-400" title="TMDB Puanı">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-bold">{Number(imdbRating).toFixed(1)}</span>
                            <span className="text-yellow-400/60">TMDB</span>
                          </div>
                        )}
                        {siteRating && (
                          <div className="flex items-center gap-1 text-xs text-brand-blue" title="Kullanıcı Ortalaması">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-bold">{siteRating}</span>
                            <span className="text-brand-blue/60">Site</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Alt bilgi */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <Link to={`/media/${item.media.type}/${item.media.tmdb_id}`}>
                    <h3 className="font-semibold text-lg text-white line-clamp-1 mb-1">{item.media.title}</h3>
                  </Link>
                  <div className="flex flex-col gap-1.5 text-sm">
                    <span className={`font-medium ${cfg.color}`}>
                      {item.status === 'watching' && item.last_episode
                        ? `▶ ${item.last_episode}`
                        : cfg.label}
                    </span>
                    
                    {/* Kaldığı süre bilgisi */}
                    {item.stopped_at > 0 && (
                      <span className="text-zinc-400 text-xs">
                        Kaldığın yer: <span className="text-white font-bold">{formatTime(item.stopped_at)}</span>
                      </span>
                    )}

                    {item.rating && (
                      <span className="text-zinc-400 text-xs">Puanın: <span className="text-white font-bold">★ {item.rating}/10</span></span>
                    )}

                    {/* Alt satır: Butonlar */}
                    <div className="flex items-center justify-between mt-1">
                      {item.watch_url && item.status !== 'completed' ? (
                        <a
                          href={item.watch_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-xs font-semibold hover:bg-brand-blue/20 transition-all duration-200"
                          title={item.watch_url}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>▶ Devam Et</span>
                        </a>
                      ) : (
                        <div />
                      )}

                      <button
                        onClick={(e) => handleDelete(item.media_id, e)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                        title="Listeden Kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

