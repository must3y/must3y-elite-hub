import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

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

// --- AI SERVICE ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const aiService = {
  async analyzeSentiment(coin: string, headlines: string[]) {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiz: ${coin}. Haberler: ${headlines.join(". ")}. Sadece JSON formatında yanıt ver: {score:0-100, label:Pozitif/Negatif, analysis:str, note:str}. DİL TÜRKÇE OLMALIDIR.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            label: { type: Type.STRING },
            analysis: { type: Type.STRING },
            note: { type: Type.STRING }
          },
          required: ["score", "label", "analysis", "note"]
        }
      }
    });
    return JSON.parse(response.text);
  },
  async chat(msg: string) {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { 
        systemInstruction: "Sen must3y AI Asistanısın. Kullanıcıya 'şef' diye hitap et. Kısa, elit, teknik derinliği olan ve profesyonel cevaplar ver. DİL TÜRKÇE OLMALIDIR." 
      }
    });
    const res = await chat.sendMessage({ message: msg });
    return res.text;
  },
  async explainWhale(tx: any) {
    const res = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Şu balina hareketini must3y tarzında analiz et: ${tx.amount} ${tx.symbol} transferi. Dil: Türkçe.`
    });
    return res.text;
  }
};

// --- COMPONENTS ---

const Gauge = ({ value, label }: { value: number, label: string }) => {
  const offset = 125.6 - (125.6 * value) / 100;
  const color = value > 70 ? '#22c55e' : (value < 30 ? '#ef4444' : '#eab308');
  return (
    <div className="flex flex-col items-center">
      <div className="gauge-container">
        <svg viewBox="0 0 100 100" className="w-full h-48 -rotate-180">
          <circle cx="50" cy="50" r="40" className="gauge-bg" strokeDasharray="125.6 125.6" />
          <circle cx="50" cy="50" r="40" className="gauge-fill" 
            stroke={color} strokeDasharray="125.6 125.6" strokeDashoffset={offset} 
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }} />
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
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [coins, setCoins] = useState<any[]>(INITIAL_COINS.map(c => ({...c, price: 0, change: 0})));
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ u: '', p: '' });
  const [loginError, setLoginError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRadarActive, setIsRadarActive] = useState(false);
  const [whaleData, setWhaleData] = useState<any[]>([]);
  const [sentimentRes, setSentimentRes] = useState<any>(null);
  const [coinInput, setCoinInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchPrices();
    const int = setInterval(() => user && fetchPrices(), 60000);
    return () => clearInterval(int);
  }, [user]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = VALID_USERS.find(u => u.username === loginForm.u && u.password === loginForm.p);
    if (found) { setUser(found); setLoginError(''); }
    else setLoginError('Erişim Reddedildi. Yetkisiz giriş.');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatLoading(true);
    try {
      const res = await aiService.chat(msg);
      setChatHistory(prev => [...prev, { role: 'model', text: res }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Bağlantı kesildi, tekrar deneyin." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const startRadar = () => {
    setLoading(true);
    setTimeout(() => { setWhaleData(MOCK_WHALES); setIsRadarActive(true); setLoading(false); }, 2000);
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[180px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[180px] animate-pulse delay-1000"></div>
        </div>
        <div className="w-full max-w-md relative z-10 p-8">
          <div className="glass-card p-10 rounded-[3rem] border-white/10 shadow-2xl animate-slideUp">
            <div className="text-center mb-10">
              <div className="w-20 h-20 must3y-gradient rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/40">
                <span className="text-white font-black text-4xl">M</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">must3y</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">İSTİHBARAT v3.0 ELITE</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="text" placeholder="Giriş Kimliği" value={loginForm.u} onChange={e=>setLoginForm({...loginForm, u:e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              <input type="password" placeholder="Güvenlik Anahtarı" value={loginForm.p} onChange={e=>setLoginForm({...loginForm, p:e.target.value})} className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              {loginError && <p className="text-red-500 text-xs font-black text-center animate-bounce">{loginError}</p>}
              <button type="submit" className="w-full must3y-gradient py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">SİSTEME BAĞLAN</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col hidden lg:flex">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-1">
            <div className="w-10 h-10 rounded-xl must3y-gradient flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white">must3y</h1>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[8px] uppercase tracking-widest text-blue-500 font-black">ELITE CONNECTED</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'DASHBOARD', icon: 'fa-shapes', label: 'Merkez Panel' },
            { id: 'SENTIMENT', icon: 'fa-brain', label: 'Duygu Analizi' },
            { id: 'WHALE', icon: 'fa-tower-broadcast', label: 'Balina Radarı' },
            { id: 'CALENDAR', icon: 'fa-calendar-check', label: 'Ekonomik Takvim' },
            { id: 'ROADMAP', icon: 'fa-compass', label: 'Vizyon & Yol' },
          ].map(item => (
            <button key={item.id} onClick={()=>setActiveTab(item.id)} className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'hover:bg-slate-800 text-slate-400'}`}>
              <i className={`fas ${item.icon} text-sm transition-transform group-hover:scale-110`}></i>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-800/50 rounded-[2rem] p-4 border border-white/5 relative overflow-hidden group">
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-blue-500/30">
                <i className="fas fa-user-shield text-blue-400"></i>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-white uppercase tracking-tighter truncate">{user.username}</p>
                <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest">Elite Member</p>
              </div>
              <button onClick={()=>setUser(null)} className="text-slate-500 hover:text-red-500 transition-colors"><i className="fas fa-power-off text-xs"></i></button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-[radial-gradient(circle_at_top_right,_#0f172a,_#020617)]">
        <header className="lg:hidden p-4 bg-slate-900 flex items-center justify-between">
          <h1 className="text-xl font-black text-white">must3y</h1>
          <i className="fas fa-bars text-slate-400"></i>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar relative">
          
          {activeTab === 'DASHBOARD' && (
            <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">MERKEZ PANEL</h2>
                  <p className="text-slate-500 font-bold italic mt-2">Piyasa istihbaratı anlık olarak işleniyor.</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-8 py-4 rounded-3xl text-right">
                   <p className="text-blue-500 font-mono font-black text-2xl tracking-tighter leading-none">{new Date().toLocaleTimeString('tr-TR')}</p>
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">SİSTEM ZAMANI</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="glass-card p-8 rounded-[3rem] flex flex-col items-center">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">KORKU & AÇGÖZLÜLÜK</h3>
                      <Gauge value={68} label="AÇGÖZLÜLÜK" />
                    </div>
                    <div className="glass-card p-8 rounded-[3rem]">
                      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">SEKTÖREL ISI HARİTASI</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {MOCK_HEATMAP.map(h => (
                          <div key={h.cat} className={`p-4 rounded-2xl text-center transition-all hover:scale-105 cursor-default ${h.score > 70 ? 'bg-green-500/10 border-green-500/20 text-green-500' : (h.score < 40 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-slate-800/50 border-white/5 text-slate-400')}`}>
                            <p className="text-[9px] font-black uppercase mb-1">{h.cat}</p>
                            <p className="text-sm font-bold">{h.score}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-10 rounded-[3rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black uppercase tracking-tight">VERİ AKIŞI</h3>
                      <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div><span className="text-[9px] font-black text-slate-500 uppercase">CANLI</span></div>
                    </div>
                    <div className="space-y-4">
                      {['Binance: 5k BTC girişi saptandı.', 'FED yetkilisi: Faiz indirimi masada.', 'SOL/USD: %5 hacim artışı.'].map((m, i) => (
                        <div key={i} className="flex items-center space-x-6 p-4 bg-white/5 rounded-2xl group cursor-default hover:bg-white/10 transition-all">
                          <span className="text-[10px] font-mono text-slate-600">02:{15-i*5}</span>
                          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                          <p className="text-slate-300 font-bold group-hover:text-white">{m}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="glass-card p-8 rounded-[3rem]">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">VARLIK GÖZETİM</h3>
                    <div className="space-y-3">
                      {coins.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-white/5">
                          <div className="flex items-center space-x-3">
                            <i className={`fab ${c.icon} text-lg text-blue-500`}></i>
                            <span className="font-black text-sm uppercase">{c.symbol}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm text-white">${c.price.toLocaleString()}</p>
                            <p className={`text-[10px] font-black ${c.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{c.change}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-8 must3y-gradient rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-4 flex items-center">
                        <i className="fas fa-satellite mr-2"></i> must3y NOTU
                      </h3>
                      <p className="text-white text-xl font-black italic leading-tight group-hover:scale-105 transition-transform duration-500">
                        "BTC 64k üzerinde kalıcı olursa hedef 69k. Hacim zayıf, iğnelere dikkat et."
                      </p>
                    </div>
                    <i className="fas fa-bolt absolute -bottom-6 -right-6 text-9xl text-white opacity-5"></i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SENTIMENT' && (
            <div className="max-w-4xl mx-auto py-10 animate-fadeIn text-center">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">DUYGU ANALİZİ</h2>
              <p className="text-slate-500 font-bold mb-12">must3y AI haberleri ve sosyal verileri senin için tarar.</p>
              <div className="glass-card p-12 rounded-[4rem] border-white/10">
                <div className="flex flex-col md:flex-row gap-4 mb-10">
                  <input type="text" placeholder="Coin adı (örn: Bitcoin)..." value={coinInput} onChange={e=>setCoinInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={async ()=>{
                    if(!coinInput) return;
                    setLoading(true);
                    try {
                      const res = await aiService.analyzeSentiment(coinInput, ["Fiyat artışı bekleniyor", "Kurumsal ilgi yüksek"]);
                      setSentimentRes(res);
                    } catch(e) { console.error(e); }
                    setLoading(false);
                  }} className="px-12 py-5 must3y-gradient text-white font-black rounded-2xl shadow-xl shadow-blue-500/20">{loading ? 'İŞLENİYOR...' : 'ANALİZİ BAŞLAT'}</button>
                </div>
                {sentimentRes && (
                  <div className="text-left p-10 bg-white/5 rounded-[3rem] animate-slideUp">
                     <div className="flex items-center justify-between mb-8">
                       <span className={`text-4xl font-black ${sentimentRes.label==='Pozitif' ? 'text-green-500' : 'text-red-500'}`}>{sentimentRes.label}</span>
                       <span className="text-5xl font-mono font-black text-white">{sentimentRes.score}%</span>
                     </div>
                     <p className="text-2xl text-slate-200 font-bold leading-relaxed italic mb-8">"{sentimentRes.analysis}"</p>
                     <div className="p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                       <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">must3y TAVSİYESİ</p>
                       <p className="text-slate-300 font-bold">"{sentimentRes.note}"</p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'WHALE' && (
            <div className="max-w-5xl mx-auto py-10 animate-fadeIn">
               <div className="text-center mb-16">
                 <h2 className="text-5xl font-black text-white uppercase tracking-tighter">BALINA RADARI</h2>
                 <p className="text-slate-500 font-bold tracking-widest uppercase text-xs mt-2">Derin Deniz Likidite İzleme Merkezi</p>
               </div>
               {!isRadarActive ? (
                 <div className="glass-card p-24 rounded-[4rem] text-center border-dashed border-2 border-slate-800">
                    <div className="w-48 h-48 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-10 relative">
                       <div className="radar-ping"></div>
                       <div className="radar-ping" style={{animationDelay:'1s'}}></div>
                       <i className="fas fa-satellite-dish text-5xl text-blue-500 animate-pulse"></i>
                    </div>
                    <h3 className="text-3xl font-black mb-6">Radar Pasif</h3>
                    <p className="text-slate-500 text-lg mb-12 italic max-w-md mx-auto">Sinyalleri toplamak için radarı ELITE frekansında başlatın.</p>
                    <button onClick={startRadar} className="px-20 py-6 must3y-gradient text-white font-black rounded-3xl text-xl shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all">
                      {loading ? 'TARANIYOR...' : 'RADARI BAŞLAT'}
                    </button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    {whaleData.map(w => (
                      <div key={w.id} className="glass-card p-10 rounded-[3rem] hover:border-blue-500/30 transition-all group">
                         <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex items-center space-x-10">
                               <div className="w-20 h-20 rounded-[2rem] bg-slate-900 flex items-center justify-center text-blue-500 border border-white/5">
                                  <i className="fas fa-whale text-3xl"></i>
                               </div>
                               <div>
                                  <h4 className="text-3xl font-black text-white tracking-tighter">{w.amount.toLocaleString()} {w.symbol}</h4>
                                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest">${w.usd.toLocaleString()} USD • {w.from} ➔ {w.to}</p>
                               </div>
                            </div>
                            <button className="px-10 py-5 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black uppercase shadow-lg transition-all">ANALİZ AL</button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'CALENDAR' && (
            <div className="max-w-4xl mx-auto py-10 animate-fadeIn">
               <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-12 text-center">Ekonomik Takvim</h2>
               <div className="space-y-4">
                  {[
                    { e: 'ABD Tarım Dışı İstihdam', d: 'Cuma 15:30', i: 'Kritik', icon: 'fa-briefcase' },
                    { e: 'FOMC Toplantısı', d: '12 Gün Sonra', i: 'Yüksek', icon: 'fa-landmark-dome' },
                    { e: 'Enflasyon Verisi (TÜFE)', d: 'Pazartesi 15:30', i: 'Kritik', icon: 'fa-chart-line-down' },
                  ].map((item, i) => (
                    <div key={i} className="glass-card p-8 rounded-[2rem] flex items-center justify-between hover:translate-x-2 transition-transform cursor-default">
                      <div className="flex items-center space-x-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-blue-500">
                           <i className={`fas ${item.icon} text-2xl`}></i>
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white">{item.e}</h4>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.d}</p>
                        </div>
                      </div>
                      <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase ${item.i === 'Kritik' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{item.i} ETKİ</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'ROADMAP' && (
            <div className="max-w-4xl mx-auto py-12 space-y-20 animate-fadeIn">
               <div className="text-center">
                  <h2 className="text-8xl font-black text-white tracking-tighter uppercase opacity-10 leading-none">VİZYON</h2>
                  <p className="text-4xl font-black text-white mt-[-2rem] relative z-10">Pusula <span className="text-blue-500">Geleceği</span> Gösteriyor</p>
               </div>
               <div className="grid md:grid-cols-2 gap-12">
                  <div className="glass-card p-12 rounded-[4rem] border-blue-500/10">
                     <i className="fas fa-microchip text-5xl text-blue-500 mb-10"></i>
                     <h3 className="text-3xl font-black mb-6 uppercase">Sentetik Zeka</h3>
                     <p className="text-slate-400 font-bold text-lg leading-relaxed">Saniyede binlerce parametreyi işleyen Gemini destekli çekirdek modülümüz, kaosun içindeki deseni saptar.</p>
                  </div>
                  <div className="glass-card p-12 rounded-[4rem] border-purple-500/10">
                     <i className="fas fa-user-secret text-5xl text-purple-500 mb-10"></i>
                     <h3 className="text-3xl font-black mb-6 uppercase">Tam Gizlilik</h3>
                     <p className="text-slate-400 font-bold text-lg leading-relaxed">Elite platformumuzda tüm işlemler anonim, tüm analizler sadece sizin gözleriniz içindir.</p>
                  </div>
               </div>
            </div>
          )}

          {/* Chatbot UI */}
          <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            {isChatOpen && (
              <div className="w-[420px] h-[550px] glass-card rounded-[3rem] shadow-2xl flex flex-col mb-6 animate-slideUp overflow-hidden border-white/10">
                <div className="p-6 must3y-gradient flex items-center justify-between">
                   <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <i className="fas fa-robot text-white text-lg"></i>
                     </div>
                     <div>
                        <span className="font-black text-white uppercase tracking-widest text-xs block">must3y AI</span>
                        <span className="text-[8px] text-white/60 font-black uppercase tracking-widest">SİSTEM ASİSTANI</span>
                     </div>
                   </div>
                   <button onClick={()=>setIsChatOpen(false)} className="text-white/60 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-900/40">
                   <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-3xl rounded-tl-none">
                      <p className="text-sm text-slate-300 font-bold leading-relaxed italic">Hoş geldin şef. must3y veri merkezinden hangi istihbaratı istersin? Piyasa analizi mi yoksa balina takibi mi?</p>
                   </div>
                   {chatHistory.map((m, i) => (
                     <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl' : 'bg-slate-800 text-slate-300 rounded-tl-none border border-white/5'}`}>
                           <p className="text-sm font-bold leading-relaxed">{m.text}</p>
                        </div>
                     </div>
                   ))}
                   {isChatLoading && <div className="text-[10px] text-blue-500 font-black animate-pulse px-4">AI yanıt üretiyor...</div>}
                   <div ref={chatEndRef}></div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/80">
                   <div className="relative">
                      <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && sendChatMessage()} placeholder="Merkeze sor..." className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button onClick={sendChatMessage} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-400 disabled:opacity-50" disabled={isChatLoading}><i className="fas fa-paper-plane text-lg"></i></button>
                   </div>
                </div>
              </div>
            )}
            <button onClick={()=>setIsChatOpen(!isChatOpen)} className="w-20 h-20 must3y-gradient rounded-full flex items-center justify-center text-white text-3xl shadow-2xl shadow-blue-500/40 hover:scale-110 active:scale-95 transition-all">
              {isChatOpen ? <i className="fas fa-chevron-down"></i> : <i className="fas fa-comment-dots"></i>}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
