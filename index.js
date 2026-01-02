// React ve Tailwind'i tarayıcıya hazır hale getirelim
const { useState, useEffect, useMemo, useRef } = React;

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
  { cat: 'AI', score: 88 }, { cat: 'DeFi', score: 45 },
  { cat: 'Meme', score: 72 }, { cat: 'L1', score: 64 },
  { cat: 'RWA', score: 91 }, { cat: 'GameFi', score: 38 }
];

const MOCK_WHALES = [
  { id: 'w1', from: 'Binance', to: 'Soğuk Cüzdan', amount: 3500, symbol: 'BTC', usd: 245000000, time: '3 dk önce' },
  { id: 'w2', from: 'Bilinmeyen Balina', to: 'Coinbase', amount: 150000, symbol: 'ETH', usd: 390000000, time: '12 dk önce' }
];

// --- GAUGE COMPONENT ---
const Gauge = ({ value, label }) => {
  const offset = 125.6 - (125.6 * value) / 100;
  const color = value > 70 ? '#22c55e' : (value < 30 ? '#ef4444' : '#eab308');
  return (
    React.createElement("div", { className: "flex flex-col items-center" },
      React.createElement("div", { className: "gauge-container relative" },
        React.createElement("svg", { viewBox: "0 0 100 100", className: "w-48 h-48 -rotate-180" },
          React.createElement("circle", { cx: "50", cy: "50", r: "40", className: "gauge-bg", strokeDasharray: "125.6 125.6", fill: "none", stroke: "#1e293b", strokeWidth: "8" }),
          React.createElement("circle", { cx: "50", cy: "50", r: "40", className: "gauge-fill", stroke: color, strokeDasharray: "125.6 125.6", strokeDashoffset: offset, fill: "none", strokeWidth: "8", strokeLinecap: "round", style: { transition: 'all 1s ease' } })
        ),
        React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center pt-8" },
          React.createElement("span", { className: "text-4xl font-black text-white" }, value),
          React.createElement("span", { className: "text-[10px] font-black uppercase tracking-widest", style: { color } }, label)
        )
      )
    )
  );
};

// --- MAIN APP ---
const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [loginForm, setLoginForm] = useState({ u: '', p: '' });
  const [loginError, setLoginError] = useState('');
  const [coins, setCoins] = useState(INITIAL_COINS.map(c => ({...c, price: 0, change: 0})));

  const handleLogin = (e) => {
    e.preventDefault();
    const found = VALID_USERS.find(u => u.username === loginForm.u && u.password === loginForm.p);
    if (found) { setUser(found); }
    else { setLoginError('Erişim Reddedildi.'); }
  };

  if (!user) {
    return (
      React.createElement("div", { className: "h-screen w-full flex items-center justify-center bg-slate-950" },
        React.createElement("div", { className: "w-full max-w-md p-8" },
          React.createElement("div", { className: "glass-card p-10 rounded-[3rem] border border-white/10 shadow-2xl" },
            React.createElement("div", { className: "text-center mb-10" },
              React.createElement("div", { className: "w-20 h-20 must3y-gradient rounded-[2rem] flex items-center justify-center mx-auto mb-6" },
                React.createElement("span", { className: "text-white font-black text-4xl" }, "M")
              ),
              React.createElement("h1", { className: "text-4xl font-black text-white tracking-tighter uppercase mb-2" }, "must3y"),
              React.createElement("p", { className: "text-[10px] font-black uppercase tracking-[0.5em] text-slate-500" }, "İSTİHBARAT v3.0 ELITE")
            ),
            React.createElement("form", { onSubmit: handleLogin, className: "space-y-6" },
              React.createElement("input", { type: "text", placeholder: "Giriş Kimliği", className: "w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none", onChange: e => setLoginForm({...loginForm, u: e.target.value}) }),
              React.createElement("input", { type: "password", placeholder: "Güvenlik Anahtarı", className: "w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none", onChange: e => setLoginForm({...loginForm, p: e.target.value}) }),
              loginError && React.createElement("p", { className: "text-red-500 text-xs text-center font-black" }, loginError),
              React.createElement("button", { type: "submit", className: "w-full must3y-gradient py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg" }, "SİSTEME BAĞLAN")
            )
          )
        )
      )
    );
  }

  return (
    React.createElement("div", { className: "flex h-screen bg-slate-950 text-slate-200" },
      React.createElement("aside", { className: "w-72 bg-slate-900 border-r border-slate-800 p-8 hidden lg:block" },
        React.createElement("h1", { className: "text-2xl font-black text-white mb-10" }, "must3y"),
        React.createElement("nav", { className: "space-y-4" },
          ['DASHBOARD', 'SENTIMENT', 'WHALE'].map(tab => 
            React.createElement("button", { key: tab, onClick: () => setActiveTab(tab), className: `w-full text-left px-6 py-4 rounded-2xl font-bold ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-400'}` }, tab)
          )
        )
      ),
      React.createElement("main", { className: "flex-1 p-12 overflow-y-auto" },
        React.createElement("h2", { className: "text-5xl font-black text-white mb-10" }, activeTab),
        activeTab === 'DASHBOARD' && React.createElement("div", { className: "grid grid-cols-2 gap-8" },
          React.createElement("div", { className: "glass-card p-8 rounded-[3rem]" }, React.createElement(Gauge, { value: 68, label: "AÇGÖZLÜLÜK" })),
          React.createElement("div", { className: "glass-card p-8 rounded-[3rem]" }, 
            React.createElement("h3", { className: "text-xs font-black text-slate-500 mb-4" }, "ISI HARİTASI"),
            MOCK_HEATMAP.map(h => React.createElement("div", { key: h.cat, className: "flex justify-between py-2 border-b border-white/5" }, 
              React.createElement("span", null, h.cat), React.createElement("span", { className: "text-blue-500" }, h.score, "%")
            ))
          )
        )
      )
    )
  );
};

// React'ı ekrana basalım
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
