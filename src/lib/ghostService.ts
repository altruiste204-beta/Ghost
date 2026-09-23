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
import { db, auth, signInAnonymously } from './firebase';

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

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errCode = error?.code || 'unknown';
  const errMsg = error?.message || String(error);
  
  const errInfo = {
    code: errCode,
    message: errMsg,
    operationType,
    path,
    auth: {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      isAnonymous: auth.currentUser?.isAnonymous
    }
  };

  console.error('[GHOST Firestore Error]', errInfo);

  if (errCode === 'permission-denied') {
    throw new Error(`Accès refusé (${operationType} sur ${path}). Vérifiez que vous êtes bien le propriétaire de ce GHOST.`);
  }
  
  throw new Error(`Erreur de connexion à la base de données : ${errMsg}`);
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

  try {
    const docSnap = await getDoc(ghostRef);
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
      localUid: ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const privateData = {
      ownerUid,
      ...(ownerEmail ? { ownerEmail } : {}),
      updatedAt: serverTimestamp(),
    };

    await Promise.all([
      setDoc(ghostRef, publicData),
      setDoc(metaRef, privateData)
    ]);

    resultData = {
      ...publicData,
      ownerUid,
      ownerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as GhostData;
  } catch (error: any) {
    if (error.code === 'ALREADY_EXISTS' || error.message?.includes("n'est pas disponible")) throw error;
    handleFirestoreError(error, OperationType.WRITE, `ghosts/${normalizedPseudo}`);
  }

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
  // Ensure the user is authenticated (at least anonymously) so they have a valid auth state
  await ensureAuthUser();

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
    throw new Error("Pour vous connecter avec votre adresse e-mail, veuillez cliquer sur le bouton 'Se connecter avec Google' ci-dessous.");
  }

  // 2. Direct pseudo lookup
  let pseudoExistsButPhoneMismatch = false;
  let matchedGhostPhoneTail = '';
  if (!matchedGhost) {
    const normalizedPseudo = normalizePseudo(cleanInput);
    if (normalizedPseudo) {
      try {
        const publicSnap = await getDoc(doc(db, 'ghosts', normalizedPseudo));
        if (publicSnap.exists()) {
          const publicData = publicSnap.data() as GhostData;
          matchedGhostPhoneTail = publicData.currentNumber || publicData.nationalNumber || '';
          const mRef = doc(db, 'ghost_metadata', normalizedPseudo);
          
          let metaOwnerUid: string = '';
          let metaOwnerEmail: string | null = null;
          
          try {
            const metaSnap = await getDoc(mRef);
            if (metaSnap.exists()) {
              const metaData = metaSnap.data();
              metaOwnerUid = metaData.ownerUid || '';
              metaOwnerEmail = metaData.ownerEmail || null;
            }
          } catch (e) {
            console.log("Metadata read restricted, using deterministic fallback reference:", e);
          }

          const fullData: GhostData = { ...publicData, ownerUid: metaOwnerUid, ownerEmail: metaOwnerEmail };
          
          if (isPhoneMatching(phoneInput, publicData)) {
            matchedGhost = fullData;
            targetRef = publicSnap.ref;
            metaRef = mRef;
          } else if (
            // If current Google user is the owner
            (auth.currentUser?.email && metaOwnerEmail && auth.currentUser.email.toLowerCase() === metaOwnerEmail.toLowerCase()) ||
            (auth.currentUser?.uid && auth.currentUser.uid === metaOwnerUid)
          ) {
            matchedGhost = fullData;
            targetRef = publicSnap.ref;
            metaRef = mRef;
          } else {
            pseudoExistsButPhoneMismatch = true;
          }
        }
      } catch (error) {
        console.warn('Pseudo lookup restricted:', error);
      }
    }
  }

  // 3. Fallback: Search all ghosts for phone match if pseudo was partial
  if (!matchedGhost) {
    const digits = phoneInput.replace(/\D/g, '');
    if (digits.length >= 6) {
      try {
        const allGhostsSnap = await getDocs(collection(db, 'ghosts'));
        for (const d of allGhostsSnap.docs) {
          const publicData = d.data() as GhostData;
          if (isPhoneMatching(phoneInput, publicData)) {
            const pseudoCheck = normalizePseudo(cleanInput);
            if (!pseudoCheck || publicData.pseudo.includes(pseudoCheck) || pseudoCheck.includes(publicData.pseudo)) {
              const mRef = doc(db, 'ghost_metadata', d.id);
              let metaOwnerUid: string = '';
              let metaOwnerEmail: string | null = null;
              
              try {
                const mSnap = await getDoc(mRef);
                if (mSnap.exists()) {
                  const metaData = mSnap.data();
                  metaOwnerUid = metaData.ownerUid || '';
                  metaOwnerEmail = metaData.ownerEmail || null;
                }
              } catch (e) {
                console.log("Metadata fallback lookup restricted:", e);
              }

              matchedGhost = { ...publicData, ownerUid: metaOwnerUid, ownerEmail: metaOwnerEmail };
              targetRef = d.ref;
              metaRef = mRef;
              break;
            }
          }
        }
      } catch (error) {
        console.warn('Global fallback search restricted:', error);
      }
    }
  }

  if (!matchedGhost || !targetRef || !metaRef) {
    if (pseudoExistsButPhoneMismatch) {
      const lastDigits = (matchedGhostPhoneTail || '').replace(/\D/g, '').slice(-2);
      const maskedHelp = lastDigits ? ` (le numéro enregistré se termine par ...${lastDigits})` : '';
      throw new Error(`Le numéro de téléphone saisi ne correspond pas à celui enregistré pour le pseudo @${normalizePseudo(cleanInput)}${maskedHelp}.`);
    }
    const normalizedPseudo = normalizePseudo(cleanInput);
    const isEmail = cleanInput.includes('@') && cleanInput.includes('.');
    if (normalizedPseudo && !isEmail) {
      throw new Error(`Le pseudo @${normalizedPseudo} n'existe pas.`);
    }
    throw new Error('Identifiants incorrects. Vérifiez votre pseudo et votre numéro de téléphone.');
  }

  // Authorize session for this pseudo
  setSessionAuthenticated(matchedGhost.pseudo);

  // If user is currently signed in or has a persistent UID, attach ownerUid to ghost_metadata and localUid to ghosts
  const currentUid = await ensureAuthUser();
  if (currentUid) {
    try {
      await updateDoc(metaRef, {
        ownerUid: currentUid,
        updatedAt: serverTimestamp(),
        verificationPhone: matchedGhost.currentNumber, // Satisfy Firestore rules verification check
      });
    } catch (error) {
      console.warn('Could not update ownerUid in ghost metadata:', error);
    }

    try {
      // Re-bind ownership on the public ghost document directly using verificationPhone proof
      await updateDoc(targetRef, {
        localUid: currentUid,
        verificationPhone: matchedGhost.currentNumber,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('Could not update localUid in ghost document:', error);
    }
  }

  return {
    ...matchedGhost,
    ownerUid: currentUid || matchedGhost.ownerUid,
    ownerEmail: null,
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
  } catch (error) {
    console.error('findGhostsByOwner error:', error);
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

  const localUid = await ensureAuthUser();

  try {
    await updateDoc(ghostRef, {
      currentNumber: params.currentNumber,
      countryCode: params.countryCode,
      nationalNumber: params.nationalNumber,
      localUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ghosts/${normalizedPseudo}`);
  }
}

/**
 * Toggles GHOST status (isOnline)
 */
export async function updateGhostStatus(pseudo: string, isOnline: boolean): Promise<void> {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);

  const localUid = await ensureAuthUser();

  try {
    await updateDoc(ghostRef, {
      isOnline,
      localUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ghosts/${normalizedPseudo}`);
  }
}

/**
 * Deletes a GHOST (owner only)
 */
export async function deleteGhost(pseudo: string): Promise<void> {
  const normalizedPseudo = normalizePseudo(pseudo);
  const ghostRef = doc(db, 'ghosts', normalizedPseudo);
  const metaRef = doc(db, 'ghost_metadata', normalizedPseudo);
  
  try {
    await runTransaction(db, async (transaction) => {
      transaction.delete(ghostRef);
      transaction.delete(metaRef);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `ghosts/${normalizedPseudo}`);
  }
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
      console.warn('Snapshot subscription error (non-critical):', error);
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
  try {
    const snap = await getDoc(ghostRef);
    if (!snap.exists()) {
      return { data: null, fromCache: snap.metadata.fromCache };
    }
    return { data: snap.data() as GhostData, fromCache: snap.metadata.fromCache };
  } catch (error) {
    console.warn('One-time fetch restricted:', error);
    return { data: null, fromCache: false };
  }
}
