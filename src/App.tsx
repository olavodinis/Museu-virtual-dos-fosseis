import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth, googleProvider, PRELOADED_EXHIBITS, handleFirestoreError, OperationType } from './firebase';
import { FossilExhibit } from './types';
import MuseumAtrium from './components/MuseumAtrium';
import FossilDetailView from './components/FossilDetailView';
import AddFossilModal from './components/AddFossilModal';
import { Sparkles, Loader2, Landmark } from 'lucide-react';

export default function App() {
  const [exhibits, setExhibits] = useState<FossilExhibit[]>([]);
  const [selectedExhibit, setSelectedExhibit] = useState<FossilExhibit | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Authenticated user state
  const [user, setUser] = useState<{ uid: string; displayName: string | null; photoURL: string | null } | null>(null);

  // Liked items tracking (using localStorage to prevent duplicate votes)
  const [likedExhibits, setLikedExhibits] = useState<string[]>([]);

  // Track Firestore online vs offline/local mode
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  // 1. Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Estudante Investigador',
          photoURL: firebaseUser.photoURL,
        });
      } else {
        // Check if there is a guest session in localStorage
        const storedGuest = localStorage.getItem('museum_guest_username');
        const storedGuestUid = localStorage.getItem('museum_guest_uid');
        if (storedGuest && storedGuestUid) {
          setUser({
            uid: storedGuestUid,
            displayName: storedGuest,
            photoURL: null,
          });
        } else {
          setUser(null);
        }
      }
    });

    // Load liked exhibits list
    const storedLikes = localStorage.getItem('museum_liked_ids');
    if (storedLikes) {
      setLikedExhibits(JSON.parse(storedLikes));
    }

    return () => unsubscribe();
  }, []);

  // 2. Fetch and Sync Exhibits
  useEffect(() => {
    const exhibitsCollectionPath = 'exhibits';
    let unsubscribe: () => void = () => {};

    try {
      unsubscribe = onSnapshot(
        collection(db, exhibitsCollectionPath),
        (snapshot) => {
          if (snapshot.empty) {
            // Seed the database with our preset exhibits if empty
            PRELOADED_EXHIBITS.forEach(async (ex) => {
              try {
                await setDoc(doc(db, exhibitsCollectionPath, ex.id), ex);
              } catch (e) {
                console.warn('Falha ao semear espécime no Firestore:', e);
              }
            });
            setExhibits(PRELOADED_EXHIBITS as FossilExhibit[]);
          } else {
            const list: FossilExhibit[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as FossilExhibit);
            });
            setExhibits(list);
          }
          setIsOfflineMode(false);
          setLoading(false);
        },
        (error) => {
          console.warn('Ligar ao Firestore falhou (usar persistência local):', error);
          setIsOfflineMode(true);
          loadLocalExhibits();
        }
      );
    } catch (err) {
      console.warn('Erro ao inicializar o listener do Firestore:', err);
      setIsOfflineMode(true);
      loadLocalExhibits();
    }

    return () => unsubscribe();
  }, []);

  // Helper: Read / Seed local exhibits if offline
  const loadLocalExhibits = () => {
    const stored = localStorage.getItem('museum_local_exhibits');
    if (stored) {
      setExhibits(JSON.parse(stored));
    } else {
      setExhibits(PRELOADED_EXHIBITS as FossilExhibit[]);
      localStorage.setItem('museum_local_exhibits', JSON.stringify(PRELOADED_EXHIBITS));
    }
    setLoading(false);
  };

  // 3. User Authentication handlers
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Clear any previous guest session
        localStorage.removeItem('museum_guest_username');
        localStorage.removeItem('museum_guest_uid');
      }
    } catch (error) {
      console.error('Erro ao iniciar sessão com Google:', error);
      alert('Não foi possível entrar com a conta Google. Tente entrar como Turma (Visitante).');
    }
  };

  const handleGuestSignIn = (username: string) => {
    const uid = 'guest-' + Math.random().toString(36).substring(2, 11);
    localStorage.setItem('museum_guest_username', username);
    localStorage.setItem('museum_guest_uid', uid);
    setUser({
      uid,
      displayName: username,
      photoURL: null,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('museum_guest_username');
    localStorage.removeItem('museum_guest_uid');
    setUser(null);
  };

  // 4. Save New Exhibit (Student Group Upload)
  const handleSaveExhibit = async (newExhibitData: Omit<FossilExhibit, 'id' | 'likesCount' | 'createdBy' | 'createdAt'>) => {
    const docId = 'exhibit-' + Math.random().toString(36).substring(2, 11);
    const curatorId = user ? user.uid : 'anonymous';
    const curatorName = user ? user.displayName : 'Visitante Anónimo';

    const fullExhibit: FossilExhibit = {
      id: docId,
      ...newExhibitData,
      likesCount: 0,
      createdBy: curatorId,
      createdAt: new Date().toISOString(),
    };

    if (isOfflineMode) {
      // Save locally
      const updatedList = [fullExhibit, ...exhibits];
      setExhibits(updatedList);
      localStorage.setItem('museum_local_exhibits', JSON.stringify(updatedList));
      setShowAddModal(false);
    } else {
      // Save to Firebase
      try {
        await setDoc(doc(db, 'exhibits', docId), fullExhibit);
        setShowAddModal(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `exhibits/${docId}`);
      }
    }
  };

  // 5. Like Fossil Exhibit Interaction
  const handleLikeExhibit = async (exhibitId: string) => {
    // Determine toggle
    const isAlreadyLiked = likedExhibits.includes(exhibitId);
    let updatedLikes = [...likedExhibits];
    let diff = 1;

    if (isAlreadyLiked) {
      updatedLikes = updatedLikes.filter(id => id !== exhibitId);
      diff = -1;
    } else {
      updatedLikes.push(exhibitId);
    }

    setLikedExhibits(updatedLikes);
    localStorage.setItem('museum_liked_ids', JSON.stringify(updatedLikes));

    // Update in UI immediately for snappy interface
    setExhibits(prev =>
      prev.map(ex => (ex.id === exhibitId ? { ...ex, likesCount: Math.max(0, ex.likesCount + diff) } : ex))
    );
    if (selectedExhibit && selectedExhibit.id === exhibitId) {
      setSelectedExhibit(prev => prev ? { ...prev, likesCount: Math.max(0, prev.likesCount + diff) } : null);
    }

    // Persist Like count
    if (isOfflineMode) {
      const stored = localStorage.getItem('museum_local_exhibits');
      if (stored) {
        const list: FossilExhibit[] = JSON.parse(stored);
        const updated = list.map(ex => (ex.id === exhibitId ? { ...ex, likesCount: Math.max(0, ex.likesCount + diff) } : ex));
        localStorage.setItem('museum_local_exhibits', JSON.stringify(updated));
      }
    } else {
      try {
        const docRef = doc(db, 'exhibits', exhibitId);
        await updateDoc(docRef, {
          likesCount: increment(diff)
        });
      } catch (error) {
        console.warn('Erro ao atualizar gostos no Firestore:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1110] text-[#E5E7EB] flex flex-col font-sans" id="app-container">
      
      {/* Dynamic Museum Top Navigation Rail */}
      <header className="px-6 md:px-10 pt-6 pb-5 border-b border-[#C2A26E]/20 bg-[#0F1110]/95 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between" id="app-header">
        <div className="flex flex-col cursor-pointer" onClick={() => setSelectedExhibit(null)}>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C2A26E] font-semibold">Exposição interativa</span>
          <h1 className="text-2xl md:text-3xl font-serif italic text-white tracking-tight flex items-center gap-2">
            Panteão Geológico <span className="not-italic text-[10px] font-mono font-normal tracking-widest text-[#C2A26E] border border-[#C2A26E]/30 px-2 py-0.5 rounded bg-[#C2A26E]/5 uppercase">Fósseis 3D</span>
          </h1>
        </div>

        {/* Global Connection Status Pill */}
        <div className="flex items-center gap-2">
          {isOfflineMode ? (
            <span className="px-3 py-1 bg-amber-950/20 border border-amber-800/40 text-[10px] font-mono text-amber-400 rounded-full tracking-wider">
              • MODO LOCAL
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#C2A26E]/10 border border-[#C2A26E]/30 text-[10px] font-mono text-[#C2A26E] rounded-full tracking-wider">
              • MUSEU CONECTADO
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4" id="app-loading-spinner">
            <Loader2 className="w-8 h-8 text-[#C2A26E] animate-spin" />
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">A abrir as portas do panteão paleontológico...</p>
          </div>
        ) : selectedExhibit ? (
          /* Fossil Detailed Presentation View */
          <FossilDetailView
            fossil={selectedExhibit}
            onBack={() => setSelectedExhibit(null)}
            onLike={handleLikeExhibit}
            isLikedByUser={likedExhibits.includes(selectedExhibit.id)}
          />
        ) : (
          /* Museum Atrium Lobby */
          <MuseumAtrium
            exhibits={exhibits}
            onSelectExhibit={setSelectedExhibit}
            onOpenAddModal={() => {
              if (!user) {
                alert('Por favor, identifique-se na caixa de curador (como Turma ou Google) para poder publicar o seu trabalho escolar!');
              } else {
                setShowAddModal(true);
              }
            }}
            onGoogleSignIn={handleGoogleSignIn}
            onGuestSignIn={handleGuestSignIn}
            onSignOut={handleSignOut}
            user={user}
          />
        )}
      </main>

      {/* 5. ADD EXHIBIT WORK MODAL */}
      {showAddModal && (
        <AddFossilModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveExhibit}
          userId={user?.uid || 'anonymous'}
        />
      )}

      {/* Visual Footer Decor */}
      <footer className="h-16 bg-[#090a0a] flex items-center px-6 md:px-10 border-t border-[#C2A26E]/10 text-xs text-slate-500 justify-between mt-auto" id="app-footer">
        <div className="flex gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C2A26E]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#C2A26E]/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#C2A26E]/10"></div>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#C2A26E] font-mono text-right">
          Plataforma virtual de Paleontologia - 2026
        </span>
      </footer>

    </div>
  );
}
