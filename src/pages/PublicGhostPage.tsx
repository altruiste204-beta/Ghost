import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import { subscribeToGhost, type GhostData } from '../lib/ghostService';
import { buildTelLink, buildWhatsAppLink } from '../lib/phone';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Phone, MessageSquare, WifiOff, Share2, Check, Settings } from 'lucide-react';

export const PublicGhostPage: React.FC = () => {
  const { pseudo } = useParams<{ pseudo: string }>();
  const { user } = useAuth();
  const isNetworkOnline = useNetworkStatus();

  const [ghost, setGhost] = useState<GhostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanPseudo = pseudo ? pseudo.trim().toLowerCase() : '';

  useEffect(() => {
    if (!cleanPseudo) return;

    setLoading(true);
    const unsubscribe = subscribeToGhost(
      cleanPseudo,
      (data, cached) => {
        setGhost(data);
        setFromCache(cached);
        setLoading(false);
      },
      (error) => {
        console.error('Public snapshot error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [cleanPseudo]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `GHOST @${cleanPseudo}`,
          text: `Retrouve le numéro de @${cleanPseudo} sur son lien permanent GHOST :`,
          url,
        });
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // clipboard error
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0F0F0F]">
        <GhostLogo status="neutral" size="lg" animated />
        <h2 className="mt-4 font-display font-light text-xl text-white tracking-[0.25em]">
          GHOST
        </h2>
        <p className="mt-2 font-mono text-xs text-[#888888] animate-pulse">
          Connexion sécurisée en cours...
        </p>
      </div>
    );
  }

  // CAS A — GHOST INEXISTANT
  if (!ghost) {
    return (
      <div className="min-h-screen flex flex-col justify-between px-4 py-8 max-w-md mx-auto text-center">
        <header className="flex justify-center pt-8">
          <GhostLogo status="error" size="xl" animated={false} />
        </header>

        <main className="my-auto py-8">
          <div className="inline-block px-3 py-1 rounded-full bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 text-[#FF3B3B] text-xs font-bold uppercase tracking-wider mb-4">
            Non trouvé
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
            Ce GHOST n'existe pas.
          </h1>

          <p className="text-sm text-[#888888] max-w-xs mx-auto mb-8 leading-relaxed">
            Le lien <span className="text-[#FF3B3B] font-mono">ghost.cm/p/{cleanPseudo}</span> n'a pas encore été réservé.
          </p>

          <Link to="/" className="btn-green inline-flex">
            Créer ce GHOST maintenant
          </Link>
        </main>

        <Footer />
      </div>
    );
  }

  // CAS B & CAS C
  const isOnline = ghost.isOnline;
  const isOwner = user && ghost.ownerUid === user.uid;
  const telLink = buildTelLink(ghost.currentNumber);
  const waLink = buildWhatsAppLink(ghost.currentNumber);

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:py-8 max-w-md mx-auto">
      {/* Top Bar */}
      <header className="flex items-center justify-between w-full mb-6">
        <Link to="/" className="flex items-center gap-2 group">
          <GhostLogo status={isOnline ? 'online' : 'offline'} size="sm" animated={false} />
          <span className="font-display font-bold text-sm text-[#888888] group-hover:text-white transition-colors">
            GHOST
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              to={`/owner/${cleanPseudo}`}
              className="flex items-center gap-1 text-xs text-[#00FF88] bg-[#00FF88]/10 hover:bg-[#00FF88]/20 border border-[#00FF88]/30 px-2.5 py-1 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gérer</span>
            </Link>
          )}

          <button
            onClick={handleShare}
            aria-label="Partager ce GHOST"
            className="btn-ghost py-1.5 px-2.5 text-xs rounded-lg flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00FF88]" />
                <span className="text-[#00FF88]">Copié</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Partager</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 flex flex-col justify-center my-auto">
        {/* Offline veracity notification */}
        {(!isNetworkOnline || fromCache) && (
          <div className="mb-4 p-2.5 rounded-xl bg-[#1E1E1E] border border-[#333333] flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
            <WifiOff className="w-3.5 h-3.5 text-[#FF3B3B]" />
            <span>Mode hors-ligne • Dernière donnée connue</span>
          </div>
        )}

        {/* Card Component */}
        <div className="card-ghost p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden border-[#2A2A2A]">
          {/* Central Logo */}
          <div className="flex justify-center mb-5">
            <GhostLogo status={isOnline ? 'online' : 'offline'} size="xl" />
          </div>

          {/* Pseudo Title */}
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            @{ghost.pseudo}
          </h1>

          <p className="text-xs font-mono text-[#888888] mt-1 mb-5">
            ghost.cm/p/{ghost.pseudo}
          </p>

          {/* Status Badge */}
          <div className="mb-6">
            {isOnline ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/40 text-[#00FF88] text-xs font-bold tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-pulse" />
                <span>JOIGNABLE</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF3B3B]/15 border border-[#FF3B3B]/40 text-[#FF3B3B] text-xs font-bold tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B3B]" />
                <span>INJOIGNABLE</span>
              </div>
            )}
          </div>

          {/* CAS C: JOIGNABLE */}
          {isOnline ? (
            <div className="space-y-3.5">
              {/* Phone Number Display */}
              <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl py-3 px-4 mb-4">
                <span className="text-[11px] text-[#777777] uppercase tracking-wider block mb-0.5">
                  Numéro actuel
                </span>
                <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {ghost.currentNumber}
                </span>
              </div>

              {/* Primary Call Action */}
              <a
                href={telLink}
                className="btn-green w-full text-base font-bold shadow-lg shadow-[#00FF88]/20 flex items-center justify-center gap-2.5"
              >
                <Phone className="w-5 h-5 fill-current" />
                <span>APPELER</span>
              </a>

              {/* WhatsApp Action */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full text-sm font-semibold flex items-center justify-center gap-2 border-[#333333] hover:border-[#25D366] hover:text-[#25D366] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WHATSAPP</span>
              </a>
            </div>
          ) : (
            /* CAS B: INJOIGNABLE */
            <div className="py-4 px-3 bg-[#141414] rounded-xl border border-[#2E2E2E]">
              <p className="text-xs text-[#A0A0A0] leading-relaxed">
                Ce contact est actuellement injoignable via son GHOST.<br />
                Reviens plus tard pour retrouver son numéro dès qu'il sera de nouveau en ligne.
              </p>
            </div>
          )}
        </div>

        {/* Subtitle / Explanation */}
        <div className="text-center mt-6">
          <p className="text-xs text-[#777777]">
            CHANGE TON NUMÉRO. <span className="text-[#C0C0C0] font-medium">PAS TON LIEN.</span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
