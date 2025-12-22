import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin, BadgeCheck, LayoutDashboard, MessageCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">AgroTrust</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting verified Nigerian farmers directly to consumers. Fresh produce, fair prices, trusted transactions.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Quick Links</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Browse Products
              </Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link to="/track-order" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Track Order
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                My Account
              </Link>
            </nav>
          </div>

          {/* For Farmers */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">For Farmers</h4>
            <nav className="flex flex-col gap-2">
              <Link to="/farmer/onboarding" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                Become a Verified Farmer
              </Link>
              <Link to="/farmer/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Farmer Dashboard
              </Link>
              <span className="text-xs text-muted-foreground/70 pt-1">
                90% payout • Auto payments • Platform logistics
              </span>
            </nav>
          </div>

          {/* Coverage */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">We Deliver To</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Abuja
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Kaduna
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Bauchi
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Kano
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:nexelwebdev@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" /> nexelwebdev@gmail.com
              </a>
              <a href="tel:+2348091994767" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4" /> 08091994767
              </a>
              <a 
                href="https://wa.me/2348091994767" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AgroTrust. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
