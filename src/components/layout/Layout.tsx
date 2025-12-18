import { JumiaHeader } from './JumiaHeader';
import { Footer } from './Footer';
import { FarmerBottomNav } from './FarmerBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const [isFarmer, setIsFarmer] = useState(false);

  useEffect(() => {
    const checkFarmerRole = async () => {
      if (!user) {
        setIsFarmer(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'farmer')
        .maybeSingle();
      
      setIsFarmer(!!data);
    };

    checkFarmerRole();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JumiaHeader />
      <main className={`flex-1 ${isFarmer ? 'pb-16 lg:pb-0' : ''}`}>{children}</main>
      <Footer />
      {isFarmer && <FarmerBottomNav />}
    </div>
  );
};
