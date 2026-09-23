import React from 'react';
import { Link } from 'react-router-dom';
import { GhostLogo } from '../components/GhostLogo';
import { Footer } from '../components/Footer';
import { ArrowLeft, FileText, Server, User, Code } from 'lucide-react';

export const LegalNoticePage: React.FC = () => {
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
            <FileText className="w-3.5 h-3.5" />
            <span>Informations Légales</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            Mentions Légales
          </h1>
          <p className="text-xs text-[#777777]">
            Conformément aux dispositions relatives aux services de communication en ligne.
          </p>
        </div>

        <div className="space-y-6 text-xs text-[#A0A0A0] leading-relaxed">
          {/* Editeur */}
          <section className="card-ghost p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <User className="w-4 h-4 text-[#00FF88]" />
              <h2 className="font-display text-sm uppercase">
                1. Éditeur de la Plateforme
              </h2>
            </div>
            <p>
              L'application web <strong>GHOST v2</strong> (Build 1.0) est développée et administrée par :
            </p>
            <div className="font-mono text-xs bg-[#141414] p-3 rounded-lg border border-[#2A2A2A] text-[#F0F0F0] space-y-1">
              <div><strong className="text-[#00FF88]">Auteur & Concepteur :</strong> L'Équipe GHOST</div>
              <div><strong className="text-[#00FF88]">Projet :</strong> Ghost App • Web App Firebase Multi-Device</div>
              <div><strong className="text-[#00FF88]">Mantra :</strong> « CHANGE TON NUMÉRO. PAS TON LIEN. »</div>
            </div>
          </section>

          {/* Hébergement */}
          <section className="card-ghost p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <Server className="w-4 h-4 text-[#00FF88]" />
              <h2 className="font-display text-sm uppercase">
                2. Hébergement & Infrastructure
              </h2>
            </div>
            <p>
              L'infrastructure applicative et la base de données temps réel sont hébergées par :
            </p>
            <div className="font-mono text-xs bg-[#141414] p-3 rounded-lg border border-[#2A2A2A] text-[#F0F0F0] space-y-1">
              <div><strong>Hébergeur :</strong> Google Cloud Platform / Firebase Inc.</div>
              <div><strong>Siège :</strong> 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</div>
              <div><strong>Réseau :</strong> CDN Global à haute disponibilité, chiffrement SSL/TLS systématique</div>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="card-ghost p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <Code className="w-4 h-4 text-[#00FF88]" />
              <h2 className="font-display text-sm uppercase">
                3. Propriété Intellectuelle & Droits d'Auteur
              </h2>
            </div>
            <p>
              L'ensemble des éléments constituant l'application (architecture logicielle, logo carte SIM stylisée avec spectre GHOST, textes, charte graphique et animations) sont protégés par le droit de la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction totale ou partielle sans autorisation expresse de l'auteur est interdite.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-2">
            <h2 className="font-display text-sm font-bold uppercase text-white">
              4. Contact
            </h2>
            <p>
              Pour toute question ou signalement concernant le service GHOST, vous pouvez contacter l'équipe via les canaux officiels ou le profil administrateur de la plateforme.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
