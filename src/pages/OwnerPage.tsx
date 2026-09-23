import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import { CountrySelect } from '../components/CountrySelect';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  subscribeToGhost, 
  updateGhostNumber, 
  updateGhostStatus, 
  loginWithGhostCredentials,
  isSessionAuthenticated,
  clearSessionAuthentication,
  type GhostData 
} from '../lib/ghostService';
import { 
  COUNTRY_OPTIONS, 
  validateAndFormatPhone, 
  type CountryOption 
} from '../lib/phone';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { 
  Copy, 
  ExternalLink, 
  Check, 
  Power, 
  Smartphone, 
  ShieldCheck, 
  WifiOff, 
  AlertCircle, 
  RefreshCw,
  LogOut,
  Sparkles,
  Link as LinkIcon,
  Lock
} from 'lucide-react';

export const OwnerPage: React.FC = () => {
  const { pseudo } = useParams<{ pseudo: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAnonymous, loginWithGoogle, linkGoogleAccount, signOut } = useAuth();
  const isNetworkOnline = useNetworkStatus();

  const [ghost, setGhost] = useState<GhostData | null>(null);
  const [meta, setMeta] = useState<{ ownerUid?: string; ownerEmail?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Edit number form state
  const [editCountry, setEditCountry] = useState<CountryOption>(
    COUNTRY_OPTIONS.find((c) => c.code === '+237') || COUNTRY_OPTIONS[0]
  );
  const [editNationalNumber, setEditNationalNumber] = useState('');
  const [isUpdatingNumber, setIsUpdatingNumber] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  // Google linking state
  const [linkingGoogle, setLinkingGoogle] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  // Phone unlock state on unauthorized gate
  const [phoneAuthInput, setPhoneAuthInput] = useState('');
  const [phoneAuthLoading, setPhoneAuthLoading] = useState(false);
  const [phoneAuthError, setPhoneAuthError] = useState<string | null>(null);

  const cleanPseudo = pseudo ? pseudo.trim().toLowerCase() : '';

  const handlePhoneAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneAuthError(null);
    if (!phoneAuthInput.trim()) {
      setPhoneAuthError('Veuillez renseigner votre numéro.');
      return;
    }
    setPhoneAuthLoading(true);
    try {
      await loginWithGhostCredentials(cleanPseudo, phoneAuthInput.trim());
    } catch {
      setPhoneAuthError('Numéro incorrect pour ce GHOST.');
    } finally {
      setPhoneAuthLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!cleanPseudo) return;

    setLoading(true);
    const unsubscribe = subscribeToGhost(
      cleanPseudo,
      (data, cached) => {
        setGhost(data);
        setFromCache(cached);
        setLoading(false);

        if (data) {
          // Pre-populate editor
          const matchCountry = COUNTRY_OPTIONS.find((c) => c.code === data.countryCode);
          if (matchCountry) setEditCountry(matchCountry);
          setEditNationalNumber(data.nationalNumber || '');
        }
      },
      (error) => {
        console.error('Snapshot error:', error);
        setLoading(false);
      }
    );

    // Also try to fetch metadata if user is logged in
    const fetchMeta = async () => {
      try {
        const metaRef = doc(db, 'ghost_metadata', cleanPseudo);
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
          setMeta(metaSnap.data() as any);
        }
      } catch (e) {
        // Metadata not accessible, likely not the owner or not logged in
        console.log('Metadata access restricted or ghost not found');
      }
    };
    fetchMeta();

    return () => unsubscribe();
  }, [cleanPseudo]);

  const handleCopyLink = async () => {
    const fullUrl = `${window.location.origin}/p/${cleanPseudo}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const input = document.createElement('input');
        input.value = fullUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleUpdateNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(null);

    const phoneResult = validateAndFormatPhone(editCountry.code, editNationalNumber);
    if (!phoneResult.isValid) {
      setUpdateError(phoneResult.error || "Ce numéro de téléphone n'est pas valide.");
      return;
    }

    setIsUpdatingNumber(true);
    try {
      await updateGhostNumber(cleanPseudo, {
        currentNumber: phoneResult.e164,
        countryCode: editCountry.code,
        nationalNumber: phoneResult.national,
      });
      setUpdateSuccess('Numéro mis à jour avec succès en temps réel !');
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err: any) {
      console.error('Update error:', err);
      if (err.message?.includes('network') || !isNetworkOnline) {
        setUpdateError('Connexion Internet indisponible.');
      } else {
        setUpdateError('Impossible de synchroniser GHOST pour le moment. Réessaie dans quelques instants.');
      }
    } finally {
      setIsUpdatingNumber(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!ghost) return;
    setUpdateError(null);
    setIsTogglingStatus(true);
    try {
      const nextStatus = !ghost.isOnline;
      await updateGhostStatus(cleanPseudo, nextStatus);
    } catch (err: any) {
      console.error('Status toggle error:', err);
      setUpdateError('Impossible de mettre à jour le statut.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    setLinkMessage(null);
    try {
      await linkGoogleAccount();
      setLinkMessage('Compte Google lié avec succès !');
    } catch (err: any) {
      console.error('Google linking error:', err);
      if (err.code === 'auth/credential-already-in-use') {
        setLinkMessage('Ce compte Google est déjà associé à un autre profil.');
      } else {
        setLinkMessage('Échec de la liaison avec Google.');
      }
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('ghost_recent_pseudo');
      clearSessionAuthentication(cleanPseudo);
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // 1. Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0F0F0F]">
        <GhostLogo status="neutral" size="lg" animated />
        <h2 className="mt-4 font-display font-light text-xl text-white tracking-[0.25em]">
          GHOST
        </h2>
        <p className="mt-2 font-mono text-xs text-[#888888] animate-pulse">
          Chargement de l'application...
        </p>
      </div>
    );
  }

  // 2. Ghost not found
  if (!ghost) {
    return (
      <div className="min-h-screen flex flex-col justify-between px-4 py-8 max-w-md mx-auto text-center">
        <header className="flex justify-center">
          <GhostLogo status="error" size="lg" />
        </header>
        <main className="my-auto">
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            Ce GHOST n'existe pas.
          </h1>
          <p className="text-sm text-[#888888] mb-6">
            Le pseudo <span className="text-[#FF3B3B] font-mono">@{cleanPseudo}</span> est disponible.
          </p>
          <Link to="/" className="btn-green inline-flex">
            Créer ce GHOST
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. Ownership verification check:
  // Either authenticated via Google (ownerUid, ownerEmail matching) OR verified credential session
  const isOwner = Boolean(
    (user && meta && (
      meta.ownerUid === user.uid ||
      (meta.ownerEmail && user.email && meta.ownerEmail.toLowerCase() === user.email.toLowerCase())
    )) ||
    isSessionAuthenticated(cleanPseudo)
  );

  if (!isOwner) {
    return (
      <div className="min-h-screen flex flex-col justify-between px-4 py-8 max-w-md mx-auto text-center">
        <header className="flex justify-center">
          <GhostLogo status="error" size="lg" />
        </header>
        <main className="my-auto">
          <div className="p-4 rounded-2xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 mb-5">
            <AlertCircle className="w-8 h-8 text-[#FF3B3B] mx-auto mb-2" />
            <h1 className="font-display text-xl font-bold text-[#FF3B3B] mb-1.5">
              Accès propriétaire requis
            </h1>
            <p className="text-xs text-[#C0C0C0] leading-relaxed">
              Pour administrer ce GHOST personnel, identifie-toi avec ton numéro de téléphone enregistré ou ton compte Google.
            </p>
          </div>

          <div className="space-y-4 text-left">
            {/* Phone Credential Unlock Form */}
            <form onSubmit={handlePhoneAuthSubmit} className="space-y-3 p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl">
              <div>
                <label htmlFor="owner-phone-unlock" className="block text-xs font-semibold text-[#A0A0A0] mb-1.5">
                  Numéro de téléphone enregistré
                </label>
                <input
                  id="owner-phone-unlock"
                  type="tel"
                  required
                  value={phoneAuthInput}
                  onChange={(e) => {
                    setPhoneAuthInput(e.target.value);
                    if (phoneAuthError) setPhoneAuthError(null);
                  }}
                  placeholder="ex: 699001122 ou +237..."
                  className="w-full bg-[#1F1F1F] border border-[#333333] focus:border-[#00FF88] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-[#555555] outline-none"
                />
              </div>

              {phoneAuthError && (
                <p className="text-xs text-[#FF3B3B] font-medium">{phoneAuthError}</p>
              )}

              <button
                type="submit"
                disabled={phoneAuthLoading || !phoneAuthInput.trim()}
                className="btn-green w-full py-2.5 text-xs font-bold"
              >
                {phoneAuthLoading ? 'VÉRIFICATION...' : 'Déverrouiller mon espace'}
              </button>
            </form>

            <div className="relative my-2 text-center">
              <span className="text-[10px] font-mono text-[#666666] uppercase bg-[#0F0F0F] px-2">
                OU VIA COMPTE GOOGLE
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (err) {
                  console.error('Google login error:', err);
                }
              }}
              className="btn-ghost w-full flex items-center justify-center gap-2 border-[#00FF88]/40 text-[#00FF88] hover:bg-[#00FF88]/10 py-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Se connecter avec Google</span>
            </button>

            <div className="flex gap-2 pt-2">
              <Link to={`/p/${cleanPseudo}`} className="btn-ghost flex-1 text-center py-2 text-xs">
                Page publique
              </Link>
              <Link to="/" className="btn-green flex-1 text-center py-2 text-xs">
                Créer un GHOST
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 4. Authorized Owner View
  const displayStatus = ghost.isOnline ? 'online' : 'offline';

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:py-8 max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full mb-6">
        <div className="flex items-center gap-3">
          <GhostLogo status={displayStatus} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-lg text-white">
                @{ghost.pseudo}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF88]/15 text-[#00FF88] font-semibold border border-[#00FF88]/30">
                PROPRIÉTAIRE
              </span>
            </div>
            <p className="text-[11px] text-[#00FF88] font-mono">
              Espace personnel sécurisé
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNetworkOnline ? (
            <div className="flex items-center gap-1 text-[11px] text-[#FF3B3B] bg-[#FF3B3B]/10 px-2 py-1 rounded-md border border-[#FF3B3B]/30">
              <WifiOff className="w-3 h-3" />
              <span>Hors-ligne</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-[#00FF88] hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
              <span>Temps réel</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            title="Verrouiller la session et se déconnecter"
            className="flex items-center gap-1.5 text-xs text-[#888888] hover:text-[#FF3B3B] bg-[#141414] hover:bg-[#201414] border border-[#2A2A2A] hover:border-[#FF3B3B]/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-[#FF3B3B]" />
            <span className="text-[11px]">Verrouiller</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-5 flex-1">
        {/* Public Link Card */}
        <div className="card-ghost p-4 sm:p-5 border-[#333333]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888]">
              Ton lien permanent
            </span>
            <span className="text-[10px] text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded">
              Ne change jamais
            </span>
          </div>

          <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-3 flex items-center justify-between mb-3">
            <span className="font-mono text-sm text-white font-medium truncate">
              ghost.cm/p/{ghost.pseudo}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#00FF88] font-mono ml-2">
              <Check className="w-3.5 h-3.5" />
              <span>Fixe</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className="btn-ghost text-xs py-2.5 px-3 w-full flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF88]" />
                  <span className="text-[#00FF88]">COPIÉ !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>COPIER LE LIEN</span>
                </>
              )}
            </button>

            <Link
              to={`/p/${ghost.pseudo}`}
              className="btn-ghost text-xs py-2.5 px-3 w-full flex items-center justify-center gap-1.5 border-[#444444]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>VOIR EN INVITÉ</span>
            </Link>
          </div>
        </div>

        {/* TON NUMÉRO À L'INSTANT T */}
        <div className="card-ghost p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2A2A] mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A0A0A0] block">
                Ton numéro à l'instant T
              </span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white mt-1">
                {ghost.currentNumber}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-[#888888] block mb-1">Statut</span>
              {ghost.isOnline ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF88]/15 text-[#00FF88] text-xs font-bold border border-[#00FF88]/30">
                  <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
                  JOIGNABLE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF3B3B]/15 text-[#FF3B3B] text-xs font-bold border border-[#FF3B3B]/30">
                  <span className="w-2 h-2 rounded-full bg-[#FF3B3B]" />
                  INJOIGNABLE (404)
                </span>
              )}
            </div>
          </div>

          {/* Form to update number */}
          <form onSubmit={handleUpdateNumber} className="space-y-4">
            <div>
              <label htmlFor="editNationalNumber" className="block text-xs font-semibold text-[#888888] mb-1.5">
                Changer de numéro de téléphone :
              </label>
              <div className="flex gap-2">
                <div className="w-32 flex-shrink-0">
                  <CountrySelect
                    id="editCountry"
                    value={editCountry}
                    onChange={(c) => setEditCountry(c)}
                  />
                </div>

                <input
                  id="editNationalNumber"
                  type="tel"
                  required
                  value={editNationalNumber}
                  onChange={(e) => setEditNationalNumber(e.target.value)}
                  placeholder={editCountry.placeholder}
                  className="flex-1 bg-[#141414] border border-[#2E2E2E] focus:border-[#00FF88] focus:ring-1 focus:ring-[#00FF88] rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-[#444444] outline-none"
                />
              </div>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 flex items-start gap-2 text-xs text-[#FF3B3B]">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{updateError}</span>
              </div>
            )}

            {updateSuccess && (
              <div className="p-3 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-start gap-2 text-xs text-[#00FF88]">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{updateSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingNumber || !editNationalNumber.trim()}
              className="btn-green w-full text-sm font-bold"
            >
              {isUpdatingNumber ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  SYNCHRONISATION...
                </span>
              ) : (
                <span>METTRE À JOUR</span>
              )}
            </button>
          </form>

          {/* Statut 404 Toggle button */}
          <div className="mt-5 pt-4 border-t border-[#2A2A2A]">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`w-full ${
                ghost.isOnline ? 'btn-red' : 'btn-ghost border-[#00FF88]/40 text-[#00FF88]'
              } text-xs py-3 flex items-center justify-center gap-2`}
            >
              <Power className="w-4 h-4" />
              <span>
                {ghost.isOnline ? 'PASSER EN 404 (INJOIGNABLE)' : 'PASSER EN LIGNE (JOIGNABLE)'}
              </span>
            </button>
            <p className="text-[11px] text-[#777777] text-center mt-2">
              {ghost.isOnline
                ? "Le mode 404 masque instantanément le bouton d'appel sur ton lien public."
                : "Active le bouton d'appel pour que tes contacts puissent te joindre."}
            </p>
          </div>
        </div>

        {/* Multi-Device Account Linking */}
        {isAnonymous && (
          <div className="card-ghost p-4 border-[#2A2A2A] bg-[#171717]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#00FF88] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Conserver ton GHOST sur tous tes appareils
                </h3>
                <p className="text-[11px] text-[#888888] mt-1 leading-relaxed">
                  Connecte ton compte Google pour retrouver ce GHOST sur ton PC, tablette ou nouveau téléphone sans perdre ton lien.
                </p>
                {linkMessage && (
                  <p className="text-xs text-[#00FF88] mt-2 font-medium">{linkMessage}</p>
                )}
                <button
                  type="button"
                  onClick={handleLinkGoogle}
                  disabled={linkingGoogle}
                  className="btn-ghost text-xs py-2 px-3 mt-3 w-full border-[#444444]"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>{linkingGoogle ? 'Connexion...' : 'Lier avec Google'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Security & Lock Section */}
        <div className="card-ghost p-4 border-[#2A2A2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-[#00FF88] shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Sécurité de session</p>
              <p className="text-[11px] text-[#777777]">Verrouille la session pour empêcher toute utilisation sur cet appareil.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-[#FF3B3B] hover:text-white hover:bg-[#FF3B3B]/20 border border-[#FF3B3B]/30 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>

        {/* Create another Ghost */}
        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs text-[#777777] hover:text-[#C0C0C0] transition-colors"
          >
            + Créer un autre GHOST
          </Link>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
