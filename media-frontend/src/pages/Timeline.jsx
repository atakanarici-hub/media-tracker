import { useState, useEffect } from 'react';
import api from '../api/axios';
import { MessageSquare, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';

export default function Timeline() {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const showAlert = useAlert();

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      // If the backend returns paginated data, the actual posts are in res.data.data
      const fetchedPosts = res.data.data ? res.data.data : res.data;
      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await api.post('/posts', { content });
      setContent('');
      fetchPosts();
    } catch (err) {
      showAlert('Gönderi paylaşılamadı.', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-white flex items-center gap-2 border-l-4 border-brand-blue pl-4">
        <MessageSquare className="text-brand-blue"/> Timeline
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-10">
        <div className="relative">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ne izliyorsun, aklından neler geçiyor?" 
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white focus:outline-none focus:border-brand-red resize-none h-28"
          ></textarea>
          <button type="submit" className="absolute bottom-4 right-4 bg-brand-red hover:bg-red-600 text-white p-2 rounded-full transition-colors cursor-pointer">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>

      {loading ? <div className="text-zinc-400">Yükleniyor...</div> : (
        <div className="flex flex-col gap-6">
          {posts.map(post => (
            <div key={post.id} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                  {post.user?.profile_picture ? (
                    <img 
                      src={`http://localhost:8000/storage/${post.user.profile_picture}`} 
                      alt={post.user?.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    post.user?.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">{post.user?.name}</div>
                  <div className="text-xs text-zinc-500">{new Date(post.created_at).toLocaleString('tr-TR')}</div>
                </div>
              </div>
              <p className="text-zinc-300">{post.content}</p>
              
              {post.media && (
                <Link to={`/media/${post.media.type}/${post.media.tmdb_id}`} className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3 hover:border-brand-blue transition-colors">
                  {post.media.poster_path && <img src={`https://image.tmdb.org/t/p/w200${post.media.poster_path}`} className="w-12 h-16 object-cover rounded" />}
                  <div>
                    <div className="text-sm text-zinc-400">Şunun hakkında:</div>
                    <div className="font-bold text-white">{post.media.title}</div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
