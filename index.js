// --- CONFIG & DATA ---
const VALID_USERS = [
  { username: 'must3y', password: 'kral123', role: 'Elite Member' },
  { username: 'admin', password: 'admin34', role: 'System Administrator' }
];

const INITIAL_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: 'fa-bitcoin' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'fa-ethereum' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'fa-bolt' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP', icon: 'fa-droplet' },
];

const MOCK_HEATMAP = [
  { cat: 'AI', score: 88, trend: 'up' },
  { cat: 'DeFi', score: 45, trend: 'down' },
  { cat: 'Meme', score: 72, trend: 'up' },
  { cat: 'L1', score: 64, trend: 'neutral' },
  { cat: 'RWA', score: 91, trend: 'up' },
  { cat: 'GameFi', score: 38, trend: 'down' }
];

const MOCK_WHALES = [
  { id: 'w1', from: 'Binance', to: 'Soğuk Cüzdan', amount: 3500, symbol: 'BTC', usd: 245000000, time: '3 dk önce' },
  { id: 'w2', from: 'Bilinmeyen Balina', to: 'Coinbase', amount: 150000, symbol: 'ETH', usd: 390000000, time: '12 dk önce' },
  { id: 'w3', from: 'Kraken', to: 'Bilinmeyen Cüzdan', amount: 1200000, symbol: 'SOL', usd: 180000000, time: '45 dk önce' }
];

// --- COMPONENTS ---
const Gauge = ({ value, label }) => {
  const offset = 125.6 - (125.6 * value) / 100;
  const color = value > 70 ? '#22c55e' : (value < 30 ? '#ef4444' : '#eab308');
  return (
    <div className="flex flex-col items-center">
      <div className="gauge-container">
        <svg viewBox="0 0 100 100" className="w-full h-48 -rotate-180">
          <circle cx="50" cy="50" r="40" className="gauge-bg" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" strokeDasharray="125.6 125.6" />
          <circle cx="50" cy="50" r="40" className="gauge-fill" 
            stroke={color} strokeWidth="8" fill="none" strokeDasharray="125.6 125.6" strokeDashoffset={offset} 
            style={{ filter: `drop-shadow(0 0 8px ${color}80)`, transition: 'all 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-black text-white">{value}</span>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('DASHBOARD');
  const [coins, setCoins] = React.useState(INITIAL_COINS.map(c => ({...c, price: 0, change: 0})));
  const [loginForm, setLoginForm] = React.useState({ u: '', p: '' });
  const [loginError, setLoginError] = React.useState('');

  React.useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = INITIAL_COINS.map(c => c.id).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const data = await res.json();
        setCoins(prev => prev.map(c => ({
          ...c, 
          price: data[c.id]?.usd || 0, 
          change: parseFloat(data[c.id]?.usd_24h_change?.toFixed(2)) || 0
        })));
      } catch (e) { console.error(e); }
    };
    if (user) fetchPrices();
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    const found = VALID_USERS.find(u => u.username === loginForm.u && u.password === loginForm.p);
    if (found) { setUser(found); setLoginError(''); }
    else setLoginError('Erişim Reddedildi.');
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-md p-8">
          <div className="glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl">
            <h1 className="text-4xl font-black text-white text-center mb-8 uppercase">MUST3Y</h1>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder="Giriş Kimliği" value={loginForm.u} onChange={e=>setLoginForm({...loginForm, u:e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none" />
              <input type="password" placeholder="Şifre" value={loginForm.p} onChange={e=>setLoginForm({...loginForm, p:e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none" />
              <button type="submit" className="w-full must3y-gradient py-5 rounded-2xl text-white font-black uppercase tracking-widest">GİRİŞ YAP</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-white">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col">
        <h2 className="text-2xl font-black mb-10">MUST3Y</h2>
        <nav className="space-y-4">
          <button onClick={()=>setActiveTab('DASHBOARD')} className={`w-full text-left p-4 rounded-xl ${activeTab==='DASHBOARD' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Panel</button>
          <button onClick={()=>setActiveTab('WHALE')} className={`w-full text-left p-4 rounded-xl ${activeTab==='WHALE' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>Balina</button>
        </nav>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-10">
            <h2 className="text-4xl font-black">MERKEZ PANEL</h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="glass-card p-8 rounded-[2rem] flex flex-col items-center">
                <Gauge value={68} label="AÇGÖZLÜLÜK" />
              </div>
              <div className="glass-card p-8 rounded-[2rem]">
                <h3 className="mb-4 font-bold">CANLI VARLIKLAR</h3>
                {coins.map(c => (
                  <div key={c.id} className="flex justify-between border-b border-white/5 py-2">
                    <span>{c.name}</span>
                    <span className={c.change > 0 ? 'text-green-500' : 'text-red-500'}>${c.price} ({c.change}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

// React'i başlat
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
