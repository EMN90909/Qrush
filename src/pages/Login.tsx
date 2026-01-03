import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background QR Code Pattern */}
      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-10">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-repeat bg-size-[50px] animate-pulse-slow"></div>
      </div>
      {/* You might need to define `animate-pulse-slow` in your global.css or tailwind.config.ts */}

      <Card className="w-full max-w-md mx-auto shadow-lg rounded-xl border-none z-10 relative">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold text-foreground">Welcome to qrush</CardTitle>
          <p className="text-muted-foreground mt-2">Sign in or create an account to continue</p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // You can add 'google', 'github', etc. here if configured in Supabase
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                    inputBackground: 'hsl(var(--background))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                    inputText: 'hsl(var(--foreground))',
                  },
                },
              },
            }}
            theme="light" // Use 'dark' if your app supports dark mode
            redirectTo={window.location.origin + '/'}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;