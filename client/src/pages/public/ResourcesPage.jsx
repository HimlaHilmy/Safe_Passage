import React, { useState } from 'react';
import { Search, FileText, Download, Eye, HelpCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ResourcesPage() {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Guides', 'Documents', 'Safety Tips', 'FAQs'];

  const resources = [
    {
      id: 1,
      title: 'Travel Safety Guide',
      category: 'Guides',
      description: 'Essential emergency preparedness tips and route navigation advice for travelers.',
      type: 'PDF Document',
      size: '2.4 MB',
      action: 'Download',
    },
    {
      id: 2,
      title: 'Emergency Contact List',
      category: 'Documents',
      description: 'Important national and regional shortcodes, trauma units, and police hotlines.',
      type: 'Directory Sheet',
      size: '850 KB',
      action: 'Download',
    },
    {
      id: 3,
      title: 'Relocation & Travel Checklist',
      category: 'Documents',
      description: 'Step-by-step checklist for safe cross-provincial vehicle travel and emergency kit items.',
      type: 'Checklist PDF',
      size: '1.2 MB',
      action: 'Download',
    },
    {
      id: 4,
      title: 'Roadside Breakdown Protocol',
      category: 'Safety Tips',
      description: 'What to do when stranded on expressway shoulders: hazard lights, triangle placement, and GPS pinning.',
      type: 'Quick Guide',
      size: '1.1 MB',
      action: 'Download',
    },
    {
      id: 5,
      title: 'Frequently Asked Questions (FAQs)',
      category: 'FAQs',
      description: 'Comprehensive answers regarding response SLAs, verified provider accreditation, and GPS accuracy.',
      type: 'Knowledge Base',
      size: 'Online',
      action: 'View',
    },
  ];

  const handleAction = (item) => {
    addToast(`Preparing "${item.title}" for download/view...`, 'success');
  };

  const filteredResources = resources.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-palette-bg text-palette-text flex flex-col gap-14 sm:gap-20 pb-20">
      {/* 1. Hero Banner matching Reference Screen 5 */}
      <section className="relative min-h-[340px] sm:min-h-[400px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=2000&q=85')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-palette-primary-dark/95 via-palette-primary/90 to-palette-primary-dark/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Resources
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            Find helpful guides, documents, and information to support your journey.
          </p>
        </div>
      </section>

      {/* 2. Search, Filter Pills & Resources List matching Reference Screen 5 */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6 -mt-8 relative z-20">
        {/* Search Bar matching Reference */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..."
            className="w-full rounded-2xl bg-white border border-palette-border pl-12 pr-4 py-3.5 text-sm text-palette-text shadow-card focus:outline-none focus:ring-2 focus:ring-palette-secondary/30 focus:border-palette-secondary"
          />
        </div>

        {/* Category Pills matching Reference: All, Guides, Documents, Safety Tips, FAQs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0
                ${
                  selectedCategory === cat
                    ? 'bg-palette-secondary text-white shadow-xs'
                    : 'bg-white text-palette-muted hover:text-palette-primary border border-palette-border'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of Resource Cards matching Reference */}
        <div className="space-y-4 pt-2">
          {filteredResources.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-palette-border shadow-card hover:shadow-card-hover transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                {/* Green Document Icon Box matching reference */}
                <div className="w-12 h-12 rounded-xl bg-palette-secondary/15 flex items-center justify-center text-palette-secondary shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-palette-primary">{item.title}</h4>
                  <p className="text-xs text-palette-muted mt-0.5 leading-relaxed max-w-md">
                    {item.description}
                  </p>
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">
                    {item.type} • {item.size}
                  </div>
                </div>
              </div>

              {/* Action Button: Download or View matching reference */}
              <button
                onClick={() => handleAction(item)}
                className="text-xs font-bold text-palette-secondary hover:text-palette-secondary-dark hover:underline flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg border border-palette-secondary/30 hover:bg-palette-secondary/5"
              >
                {item.action === 'Download' ? <Download className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{item.action}</span>
              </button>
            </div>
          ))}

          {filteredResources.length === 0 && (
            <div className="text-center py-12 text-palette-muted text-sm bg-white rounded-2xl border border-palette-border">
              No resources match your search criteria.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
