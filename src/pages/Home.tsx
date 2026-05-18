import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { workService, Work } from '../services/workService';
import { categoryService, Category } from '../services/categoryService';
import { Search, Filter, ArrowRight, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import heroImage from '../assets/images/regenerated_image_1777976278505.png';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    console.log("Setting up data subscriptions...");
    
    // Subscribe to categories
    const unsubscribeCats = categoryService.subscribeToCategories((catsData) => {
      setCategories(catsData);
    });

    // Subscribe to works
    const unsubscribeWorks = workService.subscribeToWorks((worksData) => {
      setWorks(worksData);
      setLoading(false);
    });

    return () => {
      unsubscribeCats();
      unsubscribeWorks();
    };
  }, []);

  const filteredWorks = filter === 'all' 
    ? works 
    : works.filter(w => w.category === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="mb-24 flex flex-col md:flex-row items-center gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 space-y-6"
        >
          <div className="inline-block px-3 py-1 bg-dusty-pink/20 text-terracotta rounded-full text-xs font-semibold uppercase tracking-widest">
            Fatto a mano con amore
          </div>
          <h1 className="text-5xl md:text-7xl font-serif leading-tight">
            Il calore di un <span className="text-terracotta italic">filo</span> tra le dita.
          </h1>
          <p className="text-lg text-ink/70 max-w-lg leading-relaxed">
            Esplora la mia collezione di lavori artigianali realizzati ai ferri, uncinetto, macramè e cucito. Ogni pezzo è unico, pensato per durare e trasmettere emozione.
          </p>
          <div className="pt-4">
            <a 
              href="#lavori"
              className="inline-flex items-center space-x-2 bg-ink text-cream px-8 py-4 rounded-full font-medium hover:bg-terracotta transition-colors group"
            >
              <span>Vedi i miei lavori</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 relative flex justify-center"
        >
          <div className="w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500 bg-white p-2">
            <img 
              src={heroImage} 
              alt="MagliaMente Logo"
              className="w-full h-auto block rounded-[1.5rem]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-ochre rounded-full blur-3xl opacity-20 -z-10" />
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-terracotta rounded-full blur-3xl opacity-20 -z-10" />
        </motion.div>
      </section>

      {/* Filter Section */}
      <section id="lavori" className="mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-paper pb-8">
          <h2 className="text-3xl font-serif italic">Le mie creazioni</h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === 'all' 
                  ? "bg-terracotta text-cream shadow-lg shadow-terracotta/20" 
                  : "bg-paper text-ink/60 hover:bg-paper/80"
              )}
            >
              Tutti
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.slug)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  filter === cat.slug 
                    ? "bg-terracotta text-cream shadow-lg shadow-terracotta/20" 
                    : "bg-paper text-ink/60 hover:bg-paper/80"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      {error ? (
        <div className="h-96 flex flex-col items-center justify-center text-red-500 space-y-4">
          <AlertCircle className="w-16 h-16" />
          <p className="text-xl font-serif">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-ink text-white rounded-full text-sm font-medium hover:bg-terracotta transition-colors"
          >
            Riprova
          </button>
        </div>
      ) : loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta" />
        </div>
      ) : (
        <div className="space-y-8">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredWorks.length > 0 ? filteredWorks.map((work) => (
            <motion.div
              layout
              key={work.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-paper"
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img 
                  src={work.imageUrl} 
                  alt={work.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-cream/90 backdrop-blur-sm text-ink text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                    {categories.find(c => c.slug === work.category)?.name || work.category}
                  </span>
                </div>
              </div>
              <div className="p-8 space-y-2">
                <h3 className="text-xl font-serif font-bold group-hover:text-terracotta transition-colors">
                  {work.title}
                </h3>
                <p className="text-ink/60 text-sm line-clamp-2 leading-relaxed">
                  {work.description}
                </p>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full h-96 flex flex-col items-center justify-center text-ink/40 space-y-4">
              <Search className="w-12 h-12 stroke-1" />
              <p className="text-lg italic font-serif text-center">Ancora nessun lavoro in questa categoria...</p>
            </div>
          )}
        </motion.div>
      </div>
    )}

      {/* Contact Section */}
      <section id="contatti" className="mt-40 bg-ink text-cream rounded-[3rem] p-12 md:p-24 text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta rounded-full blur-[120px] opacity-20 -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sage rounded-full blur-[120px] opacity-20 -ml-48 -mb-48" />
        
        <h2 className="text-4xl md:text-6xl font-serif leading-tight">
          Hai un'idea o vuoi un <span className="italic text-dusty-pink">ordine personalizzato?</span>
        </h2>
        <p className="text-cream/70 max-w-2xl mx-auto text-lg leading-relaxed">
          Sarei felice di dare vita ai tuoi desideri. Contattami via email o sui social per parlare del tuo prossimo capo fatto a mano.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <a 
            href="mailto:ciao@magliamente.it"
            className="bg-cream text-ink px-10 py-5 rounded-full font-bold hover:bg-terracotta hover:text-cream transition-all text-center"
          >
            Scrivimi una email
          </a>
          <a 
            href="#"
            className="border border-cream/20 text-cream px-10 py-5 rounded-full font-bold hover:bg-cream hover:text-ink transition-all text-center"
          >
            Seguimi su Instagram
          </a>
        </div>
      </section>
    </div>
  );
}
