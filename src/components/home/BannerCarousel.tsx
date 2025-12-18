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
    gradient: 'from-black/40 via-black/20 to-transparent',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&h=800&fit=crop&q=80',
  },
  {
    id: 2,
    title: 'Verified Farmers You Can Trust',
    subtitle: 'Every farmer on AgroTrust is verified for quality and reliability.',
    cta: 'Meet Our Farmers',
    link: '/products',
    gradient: 'from-black/40 via-black/20 to-transparent',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1920&h=800&fit=crop&q=80',
  },
  {
    id: 3,
    title: 'Your Money is Protected',
    subtitle: 'Escrow payment ensures you only pay when satisfied with delivery.',
    cta: 'Learn More',
    link: '/how-it-works',
    gradient: 'from-black/40 via-black/20 to-transparent',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1920&h=800&fit=crop&q=80',
  },
  {
    id: 4,
    title: 'Free Delivery on Orders Above ₦20,000',
    subtitle: 'Fresh produce delivered straight to your doorstep.',
    cta: 'Start Shopping',
    link: '/products',
    gradient: 'from-black/40 via-black/20 to-transparent',
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&h=800&fit=crop&q=80',
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
      <div className="relative h-[300px] md:h-[450px] lg:h-[500px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-in-out",
              index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            )}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.image})` }}
            />
            {/* Gradient Overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r",
              banner.gradient
            )} />
            
            {/* Content */}
            <div className="relative h-full container flex items-center">
              <div className="max-w-xl space-y-4 md:space-y-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white drop-shadow-lg">
                  {banner.title}
                </h2>
                <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                  {banner.subtitle}
                </p>
                <Link to={banner.link}>
                  <Button 
                    size="lg" 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {banner.cta}
                  </Button>
                </Link>
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
        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm border border-white/20 transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm border border-white/20 transition-all"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              "h-3 rounded-full transition-all shadow-md",
              index === currentSlide ? "w-10 bg-white" : "w-3 bg-white/50 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
};
