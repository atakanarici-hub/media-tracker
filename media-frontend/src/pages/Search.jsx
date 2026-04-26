import { useState, useEffect, useRef, useMemo } from 'react';
import api from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Film, Tv, X, Star, SlidersHorizontal, ChevronDown } from 'lucide-react';

// ─── Debounce Hook ────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ─── Select Dropdown Bileşeni ─────────────────────────────────────────────────
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-zinc-800 border border-zinc-700 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:border-brand-blue cursor-pointer hover:border-zinc-600 transition-colors"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
    </div>
  );
}

// ─── Ana Sayfa ────────────────────────────────────────────────────────────────
export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtre & Sıralama state
  const [filterType, setFilterType] = useState('all');       // all | movie | tv
  const [filterYear, setFilterYear] = useState('all');       // all | 2024 | 2023 | ...
  const [filterMinRating, setFilterMinRating] = useState('0'); // 0–9
  const [sortBy, setSortBy] = useState('popularity');         // popularity | rating | year_desc | year_asc | name

  const inputRef = useRef(null);
  const suggestBoxRef = useRef(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Yıl seçenekleri (son 30 yıl)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: 'all', label: 'Tüm Yıllar' },
    ...Array.from({ length: 30 }, (_, i) => {
      const y = currentYear - i;
      return { value: String(y), label: String(y) };
    })
  ];

  // Yazınca öneri getir
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const fetchSuggestions = async () => {
      setSuggestLoading(true);
      try {
        const res = await api.get(`/media/search?q=${debouncedQuery}`);
        setSuggestions(res.data.slice(0, 6));
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  // Dışarıya tıklayınca dropdown kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestBoxRef.current && !suggestBoxRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/media/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (item) => {
    setShowSuggestions(false);
    setQuery(item.title || item.name);
    navigate(`/media/${item.media_type}/${item.id}`);
  };

  const clearQuery = () => {
    setQuery('');
    setSuggestions([]);
    setResults([]);
    setSearched(false);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const resetFilters = () => {
    setFilterType('all');
    setFilterYear('all');
    setFilterMinRating('0');
    setSortBy('popularity');
  };

  // ─── Filtre + Sıralama Uygula ──────────────────────────────────────────────
  const filteredResults = useMemo(() => {
    let arr = [...results];

    // Tür filtresi
    if (filterType !== 'all') {
      arr = arr.filter(item => item.media_type === filterType);
    }

    // Yıl filtresi
    if (filterYear !== 'all') {
      arr = arr.filter(item => {
        const date = item.release_date || item.first_air_date || '';
        return date.startsWith(filterYear);
      });
    }

    // Min puan filtresi
    const minR = parseFloat(filterMinRating);
    if (minR > 0) {
      arr = arr.filter(item => (item.vote_average || 0) >= minR);
    }

    // Sıralama
    arr.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'rating':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'year_desc': {
          const da = a.release_date || a.first_air_date || '';
          const db = b.release_date || b.first_air_date || '';
          return db.localeCompare(da);
        }
        case 'year_asc': {
          const da = a.release_date || a.first_air_date || '';
          const db = b.release_date || b.first_air_date || '';
          return da.localeCompare(db);
        }
        case 'name': {
          const na = (a.title || a.name || '').toLowerCase();
          const nb = (b.title || b.name || '').toLowerCase();
          return na.localeCompare(nb, 'tr');
        }
        default:
          return 0;
      }
    });

    return arr;
  }, [results, filterType, filterYear, filterMinRating, sortBy]);

  const hasActiveFilters = filterType !== 'all' || filterYear !== 'all' || filterMinRating !== '0' || sortBy !== 'popularity';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white border-l-4 border-brand-blue pl-4">Keşfet</h1>

      {/* ─── Arama Kutusu ─────────────────────────────────────────────────── */}
      <div className="mb-6 max-w-2xl mx-auto relative">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Film veya dizi ara..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-full py-4 pl-14 pr-24 text-white text-lg focus:outline-none focus:border-brand-blue transition-colors shadow-lg"
          />
          <div className="absolute right-2 top-2 bottom-2 flex items-center gap-1">
            {query && (
              <button type="button" onClick={clearQuery} className="text-zinc-500 hover:text-white p-2 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <button type="submit" className="bg-brand-blue hover:bg-blue-600 text-white rounded-full p-3 transition-colors cursor-pointer">
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Öneri Dropdown */}
        {showSuggestions && (
          <div ref={suggestBoxRef} className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            {suggestLoading ? (
              <div className="px-5 py-4 text-sm text-zinc-400 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                Aranıyor...
              </div>
            ) : suggestions.length > 0 ? (
              <ul>
                {suggestions.map((item, idx) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSuggestionClick(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left ${idx < suggestions.length - 1 ? 'border-b border-zinc-800' : ''}`}
                    >
                      <div className="w-10 h-14 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                        {item.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.media_type === 'movie' ? <Film className="w-4 h-4 text-zinc-600" /> : <Tv className="w-4 h-4 text-zinc-600" />}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-white font-medium truncate">{item.title || item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${item.media_type === 'movie' ? 'bg-brand-red/20 text-brand-red' : 'bg-brand-blue/20 text-brand-blue'}`}>
                            {item.media_type === 'movie' ? 'Film' : 'Dizi'}
                          </span>
                          <span className="text-xs text-zinc-500">{(item.release_date || item.first_air_date || '').substring(0, 4)}</span>
                          {item.vote_average > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                              <Star className="w-3 h-3 fill-current" /> {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={handleSearch} className="w-full text-center text-sm text-brand-blue hover:text-blue-400 py-3 border-t border-zinc-800 transition-colors">
                    "<span className="font-semibold">{query}</span>" için tüm sonuçları gör →
                  </button>
                </li>
              </ul>
            ) : (
              <div className="px-5 py-4 text-sm text-zinc-500">Sonuç bulunamadı.</div>
            )}
          </div>
        )}
      </div>

      {/* ─── Filtre & Sıralama Çubuğu ─────────────────────────────────────── */}
      {searched && results.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mr-1">
            <SlidersHorizontal className="w-4 h-4 text-brand-blue" />
            Filtrele & Sırala
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-grow">
            {/* Tür */}
            <FilterSelect
              label="Tür"
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: '🎬 Tümü' },
                { value: 'movie', label: '🎥 Film' },
                { value: 'tv', label: '📺 Dizi' },
              ]}
            />

            {/* Yıl */}
            <FilterSelect
              label="Yıl"
              value={filterYear}
              onChange={setFilterYear}
              options={yearOptions}
            />

            {/* Min Puan */}
            <FilterSelect
              label="Min Puan"
              value={filterMinRating}
              onChange={setFilterMinRating}
              options={[
                { value: '0', label: '⭐ Tüm Puanlar' },
                { value: '9', label: '⭐ 9+ Puan' },
                { value: '8', label: '⭐ 8+ Puan' },
                { value: '7', label: '⭐ 7+ Puan' },
                { value: '6', label: '⭐ 6+ Puan' },
                { value: '5', label: '⭐ 5+ Puan' },
              ]}
            />

            {/* Sıralama */}
            <FilterSelect
              label="Sırala"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'popularity', label: '🔥 Popülerlik' },
                { value: 'rating', label: '⭐ En Yüksek Puan' },
                { value: 'year_desc', label: '📅 En Yeni' },
                { value: 'year_asc', label: '📅 En Eski' },
                { value: 'name', label: '🔤 İsim (A-Z)' },
              ]}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Sonuç sayısı */}
            <span className="text-xs text-zinc-500">
              {filteredResults.length} / {results.length} sonuç
            </span>

            {/* Filtreleri sıfırla */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" /> Sıfırla
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Yükleniyor / Sonuç Yok ───────────────────────────────────────── */}
      {loading && <div className="text-center text-zinc-400">Aranıyor...</div>}
      {!loading && searched && results.length === 0 && (
        <div className="text-center text-zinc-400">Sonuç bulunamadı.</div>
      )}
      {!loading && searched && results.length > 0 && filteredResults.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400 mb-3">Seçilen filtrelere uyan sonuç bulunamadı.</p>
          <button onClick={resetFilters} className="text-brand-blue hover:underline text-sm">Filtreleri temizle</button>
        </div>
      )}

      {/* ─── Sonuç Kartları ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredResults.map((item) => (
          <Link key={item.id} to={`/media/${item.media_type}/${item.id}`} className="card group hover:ring-2 hover:ring-brand-red transition-all duration-300">
            <div className="relative aspect-[2/3] overflow-hidden bg-zinc-800">
              {item.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={item.title || item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                  <Film className="w-12 h-12 mb-2 opacity-50" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                {item.media_type === 'movie' ? <Film className="w-3 h-3 text-brand-red" /> : <Tv className="w-3 h-3 text-brand-blue" />}
                {item.media_type === 'movie' ? 'Film' : 'Dizi'}
              </div>
              {item.vote_average > 0 && (
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs text-yellow-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {item.vote_average.toFixed(1)}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-white truncate" title={item.title || item.name}>{item.title || item.name}</h3>
              <p className="text-xs text-zinc-400 mt-1">{(item.release_date || item.first_air_date || '').substring(0, 4)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
