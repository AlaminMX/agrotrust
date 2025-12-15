import { JumiaHeader } from './JumiaHeader';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JumiaHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
