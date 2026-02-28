import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, History, QrCode, Link as LinkIcon, Palette, Settings, CheckCircle2, Loader2, Sparkles, Zap, Lock, FileText, Share2, Utensils, AppWindow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, Plan } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type QRType = 'static' | 'dynamic';
type QRContentType = 'url' | 'document' | 'social_media' | 'menu' | 'app_store';

interface CustomizationOptions {
  fgColor: string;
  bgColor: string;
  logoImage: string | null;
  ecLevel: 'L' | 'M' | 'Q' | 'H';
  size: number;
}

const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  logoImage: null,
  ecLevel: 'M',
  size: 256,
};

interface HistoryItem {
  id: number;
  text: string;
  color: string;
  size: number;
  date: string;
  qrType: QRType;
  contentType: QRContentType;
}

declare global {
  interface Window {
    QRCode: any;
  }
}

const QRStudio: React.FC = () => {
  const { user, plan, getPlanLimits } = useAuth();
  const limits = getPlanLimits();

  const [inputValue, setInputValue] = useState('https://');
  const [qrType, setQrType] = useState<QRType>('static');
  const [qrContentType, setQrContentType] = useState<QRContentType>('url');
  const [customization, setCustomization] = useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [libReady, setLibReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const lastGenerated = useRef<HistoryItem | null>(null);

  const isDynamicAllowed = plan !== 'guest';
  const isPaidCustomizationAllowed = limits.canCustomize;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.startsWith('https://')) {
      setInputValue(val);
    } else if (val.length < 'https://'.length) {
      setInputValue('https://');
    }
  };

  const renderQRCode = useCallback((qrText: string, qrColor: string, qrSize: number, ecLevel: 'L' | 'M' | 'Q' | 'H') => {
    if (!qrRef.current || !window.QRCode) return;
    qrRef.current.innerHTML = '';
    
    // If user hasn't put a link (only prefix), use http:// as requested
    const finalUrl = qrText === 'https://' ? 'http://' : qrText;
    
    try {
      new window.QRCode(qrRef.current, {
        text: finalUrl,
        width: qrSize,
        height: qrSize,
        colorDark: qrColor,
        colorLight: customization.bgColor,
        correctLevel: window.QRCode.CorrectLevel[ecLevel]
      });
      lastGenerated.current = { 
        text: finalUrl, 
        color: qrColor, 
        size: qrSize, 
        date: new Date().toLocaleString(), 
        id: Date.now(), 
        qrType, 
        contentType: qrContentType 
      };
    } catch (err) {
      console.error("QR Library Error:", err);
    }
  }, [customization.bgColor, qrType, qrContentType]);

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
        // Initial render with default
        setTimeout(() => renderQRCode('https://', customization.fgColor, customization.size, customization.ecLevel), 100);
      };
      document.head.appendChild(script);
    } else if (window.QRCode) {
      setLibReady(true);
      setTimeout(() => renderQRCode('https://', customization.fgColor, customization.size, customization.ecLevel), 100);
    }
  }, [renderQRCode, customization.fgColor, customization.size, customization.ecLevel]);

  const handleGenerate = () => {
    if (!libReady || isGenerating) return;

    if (qrType === 'dynamic' && plan === 'free' && user && user.dynamicQRCodes >= limits.maxDynamicQRs) {
      showError(`You have reached your limit of ${limits.maxDynamicQRs} dynamic QR codes.`);
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    const duration = 1000;
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
    const textToGen = inputValue === 'https://' ? 'http://' : inputValue;
    const newEntry: HistoryItem = {
      id: Date.now(),
      text: textToGen,
      color: customization.fgColor,
      size: customization.size,
      date: new Date().toLocaleString(),
      qrType,
      contentType: qrContentType,
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('qr_history', JSON.stringify(updatedHistory));
    
    renderQRCode(inputValue, customization.fgColor, customization.size, customization.ecLevel);
    setIsGenerating(false);
    setProgress(0);
    showSuccess(`QR Code generated!`);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL("image/png");
    link.download = `qr-code-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-slate-800 flex items-center gap-2">
              <div className="bg-primary p-2 rounded-xl shadow-sm shadow-primary/20">
                <QrCode className="text-primary-foreground" size={24} />
              </div>
              QR Studio
            </h1>
            <p className="text-muted-foreground font-medium ml-1">Create with ease</p>
          </div>
          
          <div className="flex bg-secondary p-1.5 rounded-2xl self-start">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'generate' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Generate
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'history' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Recent
            </button>
          </div>
        </header>

        <main>
          {activeTab === 'generate' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
                <Card className="rounded-3xl shadow-sm p-8 border border-border space-y-8">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles size={16} className="text-primary" /> Source URL
                    </Label>
                    <Input 
                      value={inputValue}
                      onChange={handleInputChange}
                      disabled={isGenerating}
                      className="w-full p-5 h-14 rounded-2xl border-none ring-1 ring-input focus:ring-2 focus:ring-primary outline-none transition-all bg-background text-foreground text-lg shadow-inner font-medium"
                    />
                    <p className="text-xs text-muted-foreground">The "https://" prefix is permanent. Start typing your link after it.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">QR Code Type</Label>
                    <RadioGroup
                      value={qrType}
                      onValueChange={(value: QRType) => setQrType(value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="static" id="static" />
                        <Label htmlFor="static">Static</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dynamic" id="dynamic" disabled={!isDynamicAllowed} />
                        <Label htmlFor="dynamic" className={cn(!isDynamicAllowed && "text-muted-foreground")}>
                          Dynamic {!isDynamicAllowed && <Lock className="inline w-3 h-3 ml-1" />}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Card className={cn(
                    "p-6 rounded-2xl border-none shadow-sm bg-secondary/50",
                    !isPaidCustomizationAllowed && "opacity-50 pointer-events-none"
                  )}>
                    <CardTitle className="text-lg mb-4 flex items-center">
                      Customization
                      {!isPaidCustomizationAllowed && <Lock className="inline w-4 h-4 ml-2 text-destructive" />}
                    </CardTitle>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Foreground</Label>
                        <Input 
                          type="color" 
                          value={customization.fgColor} 
                          onChange={(e) => setCustomization({...customization, fgColor: e.target.value})}
                          className="h-10 p-1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Background</Label>
                        <Input 
                          type="color" 
                          value={customization.bgColor} 
                          onChange={(e) => setCustomization({...customization, bgColor: e.target.value})}
                          className="h-10 p-1"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Size</Label>
                        <Select
                          value={String(customization.size)}
                          onValueChange={(value) => setCustomization({...customization, size: Number(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="128">Small (128px)</SelectItem>
                            <SelectItem value="256">Medium (256px)</SelectItem>
                            <SelectItem value="512">Large (512px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" /> Generating... {Math.round(progress)}%
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap size={20} fill="currentColor" /> Generate QR Code
                      </div>
                    )}
                  </Button>
                </Card>
              </div>

              <div className="lg:col-span-5 flex flex-col items-center">
                <Card className="p-8 md:p-12 rounded-[40px] shadow-xl border border-border flex justify-center items-center overflow-hidden w-full aspect-square max-w-[420px] bg-white">
                  <div className="flex items-center justify-center w-full h-full">
                    <div 
                      ref={qrRef} 
                      className={cn("transition-all duration-500", isGenerating ? 'opacity-0 scale-90 blur-md' : 'opacity-100 scale-100')}
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={60} className="text-primary animate-pulse" />
                      </div>
                    )}
                  </div>
                </Card>

                {lastGenerated.current && !isGenerating && (
                  <Button 
                    onClick={downloadQR}
                    variant="outline"
                    className="mt-8 w-full sm:w-auto px-10 h-14 rounded-2xl font-bold border-2"
                  >
                    <Download className="mr-2" /> Export PNG
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Card className="rounded-3xl p-8 border border-border">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History className="text-primary" /> Recent Codes
                </h2>
                {history.length > 0 && (
                  <Button variant="ghost" onClick={() => { setHistory([]); localStorage.removeItem('qr_history'); }} className="text-destructive">
                    <Trash2 size={16} className="mr-2" /> Clear
                  </Button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">No history yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <Card key={item.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <QrCode size={24} className="text-primary" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold truncate">{item.text}</p>
                          <p className="text-xs text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setHistory(history.filter(h => h.id !== item.id))}>
                        <Trash2 size={16} />
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default QRStudio;