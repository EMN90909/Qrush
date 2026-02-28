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

  const [inputValue, setInputValue] = useState<string>('https://');
  const [qrType, setQrType] = useState<QRType>('static');
  const [qrContentType, setQrContentType] = useState<QRContentType>('url');
  const [customization, setCustomization] = useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [libReady, setLibReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const qrRef = useRef<HTMLDivElement>(null);
  const lastGenerated = useRef<HistoryItem | null>(null);

  const isDynamicAllowed = plan !== 'guest';
  const isPaidCustomizationAllowed = limits.canCustomize;

  const getPlaceholder = (type: QRContentType) => {
    switch (type) {
      case 'document':
        return 'e.g., https://docs.google.com/document/d/abc';
      case 'social_media':
        return 'e.g., https://twitter.com/yourprofile';
      case 'menu':
        return 'e.g., https://yourrestaurant.com/menu';
      case 'app_store':
        return 'e.g., https://apps.apple.com/app/id1234567890';
      case 'url':
      default:
        return 'e.g., https://yourwebsite.com or any text';
    }
  };

  const renderQRCode = useCallback((qrText: string, qrColor: string, qrSize: number, ecLevel: 'L' | 'M' | 'Q' | 'H') => {
    if (!qrRef.current || !window.QRCode) return;
    qrRef.current.innerHTML = '';

    try {
      new window.QRCode(qrRef.current, {
        text: qrText,
        width: qrSize,
        height: qrSize,
        colorDark: qrColor,
        colorLight: customization.bgColor,
        correctLevel: window.QRCode.CorrectLevel[ecLevel],
      });
      lastGenerated.current = {
        text: qrText,
        color: qrColor,
        size: qrSize,
        date: new Date().toLocaleString(),
        id: Date.now(),
        qrType,
        contentType: qrContentType,
      };
    } catch (err) {
      console.error('QR Library Error:', err);
    }
  }, [customization.bgColor, qrType, qrContentType]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('qr_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse QR history from localStorage', e);
        setHistory([]);
      }
    }

    const scriptId = 'qr-code-lib';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.async = true;
      script.onload = () => setLibReady(true);
      document.head.appendChild(script);
    } else if (window.QRCode) {
      setLibReady(true);
    }
  }, []);

  const handleGenerate = () => {
    if (!inputValue.trim() || !libReady || isGenerating) return;

    // Dynamic QR code limit check
    if (qrType === 'dynamic' && plan === 'free' && user && user.dynamicQRCodes >= limits.maxDynamicQRs) {
      showError(`You have reached your limit of ${limits.maxDynamicQRs} dynamic QR codes on the Free Plan. Please upgrade.`);
      return;
    }

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
    const finalText = inputValue.trim() ? inputValue.trim() : 'http://';
    const newEntry: HistoryItem = {
      id: Date.now(),
      text: finalText,
      color: customization.fgColor,
      size: customization.size,
      date: new Date().toLocaleString(),
      qrType,
      contentType: qrContentType,
    };

    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('qr_history', JSON.stringify(updatedHistory));

    renderQRCode(finalText, customization.fgColor, customization.size, customization.ecLevel);
    setIsGenerating(false);
    setProgress(0);
    showSuccess(`QR Code generated for: ${finalText}`);
  };

  const downloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) {
      showError('QR Code not rendered yet.');
      return;
    }

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('QR Code downloaded as PNG!');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qr_history');
    showSuccess('QR history cleared!');
  };

  const deleteHistoryItem = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('qr_history', JSON.stringify(updated));
    showSuccess('History item deleted.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-100">
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

        <main className="transition-all duration-500">
          {activeTab === 'generate' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Panel: Inputs */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-border space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" /> Source Content
                      </Label>
                    </div>
                    <Select
                      value={qrContentType}
                      onValueChange={(value: QRContentType) => setQrContentType(value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="w-full rounded-2xl border-input focus:ring-primary">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">URL / Website</SelectItem>
                        <SelectItem value="document">Document Link</SelectItem>
                        <SelectItem value="social_media">Social Media Profile</SelectItem>
                        <SelectItem value="menu">Restaurant Menu</SelectItem>
                        <SelectItem value="app_store">App Store Link</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isGenerating}
                      placeholder={getPlaceholder(qrContentType)}
                      className="w-full p-5 rounded-2xl border-none ring-1 ring-input focus:ring-primary outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground text-lg leading-relaxed shadow-inner"
                    />
                  </div>

                  {/* QR Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-foreground">QR Code Type</Label>
                    <RadioGroup
                      defaultValue="static"
                      value={qrType}
                      onValueChange={(value: QRType) => setQrType(value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="static" id="r1" className="text-primary focus:ring-primary" />
                        <Label htmlFor="r1" className="text-foreground">Static (Direct Embed)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="dynamic"
                          id="r2"
                          disabled={!isDynamicAllowed}
                          className="text-primary focus:ring-primary"
                        />
                        <Label
                          htmlFor="r2"
                          className={cn(!isDynamicAllowed && 'text-muted-foreground', 'text-foreground')}
                        >
                          Dynamic (Editable URL, Trackable)
                          {!isDynamicAllowed && <Lock className="inline w-3 h-3 ml-1 text-destructive" />}
                        </Label>
                      </div>
                    </RadioGroup>
                    {qrType === 'dynamic' && plan === 'free' && (
                      <p className="text-sm text-destructive">
                        Free Plan: {user?.dynamicQRCodes || 0} / {limits.maxDynamicQRs} Dynamic QRs used.
                      </p>
                    )}
                  </div>

                  {/* Customization Options (Paid Only) */}
                  <Card
                    className={cn(
                      'p-4 transition-all rounded-2xl border-none shadow-sm',
                      !isPaidCustomizationAllowed && 'opacity-50 pointer-events-none bg-secondary dark:bg-gray-900'
                    )}
                  >
                    <CardTitle className="text-lg mb-3 flex items-center text-foreground">
                      Customization (Paid Plan Only)
                      {!isPaidCustomizationAllowed && <Lock className="inline w-4 h-4 ml-2 text-destructive" />}
                    </CardTitle>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fgColor" className="text-foreground">Foreground Color</Label>
                        <Input
                          id="fgColor"
                          type="color"
                          value={customization.fgColor}
                          onChange={(e) => setCustomization({ ...customization, fgColor: e.target.value })}
                          className="h-10 w-full p-1 rounded-lg border-input focus-visible:ring-primary"
                          disabled={!isPaidCustomizationAllowed || isGenerating}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bgColor" className="text-foreground">Background Color</Label>
                        <Input
                          id="bgColor"
                          type="color"
                          value={customization.bgColor}
                          onChange={(e) => setCustomization({ ...customization, bgColor: e.target.value })}
                          className="h-10 w-full p-1 rounded-lg border-input focus-visible:ring-primary"
                          disabled={!isPaidCustomizationAllowed || isGenerating}
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="ecLevel" className="text-foreground">Error Correction Level</Label>
                        <Select
                          value={customization.ecLevel}
                          onValueChange={(value: 'L' | 'M' | 'Q' | 'H') =>
                            setCustomization({ ...customization, ecLevel: value })
                          }
                          disabled={!isPaidCustomizationAllowed || isGenerating}
                        >
                          <SelectTrigger className="w-full rounded-lg border-input focus:ring-primary">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Low (7%)</SelectItem>
                            <SelectItem value="M">Medium (15%)</SelectItem>
                            <SelectItem value="Q">Quartile (25%)</SelectItem>
                            <SelectItem value="H">High (30%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="size" className="text-foreground">Dimensions</Label>
                        <Select
                          value={String(customization.size)}
                          onValueChange={(value) =>
                            setCustomization({ ...customization, size: Number(value) })
                          }
                          disabled={!isPaidCustomizationAllowed || isGenerating}
                        >
                          <SelectTrigger className="w-full rounded-lg border-input focus:ring-primary">
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="128">Small (128px)</SelectItem>
                            <SelectItem value="256">Medium (256px)</SelectItem>
                            <SelectItem value="512">Large (512px)</SelectItem>
                            <SelectItem value="1024">Ultra (1024px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {!isPaidCustomizationAllowed && (
                      <p className="text-sm text-center mt-4 text-destructive">
                        Upgrade to the Paid Plan to unlock full customization.
                      </p>
                    )}
                  </Card>

                  <div className="pt-4">
                    <Button
                      onClick={handleGenerate}
                      disabled={!inputValue || !libReady || isGenerating}
                      className="group relative w-full overflow-hidden py-4.5 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground rounded-2xl font-semibold text-base transition-all shadow-lg shadow-primary/20 active:scale-[0.99] flex items-center justify-center gap-3"
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
                    </Button>
                  </div>
                </Card>
              </div>

              {/* Right Panel: Result */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <Card className="p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative border border-border flex justify-center items-center overflow-hidden w-full aspect-square max-w-[420px]">
                  <div className="flex items-center justify-center w-full h-full">
                    <div
                      ref={qrRef}
                      className={`flex items-center justify-center transition-all duration-700 ${isGenerating ? 'opacity-0 scale-90 blur-xl' : 'opacity-100 scale-100'}`}
                    />

                    {!inputValue && !isGenerating && !lastGenerated.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 gap-6">
                        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border border-border shadow-inner">
                          <QrCode size={48} strokeWidth={1} className="text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-medium tracking-wide">Enter content to preview</p>
                      </div>
                    )}

                    {isGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                          <div className="absolute w-32 h-32 bg-primary/10 rounded-full animate-ping opacity-20"></div>
                          <Sparkles size={60} className="text-primary animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {lastGenerated.current && !isGenerating && (
                  <Button
                    onClick={downloadQR}
                    className="mt-8 flex items-center gap-3 bg-foreground text-background px-10 py-4 rounded-2xl hover:bg-foreground/90 transition-all font-semibold shadow-xl shadow-border w-full sm:w-auto"
                  >
                    <Download size={20} />
                    Export as PNG
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Card className="rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 border border-border">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-xl">
                    <History size={20} className="text-emerald-500" />
                  </div>
                  Recently Generated
                </h2>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={clearHistory}
                    className="text-destructive hover:text-destructive/90 font-semibold text-sm px-4 py-2 hover:bg-destructive/10 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Clear list
                  </Button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-32 text-center space-y-4">
                  <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted-foreground/30 border border-border">
                    <History size={40} strokeWidth={1} />
                  </div>
                  <p className="text-muted-foreground font-medium">Your creative history will appear here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <Card key={item.id} className="flex items-center justify-between p-5 rounded-2xl bg-card border border-border hover:border-primary/20 hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-5 min-w-0">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: item.color }}
                        >
                          {item.contentType === 'document' && <FileText size={24} />}
                          {item.contentType === 'social_media' && <Share2 size={24} />}
                          {item.contentType === 'menu' && <Utensils size={24} />}
                          {item.contentType === 'app_store' && <AppWindow size={24} />}
                          {item.contentType === 'url' && <LinkIcon size={24} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate text-base mb-1">{item.text}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">{item.size}px</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{item.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setInputValue(item.text);
                            setCustomization(prev => ({
                              ...prev,
                              fgColor: item.color,
                              ecLevel: 'M',
                              bgColor: '#ffffff',
                              size: item.size,
                            }));
                            setQrType(item.qrType);
                            setQrContentType(item.contentType);
                            setActiveTab('generate');
                            setTimeout(() => renderQRCode(item.text, item.color, item.size, 'M'), 100);
                          }}
                          className="p-2.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Reuse settings"
                        >
                          <Settings size={18} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
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