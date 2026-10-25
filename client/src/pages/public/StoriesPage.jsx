import React from 'react';
import { Link } from 'react-router-dom';
import { Quote, Star, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function StoriesPage() {
  const testimonials = [
    {
      quote:
        'Safe Passage gave me the information and support I needed when I had to leave my home. I felt less alone and more secure knowing verified rescue crews were one tap away.',
      author: 'Maria S.',
      role: 'Independent Traveler',
      location: 'Central Highlands',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      category: 'Medical Assistance Resolved',
    },
    {
      quote:
        'The route guidance and emergency contacts saved my family when our vehicle broke down in heavy fog on the mountain pass. We reached our destination safely thanks to this platform.',
      author: 'Ahmed K.',
      role: 'Family Traveler',
      location: 'Route A4 Mountain Corridor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      category: 'Roadside Recovery Resolved',
    },
    {
      quote:
        'A trusted and easy-to-use platform. Highly recommended for anyone on the move. The real-time timeline gave us complete peace of mind while the tow truck was dispatched.',
      author: 'Lina T.',
      role: 'Relocation Seeker & Explorer',
      location: 'Southern Expressway',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      category: 'Verified Response Feedback',
    },
    {
      quote:
        'When our hiking group missed a trail marker near Horton Plains, the GPS coordinate lock allowed park rangers to locate our position within 30 minutes without panic.',
      author: 'David Chen',
      role: 'Adventure Backpacker',
      location: 'Horton Plains National Park',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      category: 'Lost & Stranded Search Resolved',
    },
  ];

  return (
    <div className="bg-palette-bg text-palette-text flex flex-col gap-14 sm:gap-20 pb-20">
      {/* 1. Hero Banner matching Reference Screen 4 */}
      <section className="relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=2000&q=85')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-palette-primary-dark/95 via-palette-primary/90 to-palette-primary-dark/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Real Stories. Real Journeys.
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            Hear from people who found safety, support, and a new beginning with Safe Passage.
          </p>
        </div>
      </section>

      {/* 2. Vertical Stack of Testimonial Quote Cards matching Reference Screen 4 */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 -mt-8 relative z-20">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="p-8 sm:p-10 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all flex flex-col sm:flex-row items-start gap-6"
          >
            {/* Green Quotation Mark Icon */}
            <div className="text-palette-secondary text-5xl font-serif leading-none select-none shrink-0">
              “
            </div>

            <div className="space-y-4 flex-1">
              <p className="text-sm sm:text-base text-palette-text font-normal italic leading-relaxed">
                "{t.quote}"
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-11 h-11 rounded-full object-cover border-2 border-palette-secondary"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-palette-primary">{t.author}</h4>
                    <p className="text-xs text-palette-muted">{t.role} • {t.location}</p>
                  </div>
                </div>

                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-palette-secondary border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {t.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 3. CTA Box */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="p-8 rounded-3xl bg-palette-primary text-white text-center space-y-3">
          <h3 className="text-xl font-bold">Have an Emergency to Report?</h3>
          <p className="text-xs text-slate-300">
            Our 24/7 emergency response dispatch network is always online to support your journey.
          </p>
          <div className="pt-2">
            <Link to="/traveler/report">
              <button className="px-5 py-2.5 rounded-xl text-xs font-bold bg-palette-secondary text-white hover:bg-palette-secondary-dark transition-all">
                Report Emergency Now
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
