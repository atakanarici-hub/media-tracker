import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Giriş başarısız. Bilgilerinizi kontrol edin.');
    }
  };

  return (
    <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
      <div className="card p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-brand-blue">Giriş Yap</h2>
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" className="btn-primary mt-2">Giriş Yap</button>
        </form>
        <p className="text-center text-sm text-zinc-500 mt-4">
          Hesabın yok mu? <Link to="/register" className="text-brand-red hover:underline transition-colors">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}
