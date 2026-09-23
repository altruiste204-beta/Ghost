import React from 'react';
import { Link } from 'react-router-dom';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import {
  ArrowLeft,
  Smartphone,
  Share2,
  RefreshCw,
  EyeOff,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  Zap,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:py-10 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between w-full mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#888888] hover:text-[#00FF88] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETOUR À L'ACCUEIL</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-xs text-[#00FF88] hover:text-white px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 transition-colors font-mono"
          >
            Accueil
          </Link>
          <div className="flex items-center gap-2">
            <GhostLogo size="sm" />
            <span className="font-display font-bold text-sm tracking-tight text-white">
              GHOST <span className="text-[9px] px-1 py-0.2 rounded bg-[#00FF88]/20 text-[#00FF88] font-mono">v2</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-12 mb-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] text-xs font-mono mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Guide officiel de la plateforme</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight">
            CHANGE TON NUMÉRO.<br />
            <span className="text-[#00FF88] drop-shadow-[0_0_25px_rgba(0,255,136,0.35)]">
              PAS TON LIEN.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#AAAAAA] max-w-lg mx-auto leading-relaxed">
            GHOST résout définitivement le cauchemar des changements de numéro de téléphone. Un seul lien permanent pour la vie, un numéro modifiable en un éclair.
          </p>
        </section>

        {/* The Problem vs Solution */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#1A1414] border border-[#FF3B3B]/20 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#FF3B3B] font-bold">
              Avant GHOST
            </span>
            <h3 className="font-display text-base font-bold text-white">
              La corvée des changements
            </h3>
            <ul className="text-xs text-[#999999] space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#FF3B3B]">•</span>
                Envoyer un SMS ou statut à 300 personnes : « Nouveau numéro, enregistrez-moi ! »
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF3B3B]">•</span>
                Perte de clients, prospects ou amis qui tombent sur une ligne résiliée.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF3B3B]">•</span>
                Cartes de visite et bio de réseaux sociaux obsolètes dès un voyage ou changement de puce.
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-[#141E18] border border-[#00FF88]/30 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#00FF88] font-bold">
              Avec GHOST
            </span>
            <h3 className="font-display text-base font-bold text-white">
              Un lien universel immuable
            </h3>
            <ul className="text-xs text-[#C0C0C0] space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88] shrink-0 mt-0.5" />
                Un lien unique <span className="font-mono text-[#00FF88]">ghost.cm/p/ton-pseudo</span> partagé une fois pour toutes.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88] shrink-0 mt-0.5" />
                Mise à jour en 3 secondes depuis ton dashboard sécurisé.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88] shrink-0 mt-0.5" />
                Tes contacts ont toujours ton numéro actif, sans rien réinstaller.
              </li>
            </ul>
          </div>
        </section>

        {/* 3 Step Process */}
        <section className="space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">
              Comment ça fonctionne en 3 étapes
            </h2>
            <p className="text-xs text-[#777777]">
              Aucune application à télécharger pour tes contacts. Zéro friction.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="card-ghost p-5 flex items-start gap-4 hover:border-[#00FF88]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center shrink-0 text-[#00FF88] font-mono font-bold">
                1
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#00FF88]" />
                  Réserve ton pseudo & entre ton numéro
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Choisis un alias mémorable de 3 à 30 caractères (ex: <code className="text-[#00FF88]">hugues</code>). Renseigne ton numéro de téléphone actuel avec ton indicatif international. Ton GHOST est instancié atomiquement.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-ghost p-5 flex items-start gap-4 hover:border-[#00FF88]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center shrink-0 text-[#00FF88] font-mono font-bold">
                2
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#00FF88]" />
                  Diffuse ton lien permanent partout
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Place ton lien dans ta bio Instagram, TikTok, LinkedIn, sur tes cartes de visite, ton sticker NFC ou ta signature d'email. Toute personne cliquant dessus arrive sur une page épurée permettant de t'appeler ou de t'écrire sur WhatsApp en 1 tap.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-ghost p-5 flex items-start gap-4 hover:border-[#00FF88]/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center shrink-0 text-[#00FF88] font-mono font-bold">
                3
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-sm font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#00FF88]" />
                  Change de SIM quand tu veux
                </h3>
                <p className="text-xs text-[#999999] leading-relaxed">
                  Nouvelle puce, voyage à l'étranger, nouvel opérateur ? Connecte-toi à ton espace propriétaire et change le numéro. La mise à jour est propagée instantanément en temps réel sur ton lien permanent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-white text-center">
            Fonctionnalités avancées intégrées
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="card-ghost p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#FF3B3B] font-bold">
                <EyeOff className="w-4 h-4" />
                <span>Le Mode 404 (Fantôme)</span>
              </div>
              <p className="text-[#888888] leading-relaxed">
                Besoin de couper le contact, en congé ou indisponible ? Active le mode 404 d'un tap. Ton lien affichera « INJOIGNABLE » et masquera tes boutons d'appel jusqu'à réactivation.
              </p>
            </div>

            <div className="card-ghost p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold">
                <Wifi className="w-4 h-4" />
                <span>Offline-First & PWA</span>
              </div>
              <p className="text-[#888888] leading-relaxed">
                GHOST est une Progressive Web App installable sur ton écran d'accueil. Grâce à la persistance locale Firestore, tes contacts peuvent même lancer un appel hors-ligne sur les profils récemment consultés.
              </p>
            </div>

            <div className="card-ghost p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Sécurité & Multi-Device</span>
              </div>
              <p className="text-[#888888] leading-relaxed">
                Ton GHOST est protégé par Firebase Authentication et des règles de sécurité cryptographiques. Lie ton compte Google pour administrer ton profil depuis tous tes ordinateurs ou smartphones.
              </p>
            </div>

            <div className="card-ghost p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#00FF88] font-bold">
                <div className="flex gap-1">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <MessageCircle className="w-3.5 h-3.5" />
                </div>
                <span>Appel & WhatsApp Direct</span>
              </div>
              <p className="text-[#888888] leading-relaxed">
                Les liens natifs <code className="text-white">tel:</code> et les URLs <code className="text-white">wa.me</code> sont formatés automatiquement selon les standards internationaux E.164.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="card-ghost p-6 sm:p-8 text-center space-y-4 border-[#00FF88]/40 bg-gradient-to-b from-[#1E1E1E] to-[#121212]">
          <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-white">
            Prêt à ne plus jamais perdre un contact ?
          </h2>
          <p className="text-xs text-[#999999] max-w-sm mx-auto">
            Crée ton profil GHOST gratuitement en moins de 30 secondes.
          </p>
          <Link
            to="/"
            className="btn-green inline-flex items-center justify-center gap-2 text-sm font-bold tracking-wider px-8 py-3.5"
          >
            CRÉER MON GHOST MAINTENANT
          </Link>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
