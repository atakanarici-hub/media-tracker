import { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Play, MonitorPlay } from 'lucide-react';

export default function TrailerModal({ isOpen, onClose, mediaType, mediaId, title }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !mediaId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/media/${mediaType}/${mediaId}`);
        setData(res.data.tmdb_data);
      } catch (err) {
        console.error("Failed to fetch trailer and providers", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, mediaId, mediaType]);

  if (!isOpen) return null;

  // Find trailer
  let trailer = null;
  if (data?.videos?.results) {
    const vids = data.videos.results;
    // Öncelik: Türkçe fragman -> İngilizce fragman -> Herhangi bir YouTube videosu
    trailer = vids.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'tr')
           || vids.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.iso_639_1 === 'en')
           || vids.find(v => v.type === 'Trailer' && v.site === 'YouTube')
           || vids.find(v => v.site === 'YouTube');
  }

  // Find providers (TR öncelikli, yoksa US göster ve uyar)
  let providers = [];
  let providerRegion = 'Türkiye';
  
  if (data?.['watch/providers']?.results) {
    let regionData = data['watch/providers'].results.TR;
    if (!regionData) {
        regionData = data['watch/providers'].results.US;
        if (regionData) providerRegion = 'ABD (Türkiye\'de Yok)';
    }

    if (regionData) {
      // flatrate (abonelik), free (ücretsiz), ads (reklamlı)
      providers = [...(regionData.flatrate || []), ...(regionData.free || []), ...(regionData.ads || [])];
      // remove duplicates by provider_id
      providers = Array.from(new Map(providers.map(p => [p.provider_id, p])).values());
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white line-clamp-1">{title || 'Fragman & Platformlar'}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {/* Trailer */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-brand-red" /> Fragman
                </h3>
                {trailer ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-700">
                    Fragman bulunamadı.
                  </div>
                )}
              </div>

              {/* Providers */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-brand-blue" /> Nereden İzlenir? {providerRegion && <span className="text-sm text-zinc-500 font-normal">({providerRegion})</span>}
                </h3>
                {providers.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {providers.map(p => (
                      <div key={p.provider_id} className="flex flex-col items-center gap-2 w-20 text-center">
                        <img 
                          src={`https://image.tmdb.org/t/p/original${p.logo_path}`} 
                          alt={p.provider_name} 
                          className="w-12 h-12 rounded-xl shadow-md border border-zinc-700 object-cover"
                          title={p.provider_name}
                        />
                        <span className="text-[10px] leading-tight text-zinc-400 font-medium line-clamp-2">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-zinc-400 bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                    Bu içerik şu an herhangi bir dijital platformda yayınlanmıyor gibi görünüyor.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
