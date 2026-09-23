import React from 'react';
import { Link } from 'react-router-dom';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import { ArrowLeft, Shield } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
            <Shield className="w-3.5 h-3.5" />
            <span>Conditions d'Utilisation</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            Conditions Générales d'Utilisation (CGU)
          </h1>
          <p className="text-xs text-[#777777]">
            Dernière mise à jour : 23 Septembre 2026 • GHOST Build 1.0
          </p>
        </div>

        <div className="space-y-6 text-xs text-[#A0A0A0] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              1. Objet du Service
            </h2>
            <p>
              La plateforme <strong>GHOST</strong> a pour objet de fournir à tout utilisateur un lien permanent unique (<code className="text-[#00FF88]">ghost.cm/p/&lt;pseudo&gt;</code>) redirigeant vers un numéro de téléphone mobile actif, permettant ainsi de maintenir une accessibilité téléphonique continue sans dépendre d'une carte SIM ou d'un opérateur téléphonique figé.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              2. Acceptation des Conditions
            </h2>
            <p>
              L'accès et l'utilisation de GHOST impliquent l'acceptation sans réserve des présentes CGU. Tout utilisateur ne souhaitant pas adhérer aux présentes conditions est invité à cesser toute utilisation de la plateforme.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              3. Réservation et Responsabilité du Pseudo
            </h2>
            <ul className="list-disc pl-4 space-y-1 text-[#888888]">
              <li>Le pseudo est constitué de 3 à 30 caractères alphanumériques autorisés (minuscules, chiffres, tirets et underscores).</li>
              <li>Chaque pseudo est unique et attribué selon la règle du premier arrivé, premier servi.</li>
              <li>L'utilisateur s'engage à ne pas usurper l'identité de tiers, d'entreprises ou de marques protégées, ni à utiliser de termes diffamatoires ou injurieux. Tout pseudo abusif pourra être suspendu.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              4. Exactitude des Numéros Renseignés
            </h2>
            <p>
              L'utilisateur est seul responsable de l'exactitude du numéro de téléphone associé à son profil GHOST. L'association d'un numéro tiers sans autorisation préalable est strictement prohibée.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              5. Disponibilité et Mode 404
            </h2>
            <p>
              Le service GHOST est accessible 24h/24 et 7j/7, sous réserve d'éventuelles interruptions techniques ou de maintenance. L'utilisateur dispose à tout moment de la faculté de basculer son statut en « Mode 404 », rendant son numéro masqué et son profil publiquement injoignable.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              6. Sécurité et Propriété du Compte
            </h2>
            <p>
              L'administration d'un GHOST est sécurisée par authentification cryptographique. L'association d'un compte Google permet de garantir la persistance des droits de modification sur tous les appareils de l'utilisateur.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
