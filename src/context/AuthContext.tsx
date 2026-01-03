import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

export type Plan = 'guest' | 'free' | 'paid';

interface UserProfile {
  id: string;
  email: string;
  plan: Plan;
  dynamicQRCodes: number; // Current count of dynamic QRs
  storageUsedMB: number; // Current storage usage
  // Add other profile fields as needed
}

interface AuthContextType {
  user: UserProfile | null;
  plan: Plan;
  session: Session | null;
  loading: boolean;
  signIn: () => void; // No longer takes a plan, redirects to login
  signOut: () => void;
  getPlanLimits: () => {
    maxDynamicQRs: number;
    maxStorageMB: number;
    canCustomize: boolean;
    canTrackAnalytics: boolean;
  };
}

const defaultLimits = {
  maxDynamicQRs: 0,
  maxStorageMB: 0,
  canCustomize: false,
  canTrackAnalytics: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const plan = user?.plan || 'guest';

  const getPlanLimits = () => {
    switch (plan) {
      case 'free':
        return {
          maxDynamicQRs: 2,
          maxStorageMB: 20,
          canCustomize: false,
          canTrackAnalytics: true, // Scan count tracking
        };
      case 'paid':
        return {
          maxDynamicQRs: 20,
          maxStorageMB: Infinity,
          canCustomize: true,
          canTrackAnalytics: true, // Full analytics
        };
      case 'guest':
      default:
        return defaultLimits;
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setLoading(true);
      if (currentSession) {
        // Fetch user profile from public.profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, user_type, dynamicQRCodes, storageUsedMB') // Assuming these columns exist or will be added
          .eq('id', currentSession.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          showError('Failed to load user profile.');
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || 'unknown@example.com',
            plan: 'guest', // Default to guest if profile fetch fails
            dynamicQRCodes: 0,
            storageUsedMB: 0,
          });
        } else if (profile) {
          setUser({
            id: profile.id,
            email: profile.email || currentSession.user.email || 'unknown@example.com',
            plan: (profile.user_type as Plan) || 'guest', // Map user_type to plan
            dynamicQRCodes: profile.dynamicQRCodes || 0,
            storageUsedMB: profile.storageUsedMB || 0,
          });
        } else {
          // If no profile found, create a basic one or default to guest
          setUser({
            id: currentSession.user.id,
            email: currentSession.user.email || 'unknown@example.com',
            plan: 'guest',
            dynamicQRCodes: 0,
            storageUsedMB: 0,
          });
        }
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
      setLoading(false);
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (!initialSession) {
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
        setLoading(false);
      }
      // The onAuthStateChange listener will handle setting the user if initialSession exists
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = () => {
    navigate('/login');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Failed to sign out.');
      console.error('Error signing out:', error);
    } else {
      showSuccess('Signed out successfully!');
      setUser(null);
      setSession(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, plan, session, loading, signIn, signOut, getPlanLimits }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};