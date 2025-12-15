import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const banners = [
  {
    id: 1,
    title: 'Fresh Produce, Direct from Farms',
    subtitle: 'Skip the middlemen. Get farm-fresh products at fair prices.',
    cta: 'Shop Now',
    link: '/products',
    gradient: 'from-primary to-primary/80',
    emoji: '🥬',
  },
  {
    id: 2,
    title: 'Verified Farmers You Can Trust',
    subtitle: 'Every farmer on AgroTrust is verified for quality and reliability.',
    cta: 'Meet Our Farmers',
    link: '/products',
    gradient: 'from-earth to-earth/80',
    emoji: '👨‍🌾',
  },
  {
    id: 3,
    title: 'Your Money is Protected',
    subtitle: 'Escrow payment ensures you only pay when satisfied with delivery.',
    cta: 'Learn More',
    link: '/how-it-works',
    gradient: 'from-forest to-forest-light',
    emoji: '🛡️',
  },
  {
    id: 4,
    title: 'Free Delivery on Orders Above ₦20,000',
    subtitle: 'Fresh produce delivered straight to your doorstep.',
    cta: 'Start Shopping',
    link: '/products',
    gradient: 'from-orange to-orange-dark',
    emoji: '🚚',
  },
];

export const BannerCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % banners.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section 
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[300px] md:h-[400px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            )}
          >
            <div className={cn(
              "h-full bg-gradient-to-r text-white",
              banner.gradient
            )}>
              <div className="container h-full flex items-center">
                <div className="max-w-xl space-y-4">
                  <span className="text-5xl">{banner.emoji}</span>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    {banner.title}
                  </h2>
                  <p className="text-lg md:text-xl opacity-90">
                    {banner.subtitle}
                  </p>
                  <Link to={banner.link}>
                    <Button size="lg" className="bg-white text-foreground hover:bg-white/90 font-semibold">
                      {banner.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentSlide ? "w-8 bg-white" : "w-2 bg-white/50"
            )}
          />
        ))}
      </div>
    </section>
  );
};
