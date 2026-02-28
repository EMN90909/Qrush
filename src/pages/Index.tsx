import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, History, QrCode, Link as LinkIcon, Palette, Settings, CheckCircle2, Loader2, Sparkles, Zap, LogIn, LayoutDashboard } from 'lucide-react';
import Header from '@/components/Header';
import { MadeWithDyad } from '@/components/made-with-dyad';
import ProjectShowcase from '@/components/ProjectShowcase';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [text, setText] = useState('https://emtra.top');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(256);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [libReady, setLibReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const lastGenerated = useRef<{ text: string; color: string; size: number } | null>(null);

  const renderQRCode = useCallback((qrText: string, qrColor: string, qrSize: number) => {
    if (!qrRef.current || !(window as any).QRCode) return;
    qrRef.current.innerHTML = '';
    
    try {
      new (window as any).QRCode(qrRef.current, {
        text: qrText,
        width: qrSize,
        height: qrSize,
        colorDark: qrColor,
        colorLight: "#ffffff",
        correctLevel: (window as any).QRCode.CorrectLevel.H
      });
      lastGenerated.current = { text: qrText, color: qrColor, size: qrSize };
    } catch (err) {
      console.error("QR Library Error:", err);
    }
  }, []);

  useEffect(() => {
    const savedHistory = localStorage.getItem('qr_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        setHistory([]);
      }
    }

    const scriptId = 'qr-code-lib';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      script.async = true;
      script.onload = () => {
        setLibReady(true);
        // Initial render
        setTimeout(() => renderQRCode('https://emtra.top', '#000000', 256), 100);
      };
      document.head.appendChild(script);
    } else if ((window as any).QRCode) {
      setLibReady(true);
      setTimeout(() => renderQRCode('https://emtra.top', '#000000', 256), 100);
    }
  }, [renderQRCode]);

  const handleGenerate = () => {
    if (!text.trim() || !libReady || isGenerating) return;

    setIsGenerating(true);
    setProgress(0);

    const duration = 1500; 
    const intervalTime = 50;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const percent = Math.min((currentStep / steps) * 100, 100);
      setProgress(percent);

      if (currentStep >= steps) {
        clearInterval(timer);
        completeGeneration();
      }
    }, intervalTime);
  };

  const completeGeneration = () => {
    const textToGen = text.trim();
    const newEntry = {
      id: Date.now(),
      text: textToGen,
      color,
      size,
      date: new Date().toLocaleString(),
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('qr_history', JSON.stringify(updatedHistory));
    
    renderQRCode(textToGen, color, size);
    setIsGenerating(false);
    setProgress(0);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const img = qrRef.current.querySelector('img');
    const canvas = qrRef.current.querySelector('canvas');
    if (!img && !canvas) return;
    
    const link = document.createElement('a');
    link.href = img ? img.src : canvas.toDataURL("image/png");
    link.download = `qr-code-${Date.now()}.png`;
    link.click();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qr_history');
  };

  const deleteHistoryItem = (id: number) => {
    const updated = history.filter((item: any) => item.id !== id);
    setHistory(updated);
    localStorage.setItem('qr_history', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#6B7280] font-sans selection:bg-blue-100 flex flex-col">
      <Header />
      
      <div className="max-w-5xl mx-auto px-6 py-12 flex-grow w-full">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-800 flex items-center gap-2">
              <div className="bg-blue-500 p-2 rounded-xl shadow-sm shadow-blue-200">
                <QrCode className="text-white" size={24} />
              </div>
              QR Studio
            </h1>
            <p className="text-slate-400 font-medium ml-1">Create with ease</p>
          </div>
          
          <div className="flex bg-[#F1F5F9] p-1.5 rounded-2xl self-start">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'generate' ? 'bg-white shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Recent
            </button>
          </div>
        </header>

        <main className="transition-all duration-500">
          {activeTab === 'generate' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Panel: Inputs */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100 space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-400" /> Source Content
                        </label>
                    </div>
                    <textarea 
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      disabled={isGenerating}
                      placeholder="Paste a link or type some text..."
                      className="w-full h-40 p-5 rounded-2xl border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none bg-[#FDFDFD] text-slate-700 placeholder:text-slate-300 text-lg leading-relaxed shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-50">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                         Palette
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 shrink-0">
                            <input 
                            type="color" 
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            disabled={isGenerating}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-12 h-12 rounded-full border-4 border-white shadow-md ring-1 ring-slate-100 transition-transform hover:scale-105" style={{ backgroundColor: color }}></div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-mono font-bold text-slate-600 uppercase tracking-tight">{color}</span>
                            <span className="text-[10px] text-slate-400">Foreground color</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-50">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                        Dimensions
                      </label>
                      <select 
                        value={size}
                        onChange={(e) => setSize(Number(e.target.value))}
                        disabled={isGenerating}
                        className="w-full bg-transparent text-sm font-bold text-slate-600 outline-none cursor-pointer border-b-2 border-slate-200 pb-1 focus:border-blue-400 transition-colors appearance-none"
                      >
                        <option value={128}>Small (128px)</option>
                        <option value={256}>Medium (256px)</option>
                        <option value={512}>Large (512px)</option>
                        <option value={1024}>Ultra (1024px)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleGenerate}
                      disabled={!text || !libReady || isGenerating}
                      className="group relative w-full overflow-hidden py-4.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-2xl font-semibold text-base transition-all shadow-lg shadow-blue-100 active:scale-[0.99] flex items-center justify-center gap-3"
                    >
                      {!isGenerating ? (
                        <div className="flex items-center gap-2">
                          <Zap size={18} fill="white" className="group-hover:animate-pulse" />
                          <span>Generate Code</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Loader2 className="animate-spin" size={20} />
                          <span className="opacity-80">Generating... {Math.round(progress)}%</span>
                        </div>
                      )}
                      {isGenerating && (
                        <div 
                          className="absolute bottom-0 left-0 h-1.5 bg-white/20 transition-all duration-75"
                          style={{ width: `${progress}%` }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Panel: Result */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative border border-slate-100 flex justify-center items-center overflow-hidden w-full aspect-square max-w-[420px]">
                  <div className="flex items-center justify-center w-full h-full">
                    <div 
                      ref={qrRef} 
                      className={`flex items-center justify-center transition-all duration-700 ${isGenerating ? 'opacity-0 scale-90 blur-xl' : 'opacity-100 scale-100'}`}
                    />
                    
                    {!text && !isGenerating && !lastGenerated.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-6">
                        <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                            <QrCode size={48} strokeWidth={1} className="text-slate-200" />
                        </div>
                        <p className="text-sm font-medium tracking-wide">Enter content to preview</p>
                      </div>
                    )}
                    
                    {isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative flex items-center justify-center">
                              <div className="absolute w-32 h-32 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                              <Sparkles size={60} className="text-blue-400 animate-pulse" />
                            </div>
                        </div>
                    )}
                  </div>
                </div>

                {lastGenerated.current && !isGenerating && (
                  <div className="flex flex-col gap-4 w-full sm:w-auto mt-8">
                    <button 
                      onClick={downloadQR}
                      className="flex items-center justify-center gap-3 bg-slate-800 text-white px-10 py-4 rounded-2xl hover:bg-slate-900 transition-all font-semibold shadow-xl shadow-slate-200"
                    >
                      <Download size={20} />
                      Export as PNG
                    </button>
                    
                    {!user && (
                      <p className="text-xs text-center text-slate-400">
                        Want to save and track your QR codes? <button onClick={() => navigate('/login')} className="text-blue-500 font-bold hover:underline">Sign In</button>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-slate-100">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-xl">
                    <History size={20} className="text-emerald-500" />
                  </div>
                  Recently Generated
                </h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-rose-400 hover:text-rose-500 font-semibold text-sm px-4 py-2 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Clear list
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-32 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border border-slate-100">
                    <History size={40} strokeWidth={1} />
                  </div>
                  <p className="text-slate-300 font-medium">Your creative history will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-[#FBFDFE] border border-slate-100 hover:border-blue-100 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-5 min-w-0">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        >
                          <QrCode size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate text-base mb-1">{item.text}</p>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{item.size}px</span>
                             <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setText(item.text);
                            setColor(item.color);
                            setSize(item.size);
                            setActiveTab('generate');
                            setTimeout(() => renderQRCode(item.text, item.color, item.size), 100);
                          }}
                          className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reuse settings"
                        >
                          <Settings size={18} />
                        </button>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ProjectShowcase />
      <MadeWithDyad />
    </div>
  );
}