import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, Plan } from '@/context/AuthContext';
import { Download, Lock } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

type QRType = 'static' | 'dynamic';

interface CustomizationOptions {
  fgColor: string;
  bgColor: string;
  logoImage: string | null;
  ecLevel: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_CUSTOMIZATION: CustomizationOptions = {
  fgColor: '#000000',
  bgColor: '#ffffff',
  logoImage: null,
  ecLevel: 'M',
};

const QRCodeGenerator: React.FC = () => {
  const { plan, user, getPlanLimits } = useAuth();
  const limits = getPlanLimits();

  const [inputValue, setInputValue] = useState('https://www.dyad.sh');
  const [qrType, setQrType] = useState<QRType>('static');
  const [customization, setCustomization] = useState<CustomizationOptions>(DEFAULT_CUSTOMIZATION);

  const isDynamicAllowed = plan !== 'guest';
  const isPaidCustomizationAllowed = limits.canCustomize;
  
  // Mocking the short URL for dynamic QR codes
  const qrValue = qrType === 'dynamic' 
    ? \`https://dyad.sh/r/\${user?.id || 'guest'}/qr-id-123\` 
    : inputValue;

  const handleDownload = (format: 'png' | 'svg') => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) {
      showError('QR Code not rendered yet.');
      return;
    }

    if (format === 'png') {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qrcode.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else if (format === 'svg') {
      // qrcode.react doesn't directly support SVG download from canvas, 
      // but we can simulate the SVG generation logic if needed. 
      // For simplicity, we'll focus on PNG download for now, as SVG generation is complex without a dedicated library helper.
      showError('SVG download is not fully implemented in this mock component.');
      return;
    }
    showSuccess(\`QR Code downloaded as \${format.toUpperCase()}!\`);
  };

  const handleGenerate = () => {
    // In a real app, this would trigger a backend call to save the dynamic QR metadata.
    if (qrType === 'dynamic' && plan === 'free' && user && user.dynamicQRCodes >= limits.maxDynamicQRs) {
      showError(\`You have reached your limit of \${limits.maxDynamicQRs} dynamic QR codes on the Free Plan. Please upgrade.\`);
      return;
    }
    showSuccess(\`QR Code generated for: \${inputValue}\`);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">QR Code Generator</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-8">
        
        {/* Input and Settings Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="destination-url">Destination URL or Text</Label>
            <Input
              id="destination-url"
              placeholder="e.g., https://yourwebsite.com"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          {/* QR Type Selection */}
          <div className="space-y-2">
            <Label>QR Code Type</Label>
            <RadioGroup
              defaultValue="static"
              value={qrType}
              onValueChange={(value: QRType) => setQrType(value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="static" id="r1" />
                <Label htmlFor="r1">Static (Direct Embed)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value="dynamic" 
                  id="r2" 
                  disabled={!isDynamicAllowed}
                />
                <Label htmlFor="r2" className={cn(!isDynamicAllowed && "text-muted-foreground")}>
                  Dynamic (Editable URL, Trackable)
                  {!isDynamicAllowed && <Lock className="inline w-3 h-3 ml-1 text-red-500" />}
                </Label>
              </div>
            </RadioGroup>
            {qrType === 'dynamic' && plan === 'free' && (
              <p className="text-sm text-orange-500">
                Free Plan: {user?.dynamicQRCodes || 0} / {limits.maxDynamicQRs} Dynamic QRs used.
              </p>
            )}
          </div>

          {/* Customization Options (Paid Only) */}
          <Card className={cn(
            "p-4 transition-all",
            !isPaidCustomizationAllowed && "opacity-50 pointer-events-none bg-gray-50 dark:bg-gray-900"
          )}>
            <CardTitle className="text-lg mb-3 flex items-center">
              Customization (Paid Plan Only)
              {!isPaidCustomizationAllowed && <Lock className="inline w-4 h-4 ml-2 text-red-500" />}
            </CardTitle>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fgColor">Foreground Color</Label>
                <Input 
                  id="fgColor" 
                  type="color" 
                  value={customization.fgColor} 
                  onChange={(e) => setCustomization({...customization, fgColor: e.target.value})}
                  className="h-10 w-full p-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <Input 
                  id="bgColor" 
                  type="color" 
                  value={customization.bgColor} 
                  onChange={(e) => setCustomization({...customization, bgColor: e.target.value})}
                  className="h-10 w-full p-1"
                />
              </div>
              {/* Add more customization inputs here (Logo, EC Level) */}
            </div>
            {!isPaidCustomizationAllowed && (
              <p className="text-sm text-center mt-4 text-red-500">Upgrade to the Paid Plan to unlock full customization.</p>
            )}
          </Card>

          <Button onClick={handleGenerate} className="w-full">
            Generate QR Code
          </Button>
        </div>

        {/* QR Preview and Download Column */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 border rounded-lg bg-white dark:bg-gray-950">
            <QRCode
              id="qr-code-canvas"
              value={qrValue}
              size={256}
              level={customization.ecLevel}
              fgColor={customization.fgColor}
              bgColor={customization.bgColor}
              renderAs="canvas"
            />
          </div>
          
          <p className="text-sm text-muted-foreground break-all text-center">
            {qrType === 'dynamic' ? `Encoded Short URL: ${qrValue}` : `Encoded Data: ${inputValue}`}
          </p>

          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleDownload('png')}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Download PNG
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleDownload('svg')}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" /> Download SVG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;