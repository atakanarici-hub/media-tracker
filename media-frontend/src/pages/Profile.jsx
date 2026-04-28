import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import api from '../api/axios';
import { Camera, Edit3, Save, X, Calendar, Film } from 'lucide-react';
import { Link } from 'react-router-dom';

const GENRES = [
  'Aksiyon', 'Macera', 'Animasyon', 'Komedi', 'Suç', 'Belgesel', 'Dram', 'Aile', 
  'Fantastik', 'Tarih', 'Korku', 'Müzik', 'Gizem', 'Romantik', 'Bilim Kurgu', 
  'Gerilim', 'Savaş', 'Vahşi Batı', 'Reality', 'Talk Show'
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const showAlert = useAlert();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setFavoriteGenres(user.favorite_genres || []);
      fetchUserPosts(user.id);
    }
  }, [user]);

  const fetchUserPosts = async (userId) => {
    try {
      const res = await api.get(`/posts?user_id=${userId}`);
      const fetchedPosts = res.data.data ? res.data.data : res.data;
      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const res = await api.post('/profile/picture', formData);
      updateUser(res.data);
      showAlert('Profil fotoğrafı güncellendi!', 'success');
    } catch (err) {
      showAlert('Fotoğraf güncellenemedi.', 'error');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await api.put('/profile', {
        name,
        bio,
        favorite_genres: favoriteGenres
      });
      updateUser(res.data);
      setIsEditing(false);
      showAlert('Profil güncellendi!', 'success');
    } catch (err) {
      showAlert('Profil güncellenemedi.', 'error');
    }
  };

  const toggleGenre = (genre) => {
    if (favoriteGenres.includes(genre)) {
      setFavoriteGenres(favoriteGenres.filter(g => g !== genre));
    } else {
      setFavoriteGenres([...favoriteGenres, genre]);
    }
  };

  if (!user) return <div className="p-8 text-center text-white">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profil Başlığı */}
      <div className="card p-8 mb-8 relative overflow-hidden">
        {/* Dekoratif Arka Plan */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-blue/20 to-brand-red/20 opacity-30 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10 mt-8">
          {/* Profil Fotoğrafı Alanı */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-bg-dark bg-zinc-800 flex items-center justify-center text-4xl font-bold text-white shadow-xl relative z-10">
              {user.profile_picture ? (
                <img 
                  src={`http://localhost:8000/storage/${user.profile_picture}`} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Fotoğraf Değiştirme Overlay */}
            <div 
              className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
              onClick={handleProfilePictureClick}
            >
              <Camera className="text-white w-8 h-8" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Profil Bilgileri */}
          <div className="flex-grow pt-2">
            {!isEditing ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-3xl font-bold text-white">{user.name}</h1>
                    <div className="flex items-center gap-2 text-zinc-400 mt-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(user.created_at).toLocaleDateString('tr-TR')} tarihinde katıldı</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
                  >
                    <Edit3 className="w-4 h-4" /> Profili Düzenle
                  </button>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Hakkımda</h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {user.bio || 'Henüz bir açıklama eklenmemiş.'}
                  </p>
                </div>

                {user.favorite_genres && user.favorite_genres.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Favori Türler</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.favorite_genres.map(genre => (
                        <span key={genre} className="bg-zinc-800 text-brand-blue px-3 py-1 rounded-full text-sm font-medium border border-zinc-700">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Ad Soyad</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-dark border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Hakkımda</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Kendinizden bahsedin..."
                    className="w-full bg-bg-dark border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-brand-blue transition-colors h-32 resize-none"
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-400 mb-3">İlgilenilen Türler (Film/Dizi)</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors border ${
                          favoriteGenres.includes(genre)
                            ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kullanıcının Paylaşımları */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-l-4 border-brand-red pl-3">
          <Film className="w-5 h-5 text-brand-red" />
          Zaman Tünelim
        </h2>
        
        {loadingPosts ? (
          <div className="text-zinc-400 animate-pulse">Gönderiler yükleniyor...</div>
        ) : posts.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-500 mb-4">Henüz bir paylaşım yapmadınız.</p>
            <Link to="/timeline" className="btn-secondary inline-block">
              Timeline'a Git ve Bir Şeyler Paylaş
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map(post => (
              <div key={post.id} className="card p-5 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-zinc-700 rounded-full overflow-hidden flex items-center justify-center text-white font-bold shrink-0">
                    {user.profile_picture ? (
                      <img 
                        src={`http://localhost:8000/storage/${user.profile_picture}`} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user.name}</div>
                    <div className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString('tr-TR')}</div>
                  </div>
                </div>
                
                <p className="text-zinc-200 text-lg mb-2">{post.content}</p>
                
                {post.media && (
                  <Link to={`/media/${post.media.type}/${post.media.tmdb_id}`} className="mt-4 bg-zinc-900/80 border border-zinc-800 rounded-lg p-3 flex items-center gap-4 hover:border-brand-blue transition-colors group">
                    {post.media.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w200${post.media.poster_path}`} 
                        className="w-14 h-20 object-cover rounded shadow-md group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className="w-14 h-20 bg-zinc-800 rounded flex items-center justify-center text-zinc-600">
                        <Film className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-brand-red font-medium uppercase tracking-wider mb-1">Şunun hakkında</div>
                      <div className="font-bold text-white text-lg group-hover:text-brand-blue transition-colors">{post.media.title}</div>
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
