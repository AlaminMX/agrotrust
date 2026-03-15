import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, ShieldCheck, MessageCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary-foreground" />
              </div>
              <span className="text-base md:text-lg font-bold text-foreground">AgroTrust</span>
            </Link>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Connecting verified Nigerian farmers directly with buyers. Fresh produce, fair prices.
            </p>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            <h4 className="font-semibold text-foreground text-xs md:text-sm">Quick Links</h4>
            <nav className="flex flex-col gap-1.5 md:gap-2">
              <Link to="/products" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">Browse Listings</Link>
              <Link to="/trust-and-safety" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5" /> Trust & Safety
              </Link>
            </nav>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            <h4 className="font-semibold text-foreground text-xs md:text-sm">For Farmers</h4>
            <nav className="flex flex-col gap-1.5 md:gap-2">
              <Link to="/farmer/onboarding" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" /> Become a Farmer
              </Link>
              <Link to="/farmer/dashboard" className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">Farmer Dashboard</Link>
            </nav>
          </div>
          <div className="space-y-2.5 md:space-y-3">
            <h4 className="font-semibold text-foreground text-xs md:text-sm">Contact</h4>
            <div className="flex flex-col gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
              <a href="mailto:nexelwebdev@gmail.com" className="flex items-center gap-1.5 md:gap-2 hover:text-primary transition-colors truncate">
                <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" /> nexelwebdev@gmail.com
              </a>
              <a href="tel:+2348091994767" className="flex items-center gap-1.5 md:gap-2 hover:text-primary transition-colors">
                <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" /> 08091994767
              </a>
              <a href="https://wa.me/2348091994767" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 md:gap-2 hover:text-primary transition-colors">
                <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-border">
          <p className="text-[10px] md:text-xs text-muted-foreground text-center">© {new Date().getFullYear()} AgroTrust. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
