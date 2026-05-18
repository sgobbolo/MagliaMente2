import { useState, useEffect, FormEvent } from 'react';
import { storageService } from '../services/storageService';
import { workService, Work } from '../services/workService';
import { categoryService, Category } from '../services/categoryService';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  Image as ImageIcon,
  Check,
  X,
  PlusCircle,
  Upload,
  Loader2,
  Lock,
  ExternalLink,
  Tag,
  AlertTriangle,
  UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    imageUrl: ''
  });

  useEffect(() => {
    // Auth subscription
    const unsubscribeAuth = storageService.onAuthStateChange((user) => {
      setIsLoggedIn(!!user && storageService.isAdmin());
    });


    // Subscriptions
    const unsubscribeWorks = workService.subscribeToWorks((data) => {
      setWorks(data);
      setLoading(false);
    });

    const unsubscribeCategories = categoryService.subscribeToCategories((data) => {
      setCategories(data);
      // Set default category only once if not set
      setFormData(prev => {
        if (!prev.category && data.length > 0) {
          return { ...prev, category: data[0].slug };
        }
        return prev;
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeWorks();
      unsubscribeCategories();
    };
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await storageService.login();
      if (!storageService.isAdmin()) {
        setLoginError("Questo account non è autorizzato per l'accesso amministrativo.");
        await storageService.logout();
      }
    } catch (error) {
      setLoginError("Errore durante l'accesso con Google. Assicurati che il tuo account sia autorizzato.");
    }
  };


  const handleLogout = async () => {
    await storageService.logout();
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.category) {
      alert("Crea almeno una categoria prima di aggiungere un lavoro.");
      return;
    }
    try {
      if (editingWork) {
        await workService.updateWork(editingWork.id!, formData);
        setSuccessMessage("Lavoro aggiornato con successo!");
      } else {
        await workService.addWork(formData);
        setSuccessMessage("Lavoro pubblicato con successo!");
      }
      setShowAddModal(false);
      setEditingWork(null);
      setFormData({ 
        title: '', 
        description: '', 
        category: categories[0]?.slug || '', 
        imageUrl: '' 
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Operation failed", error);
      alert("Operazione fallita. Assicurati di essere registrato come amministratore.");
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const slug = newCatName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      await categoryService.addCategory({ name: newCatName, slug });
      setNewCatName('');
    } catch (error) {
      console.error("Failed to add category", error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Eliminando la categoria, i lavori associati potrebbero non essere più filtrabili correttamente. Continuare?")) {
      try {
        await categoryService.deleteCategory(id);
        setSuccessMessage("Categoria eliminata!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error("Failed to delete category", error);
        setError("Impossibile eliminare la categoria.");
      }
    }
  };

  const handleEdit = (work: Work) => {
    setEditingWork(work);
    setFormData({
      title: work.title,
      description: work.description,
      category: work.category,
      imageUrl: work.imageUrl
    });
    setShowAddModal(true);
  };

  const handleImageResize = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for a web preview
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Export with quality control to hit ~400-500KB range
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const resizedImage = await handleImageResize(file);
      setFormData(prev => ({ ...prev, imageUrl: resizedImage }));
    } catch (error) {
      console.error("Resize failed", error);
      alert("Errore nel caricamento dell'immagine.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Sei sicuro di voler eliminare questo lavoro?")) {
      try {
        await workService.deleteWork(id);
        setSuccessMessage("Lavoro eliminato con successo!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (error) {
        console.error("Admin: Delete failed", error);
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-terracotta" />
    </div>
  );

  if (!isLoggedIn) return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-[2rem] border border-paper shadow-xl text-center space-y-6">
      <Lock className="w-12 h-12 mx-auto text-terracotta" />
      <h1 className="text-2xl font-serif font-bold">Accesso Riservato</h1>
      <p className="text-ink/60">Accedi con il tuo account Google autorizzato per gestire i tuoi lavori.</p>
      
      {loginError && (
        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          {loginError}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <button 
          type="submit"
          className="w-full bg-ink text-cream py-4 rounded-full font-bold hover:bg-terracotta transition-all flex items-center justify-center space-x-2"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-sm p-0.5" />
          <span>Accedi con Google</span>
        </button>
      </form>
      <p className="text-[10px] text-ink/20 uppercase tracking-widest">Solo l'amministratore può accedere</p>
    </div>
  );


  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold">Gestione MagliaMente</h1>
          <p className="text-ink/60">Controlla lavori e categorie</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowCatModal(true)}
            className="bg-sage text-cream px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-ink transition-all shadow-lg shadow-sage/20"
          >
            <Tag className="w-5 h-5" />
            <span>Categorie</span>
          </button>
          <button 
            onClick={() => {
              setEditingWork(null);
              setFormData({ 
                title: '', 
                description: '', 
                category: categories[0]?.slug || '', 
                imageUrl: '' 
              });
              setShowAddModal(true);
            }}
            className="bg-terracotta text-cream px-6 py-3 rounded-full font-bold flex items-center space-x-2 hover:bg-ink transition-all shadow-lg shadow-terracotta/20"
          >
            <Plus className="w-5 h-5" />
            <span>Nuovo Lavoro</span>
          </button>
          <button 
            onClick={handleLogout}
            className="p-3 bg-paper rounded-full text-ink hover:text-terracotta transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 bg-sage text-cream rounded-2xl flex items-center justify-center space-x-2 shadow-lg"
          >
            <Check className="w-5 h-5" />
            <span className="font-bold">{successMessage}</span>
          </motion.div>
        )}
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center space-x-2 border border-red-100 shadow-sm"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => window.location.reload()} className="ml-2 underline text-xs">Ricarica</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {works.map((work) => (
          <div key={work.id} className="bg-white p-4 rounded-2xl border border-paper flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
            <img 
              src={work.imageUrl} 
              className="w-20 h-24 object-cover rounded-xl"
              alt={work.title}
              referrerPolicy="no-referrer"
            />
            <div className="flex-grow">
              <h3 className="font-bold text-lg">{work.title}</h3>
              <p className="text-sm text-ink/60 italic">
                {categories.find(c => c.slug === work.category)?.name || work.category}
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                type="button"
                onClick={() => handleEdit(work)}
                className="p-2 bg-paper rounded-lg text-ink/40 hover:text-terracotta hover:bg-paper/80 transition-all"
                title="Modifica"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                type="button"
                onClick={() => handleDelete(work.id!)}
                title="Elimina lavoro"
                className="p-3 bg-paper rounded-xl text-ink/40 hover:text-red-500 hover:bg-red-50 transition-all group flex items-center justify-center min-w-[44px] min-h-[44px]"
              >
                <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform pointer-events-none" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {works.length === 0 && (
        <div className="mt-12 p-12 border-2 border-dashed border-paper rounded-[3rem] text-center space-y-4">
          <ImageIcon className="w-12 h-12 mx-auto text-ink/20" />
          <p className="text-xl font-serif italic text-ink/40">Non hai ancora caricato nessun lavoro.</p>
        </div>
      )}

      {/* Category Modal */}
      <AnimatePresence>
        {showCatModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-ink/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-paper flex justify-between items-center">
                <h2 className="text-xl font-serif font-bold">Gestisci Categorie</h2>
                <button onClick={() => setShowCatModal(false)}><X /></button>
              </div>
              <div className="p-6 space-y-6">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input 
                    required
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nome nuova categoria..."
                    className="flex-grow px-4 py-2 bg-paper rounded-xl text-sm focus:ring-2 focus:ring-sage transition-all outline-none"
                  />
                  <button type="submit" className="p-2 bg-sage text-cream rounded-xl hover:bg-ink transition-colors">
                    <PlusCircle className="w-6 h-6" />
                  </button>
                </form>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-paper rounded-xl">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <button 
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id!)}
                        className="p-2 hover:bg-red-50 text-ink/40 hover:text-red-500 rounded-lg transition-all flex items-center justify-center min-w-[32px] min-h-[32px]"
                        title="Elimina categoria"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Work Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-ink/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-paper flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-serif font-bold">
                  {editingWork ? 'Modifica Lavoro' : 'Aggiungi Lavoro'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-paper rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">Titolo</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 bg-paper rounded-xl border-none focus:ring-2 focus:ring-terracotta transition-all outline-none"
                      placeholder="E.g. Sciarpa in lana mohair"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Categoria</label>
                    {categories.length > 0 ? (
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 bg-paper rounded-xl border-none focus:ring-2 focus:ring-terracotta transition-all outline-none"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-100 italic">
                        Devi prima creare almeno una categoria.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Immagine del Lavoro</label>
                    <div className="space-y-4">
                      {formData.imageUrl && (
                        <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-paper">
                          <img 
                            src={formData.imageUrl} 
                            className="w-full h-full object-cover" 
                            alt="Preview" 
                          />
                            <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                              className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-red-500 hover:text-white text-red-500 shadow-lg transition-all flex items-center justify-center"
                              title="Rimuovi immagine"
                            >
                              <Trash2 className="w-5 h-5 pointer-events-none" />
                            </button>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-4">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-paper rounded-2xl cursor-pointer hover:bg-paper/50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                              <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
                            ) : (
                              <>
                                <UploadCloud className="w-8 h-8 text-ink/40 mb-2" />
                                <p className="text-sm text-ink/60">
                                  <span className="font-bold text-terracotta">Clicca per caricare</span> o trascina
                                </p>
                                <p className="text-xs text-ink/40 mt-1">PNG, JPG (max 800KB)</p>
                              </>
                            )}
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                        </label>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-paper" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-ink/40 italic">oppure incolla un URL</span>
                          </div>
                        </div>

                        <input 
                          value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                          onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                          className="w-full px-4 py-3 bg-paper rounded-xl border-none focus:ring-2 focus:ring-terracotta transition-all outline-none text-sm"
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">Descrizione</label>
                    <textarea 
                      required
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-3 bg-paper rounded-xl border-none focus:ring-2 focus:ring-terracotta h-32 resize-none transition-all outline-none"
                      placeholder="Descrivi il materiale, le tecniche usate..."
                    />
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={categories.length === 0 || !formData.imageUrl || isUploading}
                  className="w-full bg-terracotta text-white py-4 rounded-full font-bold hover:bg-ink transition-all shadow-lg shadow-terracotta/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingWork ? 'Salva Modifiche' : 'Pubblica Lavoro'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
