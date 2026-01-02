// --- KONFİGÜRASYON ---
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

// --- BİLEŞENLER ---
const Gauge = ({ value, label }) => {
    const offset = 125.6 - (125.6 * value) / 100;
    const color = value > 70 ? '#22c55e' : (value < 30 ? '#ef4444' : '#eab308');
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="8" fill="none" 
                        strokeDasharray="251.2" strokeDashoffset={251.2 - (offset * 2)} 
                        style={{ transition: 'all 1s ease' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{value}</span>
                    <span className="text-[10px] font-black" style={{ color }}>{label}</span>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = React.useState(null);
    const [loginForm, setLoginForm] = React.useState({ u: '', p: '' });
    const [loginError, setLoginError] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('DASHBOARD');

    const handleLogin = (e) => {
        e.preventDefault();
        const found = VALID_USERS.find(u => u.username === loginForm.u && u.password === loginForm.p);
        if (found) { setUser(found); } 
        else { setLoginError('Erişim Reddedildi!'); }
    };

    if (!user) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <div className="glass-card p-10 rounded-[3rem] border border-white/10 w-full max-w-md shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 must3y-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl font-black text-white">M</span>
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">MUST3Y ELITE</h1>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="text" placeholder="Kullanıcı Adı" value={loginForm.u} onChange={e => setLoginForm({...loginForm, u: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="password" placeholder="Şifre" value={loginForm.p} onChange={e => setLoginForm({...loginForm, p: e.target.value})} className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
                        {loginError && <p className="text-red-500 text-sm text-center font-bold">{loginError}</p>}
                        <button type="submit" className="w-full must3y-gradient p-4 rounded-xl text-white font-black uppercase hover:scale-105 transition-all">SİSTEME GİRİŞ</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-950">
            <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6">
                <h2 className="text-2xl font-black text-white mb-8">MUST3Y</h2>
                <div className="space-y-2">
                    <button onClick={() => setActiveTab('DASHBOARD')} className={`w-full text-left p-4 rounded-xl font-bold ${activeTab === 'DASHBOARD' ? 'bg-blue-600' : 'text-slate-400'}`}>Panel</button>
                    <button onClick={() => setActiveTab('WHALE')} className={`w-full text-left p-4 rounded-xl font-bold ${activeTab === 'WHALE' ? 'bg-blue-600' : 'text-slate-400'}`}>Balina</button>
                </div>
            </aside>
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-10">
                    <h1 className="text-5xl font-black text-white uppercase">{activeTab}</h1>
                </header>
                {activeTab === 'DASHBOARD' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="glass-card p-8 rounded-[2rem]">
                            <Gauge value={68} label="AÇGÖZLÜLÜK" />
                        </div>
                        <div className="glass-card p-8 rounded-[2rem]">
                            <h3 className="text-xl font-bold mb-4">CANLI TAKİP</h3>
                            <div className="space-y-4">
                                {INITIAL_COINS.map(c => (
                                    <div key={c.id} className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="font-bold">{c.name}</span>
                                        <span className="text-blue-500 font-mono">AKTİF</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- BAŞLATICI ---
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
