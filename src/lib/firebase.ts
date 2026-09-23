import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInAnonymously, 
  linkWithPopup, 
  signInWithPopup,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  type Firestore
} from 'firebase/firestore';
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with persistent multi-tab offline cache
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, config.firestoreDatabaseId || '(default)');
} catch {
  db = getFirestore(app, config.firestoreDatabaseId || '(default)');
}

export { 
  app, 
  auth, 
  db, 
  googleProvider, 
  signInAnonymously, 
  linkWithPopup, 
  signInWithPopup, 
  onAuthStateChanged,
  type User 
};
