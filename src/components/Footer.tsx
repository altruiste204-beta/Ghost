import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto py-6 text-center text-xs text-[#777777] border-t border-[#1E1E1E] space-y-3">
      {/* Navigation Links */}
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px]">
        <Link
          to="/"
          className="hover:text-[#00FF88] text-[#00FF88]/90 font-medium transition-colors"
        >
          Accueil
        </Link>
        <span className="text-[#333333]">•</span>
        <Link
          to="/comment-ca-marche"
          className="hover:text-[#00FF88] transition-colors"
        >
          Comment ça marche
        </Link>
        <span className="text-[#333333]">•</span>
        <Link
          to="/cgu"
          className="hover:text-[#F0F0F0] transition-colors"
        >
          CGU
        </Link>
        <span className="text-[#333333]">•</span>
        <Link
          to="/confidentialite"
          className="hover:text-[#F0F0F0] transition-colors"
        >
          Confidentialité
        </Link>
        <span className="text-[#333333]">•</span>
        <Link
          to="/mentions-legales"
          className="hover:text-[#F0F0F0] transition-colors"
        >
          Mentions légales
        </Link>
      </nav>

      {/* Copyright */}
      <p className="tracking-wide text-[11px] text-[#666666]">
        © Ghost App • Build 1.0 • by <span className="text-[#A0A0A0] font-medium">L'Équipe GHOST</span>
      </p>
    </footer>
  );
};
