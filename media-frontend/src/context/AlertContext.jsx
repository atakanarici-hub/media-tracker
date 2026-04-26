import { createContext, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const AlertContext = createContext();

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'info') => {
    setAlert({ message, type });
  };

  const closeAlert = () => setAlert(null);

  const getIcon = () => {
    if (!alert) return null;
    switch (alert.type) {
      case 'error': return <AlertCircle className="w-12 h-12 text-brand-red mb-2" />;
      case 'success': return <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />;
      case 'info':
      default: return <Info className="w-12 h-12 text-brand-blue mb-2" />;
    }
  };

  return (
    <AlertContext.Provider value={showAlert}>
      {children}
      {alert && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAlert} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center flex flex-col items-center animate-in fade-in zoom-in duration-200">
            {getIcon()}
            <p className="text-white text-lg font-medium">{alert.message}</p>
            <button 
              onClick={closeAlert}
              className="mt-6 px-8 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all font-semibold active:scale-95"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}
