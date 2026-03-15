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
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative container mx-auto px-4 py-10 md:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-4 md:space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs md:text-sm font-medium backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
            Verified Farmers Only
          </div>
          
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight tracking-tight">
            Fresh Produce from{' '}
            <span className="text-accent">Verified</span>{' '}
            Nigerian Farmers
          </h1>
          
          <p className="text-sm md:text-xl text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
            Browse local produce. Contact farmers directly. No middlemen.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto pt-1 md:pt-2">
            <div className="relative flex bg-primary-foreground rounded-xl shadow-lg overflow-hidden">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search produce, farmers..."
                className="flex-1 h-11 md:h-14 pl-10 md:pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm md:text-base"
              />
              <Button
                type="submit"
                className="m-1 md:m-1.5 px-4 md:px-6 rounded-lg font-semibold text-sm"
                size="default"
              >
                Search
              </Button>
            </div>
          </form>

          {/* Trust pills - horizontal scroll on mobile */}
          <div className="flex items-center justify-center gap-3 md:gap-4 pt-2 md:pt-4 text-xs md:text-sm text-primary-foreground/75 overflow-x-auto">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5" /> ID-Verified
            </span>
            <span className="text-primary-foreground/30">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="h-3.5 w-3.5" /> Local
            </span>
            <span className="text-primary-foreground/30">•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <MessageCircle className="h-3.5 w-3.5" /> Direct Contact
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
