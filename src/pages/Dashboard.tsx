import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Link as LinkIcon, FileText, Share2, Utensils, AppWindow, Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

interface QRCodeItem {
  id: string;
  name: string | null;
  destination_url: string;
  short_url: string | null;
  qr_type: 'static' | 'dynamic';
  content_type: 'url' | 'document' | 'social_media' | 'menu' | 'app_store';
  scan_count: number;
  fg_color: string;
  bg_color: string;
  ec_level: string;
  created_at: string;
}

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case 'document': return <FileText className="w-5 h-5" />;
    case 'social_media': return <Share2 className="w-5 h-5" />;
    case 'menu': return <Utensils className="w-5 h-5" />;
    case 'app_store': return <AppWindow className="w-5 h-5" />;
    case 'url':
    default: return <LinkIcon className="w-5 h-5" />;
  }
};

const Dashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [qrcodes, setQRCodes] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchQRCodes = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('qrcodes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching QR codes:', error);
      showError('Failed to load your QR codes.');
    } else {
      setQRCodes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchQRCodes();
    }
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;

    const { error } = await supabase
      .from('qrcodes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting QR code:', error);
      showError('Failed to delete QR code.');
    } else {
      showSuccess('QR code deleted successfully!');
      fetchQRCodes(); // Refresh the list
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-2">Loading QR codes...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Your QR Codes</h2>
          <Button onClick={() => navigate('/studio')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="w-4 h-4 mr-2" /> Create New QR
          </Button>
        </div>

        {qrcodes.length === 0 ? (
          <Card className="p-8 text-center rounded-xl shadow-sm border-border">
            <CardTitle className="text-xl text-muted-foreground mb-4">No QR codes generated yet!</CardTitle>
            <p className="text-muted-foreground mb-6">Start creating your first QR code in the studio.</p>
            <Button onClick={() => navigate('/studio')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Go to QR Studio
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrcodes.map((qr) => (
              <Card key={qr.id} className="rounded-xl shadow-sm border-border flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold truncate">{qr.name || 'Untitled QR Code'}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${qr.qr_type === 'dynamic' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                      {qr.qr_type === 'dynamic' ? 'Dynamic' : 'Static'}
                    </span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      {getContentTypeIcon(qr.content_type)} {qr.content_type.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between">
                  <p className="text-sm text-muted-foreground mb-4 break-all">
                    {qr.destination_url}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
                    <span>Scans: {qr.scan_count}</span>
                    <span>Created: {new Date(qr.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(`/studio?edit=${qr.id}`)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(qr.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;