import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, LogOut, Home, Search, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-bg-card border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-brand-blue font-bold text-xl">
              <Film className="w-6 h-6 text-brand-red" />
              <span>MediaTracker</span>
            </Link>
            {user && (
              <div className="hidden md:flex items-center gap-4">
                <Link to="/" className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"><Home className="w-4 h-4"/> Dashboard</Link>
                <Link to="/search" className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"><Search className="w-4 h-4"/> Keşfet</Link>
                <Link to="/timeline" className="text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"><MessageSquare className="w-4 h-4"/> Timeline</Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-zinc-700 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-sm shrink-0 border border-zinc-600">
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
                    <span className="text-sm text-zinc-300 hidden sm:block">Merhaba, <span className="text-brand-blue font-semibold">{user.name}</span></span>
                  </Link>
                </div>
                <button onClick={logout} className="text-brand-red hover:text-red-400 p-2 rounded-full hover:bg-zinc-800 transition-colors" title="Çıkış Yap">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="text-zinc-300 hover:text-white px-3 py-2 rounded-md transition-colors">Giriş Yap</Link>
                <Link to="/register" className="btn-primary">Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
