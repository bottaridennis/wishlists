import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Heart, Plus, Loader2, LogIn, Lock, HelpCircle, UserCheck, AlertTriangle } from 'lucide-react';

import { auth, db, handleFirestoreError } from './firebase.ts';
import { WishItem, OperationType } from './types.ts';
import Header from './components/Header.tsx';
import WishlistItemCard from './components/WishlistItemCard.tsx';
import WishlistFormModal from './components/WishlistFormModal.tsx';

const DENNIS_EMAIL = 'dennisbottari@gmail.com';
const ALICE_EMAIL = 'amele5022@gmail.com';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [wishlistItems, setWishlistItems] = useState<WishItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Tab state: 'pipino' or 'pipina'
  const [activeTab, setActiveTab] = useState<'pipino' | 'pipina'>('pipino');

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<WishItem | null>(null);

  // Subscription state
  const [dbError, setDbError] = useState<string | null>(null);

  // 1. Listen to Authentication State
  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      // Auto-set tab based on who logs in for convenience
      if (user) {
        if (user.email === DENNIS_EMAIL) {
          setActiveTab('pipino');
        } else if (user.email === ALICE_EMAIL) {
          setActiveTab('pipina');
        }
      }
    });
    return unsubscribe;
  }, []);

  // Is the current user on their authorized list?
  const isAuthorizedCouple = currentUser && (currentUser.email === DENNIS_EMAIL || currentUser.email === ALICE_EMAIL);
  const isPipino = currentUser?.email === DENNIS_EMAIL;
  const isPipina = currentUser?.email === ALICE_EMAIL;

  // 2. Real-time synchronisation of wish list items
  useEffect(() => {
    if (!isAuthorizedCouple || !db) {
      setWishlistItems([]);
      return;
    }

    setWishlistLoading(true);
    setDbError(null);

    const path = 'wishitems';
    const itemsCollection = collection(db, path);

    const unsubscribe = onSnapshot(
      itemsCollection,
      (snapshot) => {
        const itemsList: WishItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          itemsList.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            price: data.price,
            link: data.link,
            photo: data.photo,
            listId: data.listId,
            listOwner: data.listOwner,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            isReserved: data.isReserved,
            reservedBy: data.reservedBy,
            reservedAt: data.reservedAt,
          } as WishItem);
        });

        // Sort items by creation date descending (newest first)
        itemsList.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

        setWishlistItems(itemsList);
        setWishlistLoading(false);
      },
      (error) => {
        setWishlistLoading(false);
        setDbError('Impossibile caricare i dati in tempo reale. Errore nei permessi.');
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (err) {
          console.error(err);
        }
      }
    );

    return unsubscribe;
  }, [currentUser, isAuthorizedCouple]);

  // Handle Google Login Popup
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection prompt
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Login Error: ', err);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout Error: ', err);
    }
  };

  // Open Add modal
  const openAddModal = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  // Open Edit modal
  const openEditModal = (item: WishItem) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  // Add or Update Wishlist Item
  const handleFormSubmit = async (formData: {
    name: string;
    description: string;
    price: number | string | null;
    link: string;
    photo: string;
  }) => {
    if (!currentUser?.email) return;

    const collectionPath = 'wishitems';
    
    if (itemToEdit) {
      // MODIFICA (Owner only edit)
      const docPath = `${collectionPath}/${itemToEdit.id}`;
      try {
        const itemRef = doc(db, collectionPath, itemToEdit.id);
        await updateDoc(itemRef, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          link: formData.link,
          photo: formData.photo,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, docPath);
      }
    } else {
      // AGGIUNTA
      const customId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const docPath = `${collectionPath}/${customId}`;
      try {
        const itemRef = doc(db, collectionPath, customId);
        
        // Setup who is owner of the list we are currently writing of
        const listOwnerEmail = isPipino ? DENNIS_EMAIL : ALICE_EMAIL;
        const listIdVal = isPipino ? 'pipino' : 'pipina';

        await setDoc(itemRef, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          link: formData.link,
          photo: formData.photo,
          listId: listIdVal,
          listOwner: listOwnerEmail,
          createdBy: currentUser.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isReserved: false,
          reservedBy: null,
          reservedAt: null,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, docPath);
      }
    }
  };

  // Delete Wishlist Item
  const handleDeleteItem = async (item: WishItem) => {
    if (!window.confirm(`Sei sicuro di voler eliminare "${item.name}"?`)) {
      return;
    }

    const docPath = `wishitems/${item.id}`;
    try {
      await deleteDoc(doc(db, 'wishitems', item.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  };

  // Toggle Reservation Status
  const handleToggleReserve = async (item: WishItem) => {
    if (!currentUser?.email) return;

    const docPath = `wishitems/${item.id}`;
    const itemRef = doc(db, 'wishitems', item.id);

    try {
      if (item.isReserved) {
        // Unreserve
        await updateDoc(itemRef, {
          isReserved: false,
          reservedBy: null,
          reservedAt: null,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Reserve
        await updateDoc(itemRef, {
          isReserved: true,
          reservedBy: currentUser.email,
          reservedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  };

  // Categorize elements by tab
  const activeItems = wishlistItems.filter((item) => item.listId === activeTab);

  // Tab counters (overall count on actual lists)
  const countPipino = wishlistItems.filter((i) => i.listId === 'pipino').length;
  const countPipina = wishlistItems.filter((i) => i.listId === 'pipina').length;

  // Check if current tab list belongs to current signed-in user
  const isMyList = activeTab === (isPipino ? 'pipino' : isPipina ? 'pipina' : '');

  // Render State 1: Initialization Error (Missing Firebase Config)
  if (!auth || !db) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6 text-center" id="config-error">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wider mb-2">Configurazione Mancante</h1>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Le credenziali di Firebase non sono state trovate. Se stai usando GitHub Pages, assicurati di aver inserito i Secret (es. VITE_FIREBASE_API_KEY) nelle impostazioni della repository Github (Settings &gt; Secrets and variables &gt; Actions). Applica i Secret e ripeti il Deploy.
        </p>
      </div>
    );
  }

  // Render State 2: Authentication loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" id="auth-loading">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-wider">
          Caricamento in corso...
        </p>
      </div>
    );
  }

  // Render State 2: Unauthenticated / Sign-in View
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6" id="unauth-view">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-4xl w-full justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_30px_rgba(0,0,0,0.02)] p-8 flex flex-col items-center text-center space-y-6"
          >
            {/* Couple avatar bubble */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-100 p-0.5 flex items-center justify-center border border-slate-200 shadow-xs">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl">
                  💝
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-wider uppercase">
                Lista dei Desideri
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Il diario dei regali di Pipino &amp; Pipina
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl w-full text-center">
              <p className="text-xs text-slate-550 leading-relaxed font-sans">
                Questo portale è una stanza digitale per condividere le liste dei regali di <strong>Dennis</strong> &amp; <strong>Alice</strong>. Accedi per iniziare.
              </p>
            </div>

            <button
              type="button"
              id="login-trigger-btn"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-5 bg-slate-900 border border-slate-800 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={14} /> Accedi con Google
            </button>
          </motion.div>

          <div className="hidden lg:block max-w-xs space-y-5">
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">WishList Duo</h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mt-1">Dennis &amp; Alice. In tempo reale.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-slate-800">Accesso Verificato:</span> Solo gli account dennisbottari@ e amele5022@ possono accedere alle liste private.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-slate-800">Sincronizzazione Live:</span> Le modifiche appaiono istantaneamente al proprio partner in tempo reale.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render State 3: Logged-in but Unauthorized Stranger (Access Denied)
  if (!isAuthorizedCouple) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col" id="unauthorized-view">
        <Header user={currentUser} onLogout={handleLogout} />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 flex flex-col items-center justify-center text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 flex flex-col items-center space-y-5"
          >
            <AlertTriangle className="w-14 h-14 text-amber-500 stroke-1" />
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-850 uppercase tracking-wider">
                Accesso Limitato
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-xs mx-auto">
                Ciao <strong>{currentUser.displayName}</strong> ({currentUser.email}), questo spazio privato è esclusivo per Dennis &amp; Alice. 
                Se possiedi uno degli indirizzi Gmail autorizzati, effettua il logout e accedi con l'account corretto.
              </p>
            </div>
            <button
              type="button"
              id="unauthorized-signout-btn"
              onClick={handleLogout}
              className="py-2.5 px-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:transform active:scale-95 cursor-pointer"
            >
              Usa un altro account
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // Render State 4: Fully Authorized Couple Portal
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" id="couple-portal">
      {/* Header with auth indicators */}
      <Header user={currentUser} onLogout={handleLogout} />

      {/* Grid container arranging view left / side context panel right on Desktop */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main List Workspace */}
          <main className="lg:col-span-8 flex flex-col space-y-6">
            
            {/* Sub-header greetings card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white border border-slate-100 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-850 tracking-wider uppercase flex items-center gap-1.5">
                  <span>Ciao</span>
                  <span className="text-indigo-650">{isPipino ? 'Dennis!' : 'Alice!'}</span>
                  <span>{isPipino ? '🧔‍♂️' : '👩‍🦰'}</span>
                </h2>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  Metti i tuoi desideri e visualizza la lista del partner.
                </p>
              </div>

              {/* If looking at your list: Allow adding an item */}
              {isMyList && (
                <button
                  type="button"
                  id="add-gift-trigger"
                  onClick={openAddModal}
                  className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-indigo-650 hover:border-indigo-650 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus size={14} /> Aggiungi Regalo
                </button>
              )}
            </div>

            {/* Database access/permission notification */}
            {dbError && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-sans" id="db-error">
                {dbError}
              </div>
            )}

            {/* Tabs Control - Customized Mobile First Sliders (matching Clean Minimalism mockup style) */}
            <div className="bg-slate-100 p-1 border border-slate-200/50 rounded-xl gap-1 grid grid-cols-2 text-center" id="list-tabs">
              {/* Tab 1: Pipino (Dennis) List */}
              <button
                type="button"
                id="tab-pipino"
                onClick={() => setActiveTab('pipino')}
                className={`py-2 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'pipino'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>🧔‍♂️ Lista Pipino</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'pipino' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-200/50 text-slate-500 font-medium'
                }`}>
                  {countPipino}
                </span>
              </button>

              {/* Tab 2: Pipina (Alice) List */}
              <button
                type="button"
                id="tab-pipina"
                onClick={() => setActiveTab('pipina')}
                className={`py-2 rounded-lg text-xs font-bold transition-all relative flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'pipina'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>👩‍🦰 Lista Pipina</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'pipina' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'bg-slate-200/50 text-slate-500 font-medium'
                }`}>
                  {countPipina}
                </span>
              </button>
            </div>

            {/* List Contents Grid */}
            {wishlistLoading ? (
              <div className="py-20 flex flex-col items-center justify-center" id="list-loading">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-405 mt-3">Caricamento in corso...</p>
              </div>
            ) : activeItems.length > 0 ? (
              // Staggered list grid for items
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                id="wishlist-grid"
              >
                <AnimatePresence mode="popLayout">
                  {activeItems.map((item) => (
                    <WishlistItemCard
                      key={item.id}
                      item={item}
                      currentUserEmail={currentUser.email!}
                      onEdit={openEditModal}
                      onDelete={handleDeleteItem}
                      onToggleReserve={handleToggleReserve}
                      isOwnerOfList={isMyList}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              // Empty State Layout
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[24px] border border-dashed border-slate-200 py-16 px-6 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto w-full"
                id="wishlist-empty-state"
              >
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-indigo-600 mb-1">
                  💝
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                    Ancora nessun desiderio
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-xs mx-auto">
                    {isMyList
                      ? 'La tua lista dei desideri è vuota! Clicca su "Aggiungi Regalo" per aggiungere la tua prima idea regalo.'
                      : `Il tuo partner non ha ancora inserito nessun regalo in questa lista. Chiedigli di farlo!`}
                  </p>
                </div>
                {isMyList && (
                  <button
                    type="button"
                    id="empty-list-add-btn"
                    onClick={openAddModal}
                    className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-indigo-650 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Aggiungi il primo regalo
                  </button>
                )}
              </motion.div>
            )}
          </main>

          {/* Right Aesthetic Info Dashboard Panel (Matches the provided mockup layout meticulously) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">WishList Duo</h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider block mt-1">Dennis &amp; Alice. In tempo reale.</p>
            </div>
            
            <div className="space-y-4 border-t border-slate-100 pt-5">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-slate-800">Accesso Verificato:</span> Solo gli account dennisbottari@ e amele5022@ possono accedere alle liste private.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                <p className="text-xs text-slate-600 leading-relaxed"><span className="font-bold text-slate-800">Sincronizzazione Live:</span> Le modifiche appaiono istantaneamente ad Alice (Pipina) e Dennis (Pipino).</p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Sistema</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-xs font-bold text-slate-700">Connessione sicura attiva</p>
              </div>
              <p className="text-[11px] text-slate-500">
                L'applicazione è collegata a Firestore Cloud Database.
              </p>
            </div>
          </aside>

        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      <WishlistFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        itemToEdit={itemToEdit}
      />
    </div>
  );
}

