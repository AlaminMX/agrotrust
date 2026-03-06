import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, BadgeCheck, LayoutDashboard, MessageCircle, Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary"><Leaf className="h-5 w-5 text-primary-foreground" /></div>
              <span className="text-xl font-bold text-foreground">AgroTrust</span>
            </Link>
            <p className="text-sm text-muted-foreground">Connecting verified Nigerian farmers directly with buyers. Fresh produce, fair prices, no middlemen.</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse Listings</Link>
              <Link to="/trust-and-safety" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Trust & Safety</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">For Farmers</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/farmer/onboarding" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" />Become a Verified Farmer</Link>
              <Link to="/farmer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"><LayoutDashboard className="h-3.5 w-3.5" />Farmer Dashboard</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:nexelwebdev@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> nexelwebdev@gmail.com</a>
              <a href="tel:+2348091994767" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> 08091994767</a>
              <a href="https://wa.me/2348091994767" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><MessageCircle className="h-4 w-4" /> WhatsApp Us</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} AgroTrust. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
