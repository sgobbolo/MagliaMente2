import { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { Menu, X, Instagram, Mail, Lock } from 'lucide-react';
import logo from './assets/images/regenerated_image_1777976278505.png';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Lavori', path: '/#lavori' },
    { name: 'Contatti', path: '/#contatti' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-cream/80 backdrop-blur-md border-b border-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-terracotta/20">
              <img src={logo} alt="MagliaMente Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight text-ink">
              Maglia<span className="text-terracotta italic">Mente</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a 
                key={link.name}
                href={link.path}
                className="text-sm font-medium text-ink/70 hover:text-terracotta transition-colors"
              >
                {link.name}
              </a>
            ))}
            <Link 
              to="/admin"
              className="p-2 rounded-full hover:bg-paper transition-colors text-ink/70 hover:text-terracotta"
              title="Area Riservata"
            >
              <Lock className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-ink"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-cream border-b border-paper"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-ink hover:text-terracotta"
                >
                  {link.name}
                </a>
              ))}
              {user && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-ink"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-paper py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-serif font-bold mb-6">MagliaMente</h2>
        <div className="flex justify-center space-x-6 mb-8">
          <a href="#" className="text-ink/60 hover:text-terracotta transition-colors">
            <Instagram className="w-6 h-6" />
          </a>
          <a href="#" className="text-ink/60 hover:text-terracotta transition-colors">
            <Mail className="w-6 h-6" />
          </a>
        </div>
        <p className="text-sm text-ink/40 mb-4">
          &copy; {new Date().getFullYear()} MagliaMente. Creato con amore e filati.
        </p>
        <Link 
          to="/admin" 
          className="text-xs text-ink/20 hover:text-terracotta transition-colors uppercase tracking-widest font-bold"
        >
          Area Riservata
        </Link>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
