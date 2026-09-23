import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  runTransaction, 
  onSnapshot, 
  Timestamp, 
  collection,
  query,
  where,
  getDocs,
  type Unsubscribe 
} from 'firebase/firestore';
import { db, auth, signInAnonymously, signInWithPopup, googleProvider } from './firebase';

export interface GhostData {
  pseudo: string;
  ownerUid: string;
  ownerEmail?: string | null;
  currentNumber: string;
  countryCode: string;
  nationalNumber: string;
  isOnline: boolean;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

export const PSEUDO_REGEX = /^[a-z0-9_-]{3,30}$/;

export function normalizePseudo(input: string): string {
  if (!input) return '';
  let cleaned = input.trim().toLowerCase();
  // Strip full URLs if pasted by the user
  cleaned = cleaned.replace(/^https?:\/\/[^\/]+\/p\//, '');
  cleaned = cleaned.replace(/^[^\/]+\/p\//, '');
  cleaned = cleaned.replace(/^\/p\//, '');
  // Strip leading @
  cleaned = cleaned.replace(/^@+/, '');
  // Strip whitespace
  cleaned = cleaned.replace(/\s+/g, '');
  return cleaned;
}

export function validatePseudo(pseudo: string): { isValid: boolean; error?: string } {
  const normalized = normalizePseudo(pseudo);
  if (!normalized) {
    return { isValid: false, error: 'Veuillez saisir un pseudo.' };
  }
  if (!PSEUDO_REGEX.test(normalized)) {
    return { isValid: false, error: 'Utilise 3 à 30 caractères : lettres minuscules, chiffres, - ou _.' };
  }
  return { isValid: true };
}

/**
 * Ensures user is authenticated (attempts anonymous auth, falls back to Google if restricted)
 */
export function setSessionAuthenticated(pseudo: string): void {
  try {
    sessionStorage.setItem(`ghost_auth_${normalizePseudo(pseudo)}`, 'authenticated');
  } catch {}
}

export function isSessionAuthenticated(pseudo: string): boolean {
  try {
    return sessionStorage.getItem(`ghost_auth_${normalizePseudo(pseudo)}`) === 'authenticated';
  } catch {
    return false;
  }
}

export function clearSessionAuthentication(pseudo?: string): void {
  try {
    if (pseudo) {
      sessionStorage.removeItem(`ghost_auth_${normalizePseudo(pseudo)}`);
    } else {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('ghost_auth_')) {
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch {}
}

/**
 * Ensures there is an authenticated user ID.
 * Falls back to persistent local UID if Firebase anonymous auth is disabled.
 */
export async function ensureAuthUser(allowPopupFallback = false): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }

  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err: any) {
    // If anonymous auth is restricted/disabled by Firebase, generate or reuse persistent client UID
    let localUid = localStorage.getItem('ghost_local_uid');
    if (!localUid) {
      localUid = 'ghost_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem('ghost_local_uid', localUid);
    }
    return localUid;
  }
}

/**
 * Atomically create a new GHOST.
 * If pseudo already exists, throws 'ALREADY_EXISTS'.
 */
export async function createGhost(params: {
  pseudo: string;
  currentNumber: string;
  countryCode: string;
  nationalNumber: string;
}): Promise<GhostData> {
  const normalizedPseudo = normalizePseudo(params.pseudo);
  const validation = validatePseudo(normalizedPseudo);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const ownerUid = await ensureAuthUser();
  const ownerEmail = auth.currentUser?.email || null;
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);
  const metaRef = doc(db, 'ghost_metadata', normalizedPseudo);

  let resultData: GhostData | null = null;

  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(ghostRef);
    if (docSnap.exists()) {
      const error = new Error("Ce pseudo n'est pas disponible. Veuillez en choisir un autre.");
      (error as any).code = 'ALREADY_EXISTS';
      throw error;
    }

    const publicData = {
      pseudo: normalizedPseudo,
      currentNumber: params.currentNumber,
      countryCode: params.countryCode,
      nationalNumber: params.nationalNumber,
      isOnline: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const privateData = {
      ownerUid,
      ...(ownerEmail ? { ownerEmail } : {}),
      updatedAt: serverTimestamp(),
    };

    transaction.set(ghostRef, publicData);
    transaction.set(metaRef, privateData);

    resultData = {
      ...publicData,
      ownerUid,
      ownerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GhostData;
  });

  // Authorize session immediately for creator
  setSessionAuthenticated(normalizedPseudo);

  return resultData!;
}

/**
 * Check if the raw phone input matches the ghost phone records in any conventional format
 */
export function isPhoneMatching(rawPhone: string, data: GhostData): boolean {
  const digitsEntered = rawPhone.replace(/\D/g, '');
  const digitsCurrent = (data.currentNumber || '').replace(/\D/g, '');
  const digitsNational = (data.nationalNumber || '').replace(/\D/g, '');
  const digitsNoZero = digitsEntered.replace(/^0+/, '');
  const digitsNationalNoZero = digitsNational.replace(/^0+/, '');
  const digitsCurrentNoZero = digitsCurrent.replace(/^0+/, '');

  if (!digitsEntered || digitsEntered.length < 4) return false;

  // Direct exact matches
  if (digitsEntered === digitsCurrent || digitsEntered === digitsNational) return true;
  if (digitsNoZero === digitsNationalNoZero || digitsNoZero === digitsCurrentNoZero) return true;

  // Partial / suffix / prefix matches
  if (digitsCurrent.endsWith(digitsEntered) || digitsNational.endsWith(digitsEntered)) return true;
  if (digitsEntered.endsWith(digitsNational) || digitsEntered.endsWith(digitsNationalNoZero)) return true;
  if (digitsCurrent.includes(digitsEntered) || digitsNational.includes(digitsEntered)) return true;
  if (digitsEntered.includes(digitsNational) || digitsEntered.includes(digitsNationalNoZero)) return true;

  if (digitsNoZero.length >= 4) {
    if (digitsCurrent.endsWith(digitsNoZero) || digitsNational.endsWith(digitsNoZero)) return true;
    if (digitsCurrent.includes(digitsNoZero) || digitsNational.includes(digitsNoZero)) return true;
  }

  return false;
}

/**
 * Authenticates an existing GHOST owner with userName (pseudo) & registered phone number.
 * Supports:
 * - Direct pseudo (e.g. "alex", "sarah")
 * - Google email (e.g. "user@example.com")
 * - Inverted inputs (phone in first field, pseudo in second)
 * - Flexible phone formats (+237..., 699..., etc.)
 */
export async function loginWithGhostCredentials(
  pseudoOrEmail: string,
  rawPhone: string
): Promise<GhostData> {
  let cleanInput = (pseudoOrEmail || '').trim();
  let phoneInput = (rawPhone || '').trim();

  // Inverted input check: if user entered phone into pseudo and pseudo into phone
  if (/^\+?[0-9\s.-]{6,}$/.test(cleanInput) && !/^\+?[0-9\s.-]{6,}$/.test(phoneInput)) {
    const temp = cleanInput;
    cleanInput = phoneInput;
    phoneInput = temp;
  }

  let matchedGhost: GhostData | null = null;
  let targetRef: any = null;
  let metaRef: any = null;

  // 1. Check if user typed an email address (e.g. user@example.com)
  if (cleanInput.includes('@') && cleanInput.includes('.')) {
    const emailToFind = cleanInput.toLowerCase();
    const q = query(collection(db, 'ghost_metadata'), where('ownerEmail', '==', emailToFind));
    const snap = await getDocs(q);
    if (!snap.empty) {
      for (const docSnap of snap.docs) {
        const metaData = docSnap.data();
        const pseudo = docSnap.id;
        const publicSnap = await getDoc(doc(db, 'ghosts', pseudo));
        if (publicSnap.exists()) {
          const publicData = publicSnap.data() as GhostData;
          if (isPhoneMatching(phoneInput, publicData)) {
            matchedGhost = { ...publicData, ownerUid: metaData.ownerUid, ownerEmail: metaData.ownerEmail };
            targetRef = publicSnap.ref;
            metaRef = docSnap.ref;
            break;
          }
        }
      }
      // If phone didn't match directly, but user is currently authenticated with this Google email
      if (!matchedGhost && auth.currentUser?.email?.toLowerCase() === emailToFind) {
        const firstMeta = snap.docs[0];
        const pseudo = firstMeta.id;
        const publicSnap = await getDoc(doc(db, 'ghosts', pseudo));
        if (publicSnap.exists()) {
          const publicData = publicSnap.data() as GhostData;
          matchedGhost = { ...publicData, ownerUid: firstMeta.data().ownerUid, ownerEmail: firstMeta.data().ownerEmail };
          targetRef = publicSnap.ref;
          metaRef = firstMeta.ref;
        }
      }
    }
  }

  // 2. Direct pseudo lookup
  if (!matchedGhost) {
    const normalizedPseudo = normalizePseudo(cleanInput);
    if (normalizedPseudo) {
      const publicSnap = await getDoc(doc(db, 'ghosts', normalizedPseudo));
      const metaSnap = await getDoc(doc(db, 'ghost_metadata', normalizedPseudo));
      if (publicSnap.exists() && metaSnap.exists()) {
        const publicData = publicSnap.data() as GhostData;
        const metaData = metaSnap.data();
        const fullData = { ...publicData, ownerUid: metaData.ownerUid, ownerEmail: metaData.ownerEmail };
        if (isPhoneMatching(phoneInput, publicData)) {
          matchedGhost = fullData;
          targetRef = publicSnap.ref;
          metaRef = metaSnap.ref;
        } else if (
          // If current Google user is the owner
          (auth.currentUser?.email && metaData.ownerEmail && auth.currentUser.email.toLowerCase() === metaData.ownerEmail.toLowerCase()) ||
          (auth.currentUser?.uid && auth.currentUser.uid === metaData.ownerUid)
        ) {
          matchedGhost = fullData;
          targetRef = publicSnap.ref;
          metaRef = metaSnap.ref;
        }
      }
    }
  }

  // 3. Fallback: Search all ghosts for phone match if pseudo was partial
  if (!matchedGhost) {
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length >= 6) {
      const allGhostsSnap = await getDocs(collection(db, 'ghosts'));
      for (const d of allGhostsSnap.docs) {
        const publicData = d.data() as GhostData;
        if (isPhoneMatching(phoneInput, publicData)) {
          const pseudoCheck = normalizePseudo(cleanInput);
          if (!pseudoCheck || publicData.pseudo.includes(pseudoCheck) || pseudoCheck.includes(publicData.pseudo)) {
            const mSnap = await getDoc(doc(db, 'ghost_metadata', d.id));
            if (mSnap.exists()) {
              const metaData = mSnap.data();
              matchedGhost = { ...publicData, ownerUid: metaData.ownerUid, ownerEmail: metaData.ownerEmail };
              targetRef = d.ref;
              metaRef = mSnap.ref;
              break;
            }
          }
        }
      }
    }
  }

  if (!matchedGhost || !targetRef || !metaRef) {
    throw new Error('Identifiants incorrects. Vérifiez votre pseudo et votre numéro de téléphone.');
  }

  // Authorize session for this pseudo
  setSessionAuthenticated(matchedGhost.pseudo);

  // If user is currently signed into Google, attach ownerUid and ownerEmail to ghost_metadata
  const currentUid = auth.currentUser?.uid;
  const currentEmail = auth.currentUser?.email;
  if (currentUid) {
    try {
      await updateDoc(metaRef, {
        ownerUid: currentUid,
        ...(currentEmail ? { ownerEmail: currentEmail } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not rebind Google account to ghost metadata:', e);
    }
  }

  return {
    ...matchedGhost,
    ownerUid: currentUid || matchedGhost.ownerUid,
    ownerEmail: currentEmail || matchedGhost.ownerEmail,
  };
}

/**
 * Finds ghosts belonging to an authenticated user
 */
export async function findGhostsByOwner(ownerUid: string, ownerEmail?: string | null): Promise<GhostData[]> {
  const ghosts: GhostData[] = [];
  try {
    const q1 = query(collection(db, 'ghost_metadata'), where('ownerUid', '==', ownerUid));
    const snap1 = await getDocs(q1);
    
    for (const metaDoc of snap1.docs) {
      const publicSnap = await getDoc(doc(db, 'ghosts', metaDoc.id));
      if (publicSnap.exists()) {
        const metaData = metaDoc.data();
        ghosts.push({ ...publicSnap.data(), ownerUid: metaData.ownerUid, ownerEmail: metaData.ownerEmail } as GhostData);
      }
    }

    if (ghosts.length === 0 && ownerEmail) {
      const q2 = query(collection(db, 'ghost_metadata'), where('ownerEmail', '==', ownerEmail));
      const snap2 = await getDocs(q2);
      for (const metaDoc of snap2.docs) {
        if (!ghosts.some((g) => g.pseudo === metaDoc.id)) {
          const publicSnap = await getDoc(doc(db, 'ghosts', metaDoc.id));
          if (publicSnap.exists()) {
            const metaData = metaDoc.data();
            ghosts.push({ ...publicSnap.data(), ownerUid: metaData.ownerUid, ownerEmail: metaData.ownerEmail } as GhostData);
          }
        }
      }
    }
  } catch (err) {
    console.error('findGhostsByOwner error:', err);
  }
  return ghosts;
}

/**
 * Updates GHOST phone number
 */
export async function updateGhostNumber(
  pseudo: string,
  params: {
    currentNumber: string;
    countryCode: string;
    nationalNumber: string;
  }
): Promise<void> {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);

  await updateDoc(ghostRef, {
    currentNumber: params.currentNumber,
    countryCode: params.countryCode,
    nationalNumber: params.nationalNumber,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Toggles GHOST status (isOnline)
 */
export async function updateGhostStatus(pseudo: string, isOnline: boolean): Promise<void> {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);

  await updateDoc(ghostRef, {
    isOnline,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a GHOST (owner only)
 */
export async function deleteGhost(pseudo: string): Promise<void> {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);
  const metaRef = doc(db, 'ghost_metadata', normalizedPseudo);
  
  await runTransaction(db, async (transaction) => {
    transaction.delete(ghostRef);
    transaction.delete(metaRef);
  });
}

/**
 * Subscribe to real-time updates of a GHOST
 */
export function subscribeToGhost(
  pseudo: string,
  callback: (ghost: GhostData | null, fromCache: boolean, hasPendingWrites: boolean) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);

  return onSnapshot(
    ghostRef,
    { includeMetadataChanges: true },
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null, docSnap.metadata.fromCache, docSnap.metadata.hasPendingWrites);
      } else {
        const data = docSnap.data() as GhostData;
        callback(data, docSnap.metadata.fromCache, docSnap.metadata.hasPendingWrites);
      }
    },
    (error) => {
      console.error('Firestore snapshot error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * One-time fetch of a Ghost document
 */
export async function fetchGhost(pseudo: string): Promise<{ data: GhostData | null; fromCache: boolean }> {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);
  const snap = await getDoc(ghostRef);
  if (!snap.exists()) {
    return { data: null, fromCache: snap.metadata.fromCache };
  }
  return { data: snap.data() as GhostData, fromCache: snap.metadata.fromCache };
}
