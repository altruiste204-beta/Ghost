import React from 'react';
import { Link } from 'react-router-dom';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import { ArrowLeft, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:py-10 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#888888] hover:text-[#00FF88] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETOUR</span>
        </Link>

        <div className="flex items-center gap-2">
          <GhostLogo size="sm" />
          <span className="font-display font-bold text-sm tracking-tight text-white">
            GHOST <span className="text-[9px] px-1 py-0.2 rounded bg-[#00FF88]/20 text-[#00FF88] font-mono">v2</span>
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-8 mb-12">
        <div className="space-y-2 border-b border-[#222222] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E1E1E] text-[#00FF88] text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Vie Privée & RGPD</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            Politique de Confidentialité
          </h1>
          <p className="text-xs text-[#777777]">
            Transparence totale • Respect strict de la vie privée • Aucune revente de données
          </p>
        </div>

        {/* Commitment Banner */}
        <div className="p-4 rounded-xl bg-[#00FF88]/5 border border-[#00FF88]/30 flex items-start gap-3 text-xs text-[#C0C0C0]">
          <ShieldCheck className="w-5 h-5 text-[#00FF88] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Le serment GHOST :</strong>
            GHOST n'aspire jamais votre carnet d'adresses, ne vend aucune donnée à des régies publicitaires et ne pose aucun cookie espion.
          </div>
        </div>

        <div className="space-y-6 text-xs text-[#A0A0A0] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              1. Données strictement collectées
            </h2>
            <p>
              Pour délivrer le service, GHOST stocke uniquement les éléments strictement indispensables au routage d'appels :
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#888888]">
              <li><strong>Le pseudo public</strong> : L'identifiant choisi pour générer votre lien permanent.</li>
              <li><strong>Le numéro de téléphone actif</strong> : Converti au format international E.164 dans le but unique de déclencher les liens d'appel (<code className="text-white">tel:</code>) et WhatsApp.</li>
              <li><strong>L'identifiant technique de propriétaire (ownerUid)</strong> : Clé cryptographique d'authentification pour verrouiller les modifications.</li>
              <li><strong>Le statut de disponibilité</strong> (en ligne ou mode 404).</li>
              <li><strong>Les horodatages</strong> de création et de dernière mise à jour.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              2. Ce que nous ne collectons PAS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <div className="p-3 rounded-lg bg-[#191919] border border-[#2A2A2A] flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                <span>Pas de carnet de contacts</span>
              </div>
              <div className="p-3 rounded-lg bg-[#191919] border border-[#2A2A2A] flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                <span>Pas de géolocalisation GPS</span>
              </div>
              <div className="p-3 rounded-lg bg-[#191919] border border-[#2A2A2A] flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                <span>Pas d'enregistrement d'appels</span>
              </div>
              <div className="p-3 rounded-lg bg-[#191919] border border-[#2A2A2A] flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-[#00FF88]" />
                <span>Pas de cookies publicitaires</span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              3. Hébergement et Sécurité des Données
            </h2>
            <p>
              Toutes les données sont hébergées au sein de l'infrastructure certifiée Google Cloud Platform / Firebase Firestore, chiffrées en transit (HTTPS / TLS 1.3) et au repos (AES-256). L'accès aux opérations d'écriture est validé par des règles de sécurité strictes au niveau de la base de données.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              4. Droit d'accès, de rectification et d'effacement
            </h2>
            <p>
              Conformément à la réglementation applicable (RGPD et lois de protection des données personnelles), vous pouvez à tout moment modifier votre numéro ou supprimer définitivement votre profil GHOST directement depuis votre tableau de bord propriétaire.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
