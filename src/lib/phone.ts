import { isValidPhoneNumber, parsePhoneNumber, type CountryCode } from 'libphonenumber-js';

export interface CountryOption {
  code: string; // Dial code e.g. "+237"
  iso: CountryCode;
  name: string;
  placeholder: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+237', iso: 'CM', name: 'Cameroun', placeholder: '693 12 34 56' },
  { code: '+225', iso: 'CI', name: "Côte d'Ivoire", placeholder: '07 08 09 10 11' },
  { code: '+221', iso: 'SN', name: 'Sénégal', placeholder: '77 123 45 67' },
  { code: '+33',  iso: 'FR', name: 'France', placeholder: '6 12 34 56 78' },
  { code: '+32',  iso: 'BE', name: 'Belgique', placeholder: '470 12 34 56' },
  { code: '+1',   iso: 'US', name: 'USA / Canada', placeholder: '202 555 0123' },
  { code: '+242', iso: 'CG', name: 'Congo', placeholder: '06 123 4567' },
  { code: '+243', iso: 'CD', name: 'RDC', placeholder: '81 234 5678' },
  { code: '+241', iso: 'GA', name: 'Gabon', placeholder: '07 12 34 56' },
  { code: '+229', iso: 'BJ', name: 'Bénin', placeholder: '97 12 34 56' },
  { code: '+228', iso: 'TG', name: 'Togo', placeholder: '90 12 34 56' },
  { code: '+44',  iso: 'GB', name: 'Royaume-Uni', placeholder: '7911 123456' },
  { code: '+49',  iso: 'DE', name: 'Allemagne', placeholder: '151 23456789' },
  { code: '+41',  iso: 'CH', name: 'Suisse', placeholder: '78 123 45 67' },
];

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string;
  international: string;
  national: string;
  error?: string;
}

export function validateAndFormatPhone(paramA: string, paramB: string): PhoneValidationResult {
  const strA = (paramA || '').trim();
  const strB = (paramB || '').trim();
  
  // Auto-detect which parameter is the dial code (e.g. "+237") vs national digits
  const isA = strA.startsWith('+');
  const isB = strB.startsWith('+');
  const countryCode = isA ? strA : isB ? strB : strA;
  const nationalNumber = isA ? strB : isB ? strA : strB;

  const cleanDigits = nationalNumber.replace(/\D/g, '');
  
  if (!cleanDigits) {
    return { isValid: false, e164: '', international: '', national: '', error: 'Ce numéro de téléphone n\'est pas valide.' };
  }

  // Reject all zeros (e.g. +237000000000)
  if (/^0+$/.test(cleanDigits)) {
    return { isValid: false, e164: '', international: '', national: '', error: 'Ce numéro de téléphone n\'est pas valide.' };
  }

  // Combine countryCode and national digits (stripping single leading 0 if needed for international syntax)
  const fullNumberStr = `${countryCode}${nationalNumber}`;

  try {
    const parsed = parsePhoneNumber(fullNumberStr);
    
    if (!parsed || !parsed.isValid()) {
      return { isValid: false, e164: '', international: '', national: '', error: 'Ce numéro de téléphone n\'est pas valide.' };
    }

    const e164 = parsed.number; // e.g. +237693123456
    const international = parsed.formatInternational(); // e.g. +237 6 93 12 34 56
    const national = parsed.formatNational(); // e.g. 6 93 12 34 56

    return {
      isValid: true,
      e164,
      international,
      national,
    };
  } catch {
    // Fallback validation with isValidPhoneNumber
    const isValid = isValidPhoneNumber(fullNumberStr);
    if (!isValid) {
      return { isValid: false, e164: '', international: '', national: '', error: 'Ce numéro de téléphone n\'est pas valide.' };
    }

    return {
      isValid: true,
      e164: fullNumberStr.replace(/\s+/g, ''),
      international: fullNumberStr,
      national: cleanDigits
    };
  }
}

/**
 * Builds WhatsApp direct link: wa.me/<country_and_number_digits> without + or spaces
 */
export function buildWhatsAppLink(e164: string): string {
  const digitsOnly = e164.replace(/\D/g, '');
  return `https://wa.me/${digitsOnly}`;
}

/**
 * Builds tel: protocol link: tel:<e164>
 */
export function buildTelLink(e164: string): string {
  return `tel:${e164}`;
}
