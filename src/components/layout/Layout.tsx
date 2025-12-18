import { JumiaHeader } from './JumiaHeader';
import { Footer } from './Footer';
import { FarmerBottomNav } from './FarmerBottomNav';
import { ConsumerBottomNav } from './ConsumerBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuth();
  const [isFarmer, setIsFarmer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRoles = async () => {
      if (!user) {
        setIsFarmer(false);
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const roles = data?.map(r => r.role) || [];
      setIsFarmer(roles.includes('farmer'));
      setIsAdmin(roles.includes('admin'));
    };

    checkRoles();
  }, [user]);

  // Determine which bottom nav to show
  const showFarmerNav = isFarmer;
  const showConsumerNav = user && !isFarmer && !isAdmin;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JumiaHeader />
      <main className={`flex-1 ${(showFarmerNav || showConsumerNav) ? 'pb-16 lg:pb-0' : ''}`}>{children}</main>
      <Footer />
      {showFarmerNav && <FarmerBottomNav />}
      {showConsumerNav && <ConsumerBottomNav />}
    </div>
  );
};
