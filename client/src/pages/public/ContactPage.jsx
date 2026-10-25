import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ContactPage() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      addToast('Please fill out all fields', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      addToast('Thank you! Your message has been sent to our support desk.', 'success');
      setFormData({ name: '', email: '', message: '' });
    }, 600);
  };

  return (
    <div className="bg-palette-bg text-palette-text flex flex-col gap-14 sm:gap-20 pb-20">
      {/* 1. Hero Banner matching Reference Screen 6 */}
      <section className="relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=2000&q=85')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-palette-primary-dark/95 via-palette-primary/90 to-palette-primary-dark/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Get in Touch
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            We're here to help. Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* 2. Two-Column Contact Information & Form matching Reference Screen 6 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Information matching Reference */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-white border border-palette-border shadow-card space-y-6">
              <h3 className="text-xl font-bold text-palette-primary">Contact Information</h3>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-palette-secondary/15 flex items-center justify-center text-palette-secondary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-palette-muted">Email</div>
                  <a
                    href="mailto:support@safepassage.org"
                    className="text-sm font-semibold text-palette-primary hover:text-palette-secondary"
                  >
                    support@safepassage.org
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-palette-secondary/15 flex items-center justify-center text-palette-secondary shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-palette-muted">Phone</div>
                  <a
                    href="tel:+15551234567"
                    className="text-sm font-semibold text-palette-primary hover:text-palette-secondary"
                  >
                    +1 (555) 123-4567
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-palette-secondary/15 flex items-center justify-center text-palette-secondary shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-palette-muted">Location</div>
                  <div className="text-sm font-semibold text-palette-primary leading-snug">
                    123 Hope Avenue, <br />
                    San Francisco, CA 94107
                  </div>
                </div>
              </div>

              {/* 24/7 Available Highlight Box matching Reference */}
              <div className="p-5 rounded-2xl bg-palette-bg border border-palette-secondary/30 space-y-3">
                <div className="text-xs font-bold text-palette-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-palette-secondary animate-ping" />
                  We're Available 24/7
                </div>
                <p className="text-xs text-palette-muted leading-relaxed">
                  For urgent emergency assistance, please use our 24/7 emergency dispatch hotline.
                </p>
                <a href="tel:1990" className="inline-block">
                  <button className="px-4 py-2 rounded-xl text-xs font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white shadow-sm">
                    Call Now (1990)
                  </button>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: "Send Us a Message" Form matching Reference */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-palette-border shadow-card">
              <h3 className="text-xl font-bold text-palette-primary mb-6">Send Us a Message</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-palette-muted block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your Name"
                    className="w-full rounded-xl border border-palette-border px-4 py-3 text-sm text-palette-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-secondary/30 focus:border-palette-secondary"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-palette-muted block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@example.com"
                    className="w-full rounded-xl border border-palette-border px-4 py-3 text-sm text-palette-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-secondary/30 focus:border-palette-secondary"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-palette-muted block mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can our assistance coordinators help you?"
                    className="w-full rounded-xl border border-palette-border p-4 text-sm text-palette-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-palette-secondary/30 focus:border-palette-secondary"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl text-sm font-bold bg-palette-secondary hover:bg-palette-secondary-dark text-white transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Transmitting...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
