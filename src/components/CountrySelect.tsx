import React, { useState, useRef, useEffect } from 'react';
import { CountryFlag } from './CountryFlag';
import { COUNTRY_OPTIONS, type CountryOption } from '../lib/phone';
import { ChevronDown, Check } from 'lucide-react';

interface CountrySelectProps {
  value: CountryOption;
  onChange: (country: CountryOption) => void;
  className?: string;
  id?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  className = '',
  id = 'country-select',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (country: CountryOption) => {
    onChange(country);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-[#141414] border border-[#2E2E2E] hover:border-[#444444] focus:border-[#00FF88] rounded-xl px-3 py-3.5 text-sm text-white transition-all outline-none cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <CountryFlag iso={value.iso} size={20} />
          <span className="font-mono font-medium text-white text-xs sm:text-sm">
            {value.code}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#888888] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#00FF88]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1.5 w-64 max-h-60 overflow-y-auto bg-[#1A1A1A] border border-[#333333] rounded-xl shadow-2xl z-50 py-1.5 scrollbar-thin scrollbar-thumb-[#333333]"
        >
          {COUNTRY_OPTIONS.map((country) => {
            const isSelected = country.code === value.code && country.iso === value.iso;
            return (
              <button
                key={`${country.code}-${country.iso}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#00FF88]/15 text-[#00FF88]'
                    : 'text-[#E0E0E0] hover:bg-[#252525]'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <CountryFlag iso={country.iso} size={18} />
                  <span className="truncate">{country.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="font-mono text-[#888888] text-[11px]">
                    {country.code}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#00FF88]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
