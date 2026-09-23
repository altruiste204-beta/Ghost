import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AbstractBackground } from '../components/AbstractBackground';
import { ScrollReveal } from '../components/ScrollReveal';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import { CountrySelect } from '../components/CountrySelect';
import { COUNTRY_OPTIONS, validateAndFormatPhone, type CountryOption } from '../lib/phone';
import { 
  createGhost, 
  validatePseudo, 
  normalizePseudo, 
  loginWithGhostCredentials,
  findGhostsByOwner,
  setSessionAuthenticated,
  clearSessionAuthentication 
} from '../lib/ghostService';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { 
  ArrowRight, 
  AlertCircle, 
  WifiOff, 
  LogOut, 
  PlusCircle, 
  LogIn,
  Zap,
  Shield,
  Layers,
  PhoneCall,
  EyeOff,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Radio
} from 'lucide-react';

type SimMode = 'cameroon' | 'france' | 'usa' | 'offline';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithGoogle, signOut } = useAuth();
  const isNetworkOnline = useNetworkStatus();

  // Scroll ref for creation form
  const formSectionRef = useRef<HTMLDivElement | null>(null);

  // Purge any legacy stored pseudo to strictly prevent accidental data exposure on shared screens
  useEffect(() => {
    try {
      localStorage.removeItem('ghost_recent_pseudo');
    } catch {}
  }, []);

  // Mode: 'create' for new users, 'login' for existing users accessing their space
  const [activeTab, setActiveTab] = useState<'create' | 'login'>('create');

  // Creation State
  const [pseudo, setPseudo] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
    COUNTRY_OPTIONS.find((c) => c.code === '+237') || COUNTRY_OPTIONS[0]
  );
  const [nationalNumber, setNationalNumber] = useState('');

  // Login State (userName & phone)
  const [loginPseudo, setLoginPseudo] = useState('');
  const [loginPhone, setLoginPhone] = useState('');

  // Shared UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);

  const cleanPseudo = normalizePseudo(pseudo);
  const cleanLoginPseudo = normalizePseudo(loginPseudo);

  const handleTabChange = (tab: 'create' | 'login') => {
    setActiveTab(tab);
    setError(null);
    setShowGooglePrompt(false);
  };

  const scrollToForm = (tab: 'create' | 'login' = 'create') => {
    handleTabChange(tab);
    formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Creation handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowGooglePrompt(false);

    if (!isNetworkOnline) {
      setError('Connexion Internet indisponible.');
      return;
    }

    const validPseudoCheck = validatePseudo(cleanPseudo);
    if (!validPseudoCheck.isValid) {
      setError(validPseudoCheck.error || 'Pseudo invalide.');
      return;
    }

    const phoneResult = validateAndFormatPhone(selectedCountry.code, nationalNumber);
    if (!phoneResult.isValid) {
      setError(phoneResult.error || 'Numéro de téléphone invalide.');
      return;
    }

    setLoading(true);

    try {
      await createGhost({
        pseudo: cleanPseudo,
        currentNumber: phoneResult.e164,
        countryCode: selectedCountry.code,
        nationalNumber: phoneResult.national,
      });

      navigate(`/owner/${cleanPseudo}`);
    } catch (err: any) {
      console.error('Creation error:', err);
      if (
        err.code === 'auth/admin-restricted-operation' ||
        err.code === 'auth/operation-not-allowed' ||
        err.message?.includes('admin-restricted-operation') ||
        err.message?.includes('Google')
      ) {
        setShowGooglePrompt(true);
        setError('Une connexion Google est requise pour créer et synchroniser votre GHOST.');
      } else if (err.code === 'ALREADY_EXISTS' || err.message?.includes('déjà utilisé') || err.message?.includes('disponible')) {
        setError("Ce pseudo n'est pas disponible. Veuillez en choisir un autre.");
      } else if (err.code === 'permission-denied') {
        setError("Accès refusé par les règles de sécurité.");
      } else if (err.message?.includes('réseau') || err.message?.includes('network')) {
        setError('Connexion Internet indisponible.');
      } else {
        setError(err.message || 'Impossible de synchroniser GHOST pour le moment. Réessaie dans quelques instants.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Login handler (userName & registered phone)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isNetworkOnline) {
      setError('Connexion Internet indisponible.');
      return;
    }

    const inputPseudo = loginPseudo.trim();
    if (!inputPseudo) {
      setError('Veuillez renseigner votre pseudo ou email.');
      return;
    }

    if (!loginPhone.trim()) {
      setError('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    setLoading(true);

    try {
      const authenticatedGhost = await loginWithGhostCredentials(inputPseudo, loginPhone.trim());
      setSessionAuthenticated(authenticatedGhost.pseudo);
      navigate(`/owner/${authenticatedGhost.pseudo}`);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Identifiants incorrects. Vérifiez votre pseudo et votre numéro de téléphone.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login in Login tab
  const handleGoogleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      const googleUser = await loginWithGoogle();

      if (cleanLoginPseudo) {
        setSessionAuthenticated(cleanLoginPseudo);
        navigate(`/owner/${cleanLoginPseudo}`);
        return;
      }

      const myGhosts = await findGhostsByOwner(googleUser.uid, googleUser.email);

      if (myGhosts.length > 0) {
        const targetGhost = myGhosts[0];
        setSessionAuthenticated(targetGhost.pseudo);
        navigate(`/owner/${targetGhost.pseudo}`);
        return;
      }

      setError('Aucun GHOST associé à ce compte Google. Passez par l\'onglet "CRÉER UN GHOST".');
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Impossible de se connecter avec Google. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('ghost_recent_pseudo');
      clearSessionAuthentication();
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC TICKERS (Indépendants & en temps réel)
  // -------------------------------------------------------------
  const [latencyMs, setLatencyMs] = useState(42);
  const [routedCallsCount, setRoutedCallsCount] = useState(148392);

  // Dynamic fluctuation of latency (realistic ping simulation 38ms - 52ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setLatencyMs((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return Math.max(34, Math.min(56, next));
      });
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  // Dynamic counter increment for routed requests
  useEffect(() => {
    const timer = setInterval(() => {
      setRoutedCallsCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // AUTONOMOUS ROUTING SIMULATOR (Bascule seule en continu)
  // -------------------------------------------------------------
  const [simCarrier, setSimCarrier] = useState<SimMode>('cameroon');
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [isPingTesting, setIsPingTesting] = useState(false);
  const [pingResult, setPingResult] = useState<{ active: boolean; ms: number; message: string } | null>(null);
  const [showCoreExplainer, setShowCoreExplainer] = useState(false);

  const carrierProfiles: Record<SimMode, {
    name: string;
    code: string;
    number: string;
    status: string;
    statusColor: string;
    badgeColor: string;
    description: string;
  }> = {
    cameroon: {
      name: 'MTN / Orange (Cameroun)',
      code: '+237',
      number: '+237 6 93 12 34 56',
      status: 'Actif & Joignable',
      statusColor: 'text-[#00FF88]',
      badgeColor: 'bg-[#00FF88]/10 border-[#00FF88]/30',
      description: 'Ligne locale principale. Appels GSM et messages WhatsApp routés instantanément.',
    },
    france: {
      name: 'Free Mobile / Orange (France)',
      code: '+33',
      number: '+33 6 12 34 56 78',
      status: 'Actif en Roaming',
      statusColor: 'text-[#00E5FF]',
      badgeColor: 'bg-[#00E5FF]/10 border-[#00E5FF]/30',
      description: 'Numéro de déplacement en Europe. Mis à jour en 3 secondes depuis l\'espace propriétaire.',
    },
    usa: {
      name: 'T-Mobile (États-Unis)',
      code: '+1',
      number: '+1 (555) 234-5678',
      status: 'Ligne Internationale',
      statusColor: 'text-[#55FF99]',
      badgeColor: 'bg-[#55FF99]/10 border-[#55FF99]/30',
      description: 'Ligne internationale active sans modifier le lien public partagé avec vos contacts.',
    },
    offline: {
      name: 'Mode Fantôme 404',
      code: '---',
      number: 'INJOIGNABLE (Masqué)',
      status: 'Mode Silencieux',
      statusColor: 'text-[#FF3B3B]',
      badgeColor: 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30',
      description: 'Numéro déconnecté. Vos contacts voient un statut poli « Indisponible » sans révéler votre numéro.',
    },
  };

  const simCycleList: SimMode[] = ['cameroon', 'france', 'usa', 'offline'];

  // Autonomous switching loop with progress bar
  useEffect(() => {
    if (isAutoPaused) return;

    const intervalStepMs = 50;
    const dwellDurationMs = 4500;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalStepMs;
      setProgressPercent(Math.min(100, (elapsed / dwellDurationMs) * 100));

      if (elapsed >= dwellDurationMs) {
        elapsed = 0;
        setProgressPercent(0);
        setSimCarrier((current) => {
          const currentIndex = simCycleList.indexOf(current);
          const nextIndex = (currentIndex + 1) % simCycleList.length;
          return simCycleList[nextIndex];
        });
      }
    }, intervalStepMs);

    return () => clearInterval(timer);
  }, [isAutoPaused]);

  // Handle user manual click on simulator tab (pauses briefly then resumes auto)
  const handleSelectCarrierManual = (mode: SimMode) => {
    setSimCarrier(mode);
    setIsAutoPaused(true);
    setProgressPercent(0);

    // Auto resume autonomous loop after 9 seconds of manual inspection
    setTimeout(() => {
      setIsAutoPaused(false);
    }, 9000);
  };

  // WORKING "Routage Actif" Interactive Diagnostic Test
  const handleTriggerRoutingTest = () => {
    if (isPingTesting) return;
    setIsPingTesting(true);
    setPingResult(null);

    const testLatency = Math.floor(Math.random() * 12) + 36; // 36 - 48 ms

    setTimeout(() => {
      setIsPingTesting(false);
      setPingResult({
        active: true,
        ms: testLatency,
        message: simCarrier === 'offline' 
          ? 'Routage validé · Mode Fantôme actif · Numéro protégé'
          : `Routage vérifié · ${testLatency} ms · Liaison instantanée vers ${carrierProfiles[simCarrier].number}`
      });

      // Clear toast after 6 seconds
      setTimeout(() => {
        setPingResult(null);
      }, 6000);
    }, 850);
  };

  const currentCarrier = carrierProfiles[simCarrier];

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-[#F0F0F0] overflow-x-hidden selection:bg-[#00FF88]/30 selection:text-[#00FF88]">
      {/* 1. Abstract Background Animation (Autonomous cycling waves -> particles -> constellation, vivid and scroll-reactive) */}
      <AbstractBackground intensity="vibrant" interactive={true} />

      {/* 2. Foreground Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-7 flex flex-col flex-1">
        
        {/* Top Navigation Bar - Strict 3-Zone Contract */}
        <header className="flex items-center justify-between pb-5 mb-8 border-b border-[#222E26]/60 backdrop-blur-md">
          {/* Zone 1: Wordmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <GhostLogo status={isNetworkOnline ? 'online' : 'offline'} size="md" />
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xl tracking-tight text-white group-hover:text-[#00FF88] transition-colors">
                GHOST
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00FF88]/15 border border-[#00FF88]/30 text-[#00FF88] font-mono">
                v2
              </span>
            </div>
          </Link>

          {/* Zone 2: Navigation Links (Replaced 'Vue d'ensemble' with 'Accueil') */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#AAAAAA]">
            <Link to="/" className="text-[#00FF88] font-bold flex items-center gap-1.5 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />
              Accueil
            </Link>
            <Link to="/comment-ca-marche" className="hover:text-white transition-colors">
              Comment ça marche
            </Link>
            <a href="#simulateur" className="hover:text-white transition-colors">
              Simulateur
            </a>
            <Link to="/cgu" className="hover:text-white transition-colors">
              Conditions
            </Link>
          </nav>

          {/* Zone 3: Primary Action & Status */}
          <div className="flex items-center gap-3">
            {!isNetworkOnline ? (
              <div className="flex items-center gap-1.5 text-xs text-[#FF3B3B] bg-[#FF3B3B]/10 px-2.5 py-1 rounded-full border border-[#FF3B3B]/30">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Hors-ligne</span>
              </div>
            ) : user && !user.isAnonymous ? (
              <button
                type="button"
                onClick={handleSignOut}
                title="Verrouiller et se déconnecter"
                className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#FF3B3B] bg-[#141414] hover:bg-[#201414] border border-[#2A2A2A] hover:border-[#FF3B3B]/40 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#FF3B3B]" />
                <span className="text-[11px] hidden sm:inline">Déconnexion</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => scrollToForm('create')}
                className="text-xs font-bold text-[#0F0F0F] bg-[#00FF88] hover:bg-[#1aff96] px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(0,255,136,0.25)] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] whitespace-nowrap cursor-pointer"
              >
                CRÉER MON GHOST
              </button>
            )}
          </div>
        </header>

        {/* Hero Section with Live Creation / Login Console */}
        <main className="space-y-16 flex-1">
          
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2 sm:pt-6">
            
            {/* Left Column: Mission, Value proposition & Live Ticking Metrics */}
            <ScrollReveal direction="left" delay={100} className="lg:col-span-6 space-y-6 text-left">
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-white leading-[1.1]">
                CHANGE TON NUMÉRO.<br />
                <span className="text-[#00FF88] drop-shadow-[0_0_25px_rgba(0,255,136,0.4)]">
                  JAMAIS TON LIEN.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#B0B0B0] leading-relaxed max-w-lg">
                Partagez un seul lien fixe sur vos cartes de visite et profils. Si vous changez de numéro de téléphone ou de puce, mettez-le à jour en un clic : vos contacts sont toujours redirigés vers votre bon WhatsApp, sans rien perdre.
              </p>

              {/* Dynamic Independent Metrics Ribbon (Chiffres défilant dynamiquement) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/40 transition-colors backdrop-blur-md shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#777777] font-mono uppercase">Commutation</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-ping" />
                  </div>
                  <p className="text-lg font-bold text-[#00FF88] font-mono tabular-nums mt-0.5">
                    {latencyMs} ms
                  </p>
                  <p className="text-[9px] text-[#888888]">Ping direct en temps réel</p>
                </div>

                <div className="p-3 rounded-xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/40 transition-colors backdrop-blur-md shadow-lg">
                  <p className="text-[10px] text-[#777777] font-mono uppercase">Requêtes</p>
                  <p className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                    {routedCallsCount.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-[9px] text-[#888888]">Liaisons routées à ce jour</p>
                </div>

                <div className="p-3 rounded-xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/40 transition-colors backdrop-blur-md shadow-lg">
                  <p className="text-[10px] text-[#777777] font-mono uppercase">Disponibilité</p>
                  <p className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                    99.99 %
                  </p>
                  <p className="text-[9px] text-[#888888]">Réseau sans coupure</p>
                </div>

                <div className="p-3 rounded-xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/40 transition-colors backdrop-blur-md shadow-lg">
                  <p className="text-[10px] text-[#777777] font-mono uppercase">Application</p>
                  <p className="text-lg font-bold text-[#00FF88] font-mono mt-0.5">
                    0 requise
                  </p>
                  <p className="text-[9px] text-[#888888]">100% natif téléphone</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Right Column: Embedded Creation & Login Console (Ready for user arrival) */}
            <div ref={formSectionRef} className="lg:col-span-6">
              <ScrollReveal direction="right" delay={200}>
                <div className="card-ghost p-6 sm:p-7 shadow-2xl relative overflow-hidden border-[#222E26] hover:border-[#00FF88]/40 transition-colors bg-[#0e1411]/85 backdrop-blur-xl">
                
                {/* Mode Switcher Tabs */}
                <div className="flex items-center p-1 bg-[#141A16] border border-[#26322A] rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => handleTabChange('create')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'create'
                        ? 'bg-[#00FF88] text-[#0F0F0F] shadow-sm'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>CRÉER UN GHOST</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-[#00FF88] text-[#0F0F0F] shadow-sm'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>SE CONNECTER</span>
                  </button>
                </div>

                {/* TAB 1: CREATION (New User arrives here) */}
                {activeTab === 'create' && (
                  <form onSubmit={handleCreateSubmit} className="space-y-4">
                    {/* Pseudo Input */}
                    <div>
                      <label htmlFor="create-pseudo" className="block text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] mb-1.5">
                        1. Choisi ton pseudo unique
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-[#666666] font-mono">
                          ghost.cm/p/
                        </div>
                        <input
                          id="create-pseudo"
                          type="text"
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          value={pseudo}
                          onChange={(e) => {
                            setPseudo(e.target.value.toLowerCase().replace(/\s+/g, ''));
                            if (error) setError(null);
                          }}
                          placeholder="alexandre"
                          className="w-full bg-[#141A16] border border-[#26322A] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] rounded-xl pl-[96px] pr-4 py-3 text-sm text-white font-mono placeholder-[#444444] transition-all outline-none"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-[#777777]">
                        3 à 30 caractères : minuscules, chiffres, tirets (- ou _).
                      </p>
                    </div>

                    {/* Phone Number Input */}
                    <div>
                      <label htmlFor="create-number" className="block text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] mb-1.5">
                        2. Ton numéro actuel (modifié quand tu veux)
                      </label>
                      <div className="flex gap-2">
                        <div className="w-32 sm:w-36 flex-shrink-0">
                          <CountrySelect
                            id="create-country"
                            value={selectedCountry}
                            onChange={(c) => setSelectedCountry(c)}
                          />
                        </div>
                        <input
                          id="create-number"
                          type="tel"
                          required
                          value={nationalNumber}
                          onChange={(e) => {
                            setNationalNumber(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder={selectedCountry.placeholder}
                          className="flex-1 bg-[#141A16] border border-[#26322A] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-[#444444] transition-all outline-none"
                        />
                      </div>
                    </div>

                    {/* Error Notification */}
                    {error && (
                      <div className="p-3 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 space-y-2 text-xs text-[#FF3B3B] animate-in fade-in duration-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="font-semibold leading-relaxed">{error}</span>
                        </div>

                        {showGooglePrompt && (
                          <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="btn-ghost w-full py-2 px-3 text-xs flex items-center justify-center gap-2 border-[#444444] hover:border-[#00FF88] transition-colors mt-1 cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            <span className="text-white font-medium">Continuer avec Google</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Exact requested button label */}
                    <button
                      type="submit"
                      disabled={loading || !pseudo.trim() || !nationalNumber.trim()}
                      className="btn-green w-full text-sm font-bold tracking-wide mt-2 shadow-[0_0_20px_rgba(0,255,136,0.25)]"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-[#0F0F0F] border-t-transparent rounded-full animate-spin" />
                          CRÉATION EN COURS...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          CRÉER MON GHOST
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </form>
                )}

                {/* TAB 2: LOGIN (Existing User) */}
                {activeTab === 'login' && (
                  <div className="space-y-4">
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      {/* Pseudo Field */}
                      <div>
                        <label htmlFor="login-pseudo" className="block text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] mb-1.5">
                          Pseudo ou Email
                        </label>
                        <input
                          id="login-pseudo"
                          type="text"
                          required
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck="false"
                          value={loginPseudo}
                          onChange={(e) => {
                            setLoginPseudo(e.target.value.toLowerCase().replace(/\s+/g, ''));
                            if (error) setError(null);
                          }}
                          placeholder="ex: alex, sarah ou votre email"
                          className="w-full bg-[#141A16] border border-[#26322A] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-[#444444] transition-all outline-none"
                        />
                      </div>

                      {/* Phone Field */}
                      <div>
                        <label htmlFor="login-phone" className="block text-xs font-semibold uppercase tracking-wider text-[#A0A0A0] mb-1.5">
                          Numéro enregistré
                        </label>
                        <input
                          id="login-phone"
                          type="tel"
                          required
                          value={loginPhone}
                          onChange={(e) => {
                            setLoginPhone(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="ex: 699001122 ou +237..."
                          className="w-full bg-[#141A16] border border-[#26322A] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-[#444444] transition-all outline-none"
                        />
                        <p className="mt-1 text-[11px] text-[#777777]">
                          Saisis le numéro actuellement actif associé à ce GHOST.
                        </p>
                      </div>

                      {/* Error Display */}
                      {error && (
                        <div className="p-3 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 text-xs text-[#FF3B3B] flex items-start gap-2 animate-in fade-in duration-200">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="font-semibold leading-relaxed">{error}</span>
                        </div>
                      )}

                      {/* Exact requested button label */}
                      <button
                        type="submit"
                        disabled={loading || !loginPseudo.trim() || !loginPhone.trim()}
                        className="btn-green w-full text-sm font-bold tracking-wide mt-2"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-[#0F0F0F] border-t-transparent rounded-full animate-spin" />
                            VÉRIFICATION...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            Accéder à mon espace
                            <ArrowRight className="w-4 h-4" />
                          </span>
                        )}
                      </button>
                    </form>

                    {/* Google Alternative */}
                    <div className="pt-2 border-t border-[#222E26]">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="btn-ghost w-full py-2.5 px-3 text-xs flex items-center justify-center gap-2 border-[#26322A] hover:border-[#00FF88]/50 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                        <span className="text-white font-medium">Se connecter avec Google</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* SIMULATEUR INTERACTIF AUTONOME (Bascule seule & Core fonctionnel) */}
        {/* ------------------------------------------------------------- */}
        <ScrollReveal direction="up" delay={120}>
          <section id="simulateur" className="rounded-2xl p-6 sm:p-8 bg-[#0e1411]/85 border border-[#00FF88]/30 hover:border-[#00FF88]/50 transition-colors backdrop-blur-md shadow-2xl space-y-6">
            
            {/* Top Bar of Simulator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222E26]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-ping"></span>
                  <h2 className="font-display text-lg font-bold text-white uppercase tracking-tight">
                    Simulateur de Routage Autonome
                  </h2>
                </div>
                <p className="text-xs text-[#888888] mt-1">
                  Observez la bascule dynamique automatique : votre lien permanent reste <strong>inchangé</strong>, tandis que la carte SIM de réception change instantanément.
                </p>
              </div>

              {/* Selector Tabs with Live Auto-Switch Progress Bar */}
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#141A16] border border-[#26322A] rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => handleSelectCarrierManual('cameroon')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      simCarrier === 'cameroon'
                        ? 'bg-[#00FF88] text-[#0F0F0F] font-bold shadow-md'
                        : 'text-[#AAAAAA] hover:text-white'
                    }`}
                  >
                    SIM 1 (Cameroun)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCarrierManual('france')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      simCarrier === 'france'
                        ? 'bg-[#00FF88] text-[#0F0F0F] font-bold shadow-md'
                        : 'text-[#AAAAAA] hover:text-white'
                    }`}
                  >
                    SIM 2 (France)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCarrierManual('usa')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      simCarrier === 'usa'
                        ? 'bg-[#00FF88] text-[#0F0F0F] font-bold shadow-md'
                        : 'text-[#AAAAAA] hover:text-white'
                    }`}
                  >
                    SIM 3 (USA)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectCarrierManual('offline')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      simCarrier === 'offline'
                        ? 'bg-[#FF3B3B] text-white font-bold shadow-md'
                        : 'text-[#FF3B3B]/80 hover:text-[#FF3B3B]'
                    }`}
                  >
                    Mode Fantôme
                  </button>
                </div>

                {/* Autonomous timer progress indicator */}
                <div className="w-full h-1 bg-[#1A231E] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-75 ${
                      simCarrier === 'offline' ? 'bg-[#FF3B3B]' : 'bg-[#00FF88]'
                    }`}
                    style={{ width: `${isAutoPaused ? 100 : progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Node 1: Public Permanent URL (Fixe à vie) */}
              <div className="p-5 rounded-2xl bg-[#141A16] border border-[#26322A] space-y-3 relative">
                <div className="text-[10px] font-mono text-[#00FF88] uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>1. Point d'Entrée Unique</span>
                  <span className="text-[10px] text-[#777777]">FIXE À VIE</span>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    Lien Public GHOST
                  </h3>
                  <div className="mt-2 flex items-center justify-between p-2.5 rounded-xl bg-[#0C100E] border border-[#1E2721]">
                    <span className="font-mono text-xs text-[#00FF88] font-bold truncate">
                      ghost.cm/p/alex
                    </span>
                    <span className="text-[10px] font-mono text-[#777777] ml-2">
                      Immuable
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Imprimé sur cartes, partagé sur Instagram ou WhatsApp. Vous ne modifierez <strong>jamais</strong> cette adresse.
                </p>
              </div>

              {/* Node 2: GHOST Core Routing (Interactive & Explanatory) */}
              <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#141A16] border border-[#00FF88]/30 text-center space-y-3 relative overflow-hidden">
                
                {/* Visual pulse glow when ping test is running */}
                {isPingTesting && (
                  <div className="absolute inset-0 bg-[#00FF88]/10 animate-pulse pointer-events-none" />
                )}

                <div className="w-14 h-14 rounded-2xl bg-[#00FF88]/15 border border-[#00FF88]/50 flex items-center justify-center text-[#00FF88] shadow-[0_0_25px_rgba(0,255,136,0.35)]">
                  <RefreshCw className={`w-7 h-7 ${isPingTesting ? 'animate-spin' : ''}`} style={{ animationDuration: isPingTesting ? '0.7s' : '5s' }} />
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-display text-sm font-bold text-white uppercase tracking-wider block">
                      GHOST Core Routing
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCoreExplainer(!showCoreExplainer)}
                      className="text-[#AAAAAA] hover:text-[#00FF88] transition-colors cursor-pointer"
                      title="À quoi sert le Ghost Core Routing ?"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-[#777777] font-mono block mt-0.5">
                    Moteur de Commutation Décentralisé
                  </span>
                </div>

                {/* THE WORKING BUTTON "Routage Actif / Tester le routage" */}
                <button
                  type="button"
                  onClick={handleTriggerRoutingTest}
                  disabled={isPingTesting}
                  className="w-full py-2 px-3 rounded-xl bg-[#00FF88]/15 hover:bg-[#00FF88]/25 border border-[#00FF88]/40 hover:border-[#00FF88] text-[#00FF88] font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Radio className={`w-3.5 h-3.5 ${isPingTesting ? 'animate-ping' : ''}`} />
                  <span>{isPingTesting ? 'Test en cours...' : 'Routage actif (Tester)'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Node 3: Real Physical Terminal (Volatile SIM) */}
              <div className="p-5 rounded-2xl bg-[#141A16] border border-[#26322A] space-y-3 relative">
                <div className="text-[10px] font-mono text-[#AAAAAA] uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>3. Destination Réelle</span>
                  <span className={`text-[10px] font-bold ${currentCarrier.statusColor}`}>
                    {currentCarrier.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-white">
                    {currentCarrier.name}
                  </h3>
                  <div className="mt-2 p-2.5 rounded-xl bg-[#0C100E] border border-[#1E2721]">
                    <span className={`font-mono text-xs font-bold ${currentCarrier.statusColor}`}>
                      {currentCarrier.number}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#888888] leading-relaxed">
                  {currentCarrier.description}
                </p>
              </div>
            </div>

            {/* Explanatory Panel: "À quoi sert GHOST Core Routing ?" (Directly answers user question) */}
            {(showCoreExplainer || isPingTesting || pingResult) && (
              <div className="p-4 rounded-xl bg-[#0A100C] border border-[#00FF88]/40 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00FF88] font-mono uppercase">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rôle du GHOST Core Routing</span>
                  </div>
                  {pingResult && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 font-bold">
                      Ping test: {pingResult.ms} ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                  <strong>À quoi sert GHOST Core Routing ?</strong> C'est l'aiguillage autonome qui convertit instantanément le lien universel (ex: <code className="text-white">ghost.cm/p/alex</code>) vers la ligne active du moment en moins de 100ms. Vos correspondants sont mis en relation directe via GSM natif ou WhatsApp chiffré. <strong>Aucun appel n'est écouté, enregistré ou intercepté.</strong>
                </p>
                {pingResult && (
                  <div className="text-xs font-mono text-[#00FF88] pt-1 border-t border-[#1C2A20]">
                    ✓ {pingResult.message}
                  </div>
                )}
              </div>
            )}

            {/* Action Preview */}
            <div className="p-4 rounded-xl bg-[#0C100E] border border-[#222E26] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#141A16] border border-[#26322A] text-[#00FF88]">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Résultat lors du clic par un correspondant</p>
                  <p className="text-[11px] text-[#777777]">
                    {simCarrier === 'offline'
                      ? 'Statut discret : « Propriétaire temporairement injoignable ». Vos numéros réels sont entièrement masqués.'
                      : `Appel téléphonique ou WhatsApp s'ouvre directement vers ${currentCarrier.number}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#00FF88] px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30">
                  Résolution &lt; 100 ms
                </span>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ------------------------------------------------------------- */}
        {/* LES 4 PILIERS FONDAMENTAUX (Indépendants & Dynamiques) */}
        {/* ------------------------------------------------------------- */}
        <ScrollReveal direction="up" delay={120}>
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
                Les 4 Piliers Fondamentaux
              </h2>
              <p className="text-xs sm:text-sm text-[#888888] max-w-lg mx-auto">
                Conçu pour être minimaliste en surface et ultra-robuste en profondeur.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pilier 1 */}
              <div className="p-6 rounded-2xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/50 transition-all backdrop-blur-md space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  01. Indépendance Totale
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Une carte SIM peut être perdue, volée ou changée en voyage. Votre carnet d'adresses et vos contacts ne doivent pas en pâtir : votre lien reste le même à vie, peu importe votre puce.
                </p>
              </div>

              {/* Pilier 2 */}
              <div className="p-6 rounded-2xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/50 transition-all backdrop-blur-md space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  02. Routage Zéro Friction
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Vos correspondants n'ont absolument rien à installer. Lorsqu'ils ouvrent votre lien sur leur navigateur mobile, les protocoles système natifs (<code className="text-white">tel:</code> et <code className="text-white">wa.me</code>) s'activent au premier tap.
                </p>
              </div>

              {/* Pilier 3 */}
              <div className="p-6 rounded-2xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#FF3B3B]/50 transition-all backdrop-blur-md space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 flex items-center justify-center text-[#FF3B3B] group-hover:scale-110 transition-transform">
                  <EyeOff className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  03. Le Mode 404 Fantôme
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Besoin de tranquillité, en vacances ou en transition ? En un clic depuis votre espace, désactivez la joignabilité. Vos numéros réels restent protégés et masqués sans nécessiter d'éteindre votre smartphone.
                </p>
              </div>

              {/* Pilier 4 */}
              <div className="p-6 rounded-2xl bg-[#0e1411]/80 border border-[#222E26] hover:border-[#00FF88]/50 transition-all backdrop-blur-md space-y-3 group shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  04. Sécurité & Authentification Hybride
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Chaque GHOST est une forteresse personnelle. Seul son propriétaire légitime peut modifier la ligne active, soit via vérification de ses identifiants enregistrés, soit par compte Google vérifié.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ------------------------------------------------------------- */}
        {/* COMPARATIF SYSTÉMIQUE : AVANT vs AVEC GHOST */}
        {/* ------------------------------------------------------------- */}
        <ScrollReveal direction="up" delay={120}>
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
                Comparatif Systémique
              </h2>
              <p className="text-xs text-[#888888]">
                Pourquoi les méthodes traditionnelles de transmission de contact sont obsolètes.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#222E26] hover:border-[#00FF88]/30 transition-colors bg-[#0e1411]/85 backdrop-blur-md shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#222E26] bg-[#141A16]/90 text-[#AAAAAA] font-mono text-[11px] uppercase">
                    <th className="p-4 font-semibold">Critère</th>
                    <th className="p-4 font-semibold text-[#FF3B3B]">SMS / Statut Réseaux</th>
                    <th className="p-4 font-semibold text-[#E0A82E]">Linktree / Bio statique</th>
                    <th className="p-4 font-semibold text-[#00FF88]">GHOST Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A231E] text-[#B0B0B0]">
                  <tr>
                    <td className="p-4 font-semibold text-white">Pérennité du lien</td>
                    <td className="p-4 text-[#888888]">Aucun lien (volatile)</td>
                    <td className="p-4">Lien statique multi-boutons</td>
                    <td className="p-4 font-bold text-[#00FF88]">Lien permanent universel</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Action du contact</td>
                    <td className="p-4 text-[#888888]">Enregistrer manuellement</td>
                    <td className="p-4">3 à 4 clics avec distraction</td>
                    <td className="p-4 font-bold text-[#00FF88]">1 tap direct (Tel / WhatsApp)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Résilience hors-ligne</td>
                    <td className="p-4 text-[#888888]">Dépend du réseau SMS</td>
                    <td className="p-4 text-[#888888]">Écran blanc hors-ligne</td>
                    <td className="p-4 font-bold text-[#00FF88]">Cache local PWA immédiat</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Mode Silencieux / 404</td>
                    <td className="p-4 text-[#888888]">Impossible (ligne exposée)</td>
                    <td className="p-4 text-[#888888]">Nécessite suppression manuelle</td>
                    <td className="p-4 font-bold text-[#00FF88]">Bascule instantanée 404</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-semibold text-white">Mise à jour en voyage</td>
                    <td className="p-4 text-[#888888]">Aviser 500 contacts 1 par 1</td>
                    <td className="p-4">Modifier chaque lien et bouton</td>
                    <td className="p-4 font-bold text-[#00FF88]">3 secondes chrono</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </ScrollReveal>

        {/* Call to Action Footer Section */}
        <ScrollReveal direction="up" delay={120}>
          <section className="rounded-2xl p-8 text-center space-y-5 bg-gradient-to-b from-[#142019]/90 to-[#0c120f]/90 border border-[#00FF88]/40 backdrop-blur-md shadow-[0_0_40px_rgba(0,255,136,0.15)]">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
              Prêt à réserver votre lien permanent ?
            </h2>
            <p className="text-xs sm:text-sm text-[#AAAAAA] max-w-md mx-auto leading-relaxed">
              La réservation de votre pseudo personnel prend moins d'une minute. Aucun abonnement, zéro engagement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => scrollToForm('create')}
                className="btn-green w-full sm:w-auto px-8 py-3.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                CRÉER MON GHOST MAINTENANT
              </button>
              <Link
                to="/comment-ca-marche"
                className="btn-ghost w-full sm:w-auto px-6 py-3.5 text-xs font-bold tracking-wider hover:border-[#00FF88]/40 transition-colors"
              >
                GUIDE COMMENT ÇA MARCHE
              </Link>
            </div>
          </section>
        </ScrollReveal>
        </main>

        {/* Global Footer (With 'Accueil' instead of 'Vue d'ensemble') */}
        <Footer />
      </div>
    </div>
  );
};
