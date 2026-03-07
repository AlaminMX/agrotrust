import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/90">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm font-medium backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4" />
            Verified Farmers Only
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight tracking-tight">
            Fresh Produce from{' '}
            <span className="text-accent">Verified</span>{' '}
            Nigerian Farmers
          </h1>
          
          <p className="text-lg md:text-xl text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
            Browse local produce. Contact farmers directly. No middlemen.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-2">
            <div className="relative flex bg-primary-foreground rounded-xl shadow-lg overflow-hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search produce, farmers, or areas..."
                className="flex-1 h-13 md:h-14 pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
              />
              <Button
                type="submit"
                className="m-1.5 px-6 rounded-lg font-semibold"
                size="lg"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Trust pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-sm text-primary-foreground/75">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> ID-Verified Farmers
            </span>
            <span className="hidden sm:inline text-primary-foreground/30">•</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Specific Locations
            </span>
            <span className="hidden sm:inline text-primary-foreground/30">•</span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" /> Direct WhatsApp Contact
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
