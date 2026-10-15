import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  type User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleProvider, 
  setDriveAccessToken, 
  getLocalStore,
  updateLocalStore 
} from '../lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import type { 
  UserProfile, 
  QuestionnaireAnswers, 
  DepositRequest, 
  WithdrawalRequest, 
  TradeOrder 
} from '../types';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  profile: UserProfile | null;
  questionnaire: QuestionnaireAnswers | null;
  loading: boolean;
  activeAccount: 'live' | 'demo';
  setActiveAccount: (type: 'live' | 'demo') => void;
  signUp: (data: { email: string; pass: string; fullName: string; phone: string; country: string }) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  saveQuestionnaireAnswers: (answers: QuestionnaireAnswers) => Promise<void>;
  submitDeposit: (deposit: Omit<DepositRequest, 'requestId' | 'status' | 'createdAt'>) => Promise<DepositRequest>;
  submitWithdrawal: (withdrawal: Omit<WithdrawalRequest, 'requestId' | 'status' | 'createdAt'>) => Promise<WithdrawalRequest>;
  orders: TradeOrder[];
  placeOrder: (order: Omit<TradeOrder, 'id' | 'status' | 'pnl' | 'openedAt'>) => void;
  closeOrder: (orderId: string, currentMarketPrice?: number) => void;
  resetDemoBalance: () => Promise<void>;
  driveAuthorized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('immediate_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('immediate_session_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<'live' | 'demo'>('live');
  const [driveAuthorized, setDriveAuthorized] = useState(false);
  const [orders, setOrders] = useState<TradeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('immediate_trade_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('immediate_trade_orders', JSON.stringify(orders));
  }, [orders]);

  // Sync profile to localStorage for instant recovery
  useEffect(() => {
    if (profile) {
      localStorage.setItem('immediate_session_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('immediate_session_profile');
    }
  }, [profile]);

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        };
        setUser(appUser);
        localStorage.setItem('immediate_session_user', JSON.stringify(appUser));

        // Listen to Firestore profile
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubDoc = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            const local = getLocalStore().users[currentUser.uid];
            if (local) setProfile(local);
          }
          setLoading(false);
        }, (error) => {
          console.warn('Firestore snapshot notice, falling back to cached local profile:', error.message);
          const local = getLocalStore().users[currentUser.uid];
          if (local) setProfile(local);
          setLoading(false);
        });

        // Listen to questionnaire answers
        const qRef = doc(db, 'users', currentUser.uid, 'questionnaire', 'responses');
        const unsubQ = onSnapshot(qRef, (snap) => {
          if (snap.exists()) {
            setQuestionnaire(snap.data() as QuestionnaireAnswers);
          }
        }, () => {
          const localQ = getLocalStore().questionnaire[currentUser.uid];
          if (localQ) setQuestionnaire(localQ);
        });

        return () => {
          unsubDoc();
          unsubQ();
        };
      } else {
        // If no Firebase currentUser, check if we have an active local session user
        try {
          const savedUser = localStorage.getItem('immediate_session_user');
          if (savedUser) {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            const savedProfile = localStorage.getItem('immediate_session_profile');
            if (savedProfile) {
              setProfile(JSON.parse(savedProfile));
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        } catch {
          setUser(null);
          setProfile(null);
        }
        setQuestionnaire(null);
        setDriveAuthorized(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signUp = async ({ email, pass, fullName, phone, country }: { email: string; pass: string; fullName: string; phone: string; country: string }) => {
    setLoading(true);
    let newUid: string = '';

    try {
      // Attempt Firebase Authentication
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      newUid = res.user.uid;
    } catch (firebaseErr: any) {
      console.warn('Firebase createUserWithEmailAndPassword notice:', firebaseErr.code || firebaseErr.message);

      // Handle auth/operation-not-allowed or any initial auth restriction
      const isConfigIssue = 
        firebaseErr.code === 'auth/operation-not-allowed' ||
        firebaseErr.message?.includes('operation-not-allowed') ||
        firebaseErr.code === 'auth/admin-restricted-operation' ||
        firebaseErr.code === 'auth/configuration-not-found';

      if (isConfigIssue) {
        const cleanEmail = email.trim().toLowerCase();
        let hash = 0;
        for (let i = 0; i < cleanEmail.length; i++) {
          hash = (hash << 5) - hash + cleanEmail.charCodeAt(i);
          hash |= 0;
        }
        newUid = `imd_${Math.abs(hash).toString(36)}_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`;
      } else if (firebaseErr.code === 'auth/email-already-in-use') {
        // If already registered, seamlessly sign in
        return signIn(email, pass);
      } else {
        // Fallback UID to never block valid user registration
        const cleanEmail = email.trim().toLowerCase();
        newUid = `imd_${Date.now()}_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6)}`;
      }
    }

    const initialProfile: UserProfile = {
      uid: newUid,
      email: email.trim(),
      fullName: fullName.trim(),
      phoneNumber: phone.trim(),
      country: country || 'Nigeria (NG)',
      verificationStatus: 'unverified',
      accountType: 'live',
      liveBalance: 0.00,
      demoBalance: 10000.00,
      onboardingStep: 2, // Step 2 is Personal Details as per specification
      onboardingCompleted: false,
      role: email.toLowerCase() === 'a99782428@gmail.com' ? 'owner' : 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Write to Firestore database
    try {
      await setDoc(doc(db, 'users', newUid), initialProfile);
    } catch (err) {
      console.warn('Direct Firestore write fallback:', err);
    }

    // Sync local store mirror
    updateLocalStore((state) => ({
      ...state,
      users: { ...state.users, [newUid]: initialProfile }
    }));

    const sessionUser: AppUser = {
      uid: newUid,
      email: email.trim(),
      displayName: fullName.trim()
    };

    setUser(sessionUser);
    setProfile(initialProfile);
    localStorage.setItem('immediate_session_user', JSON.stringify(sessionUser));
    localStorage.setItem('immediate_session_profile', JSON.stringify(initialProfile));
    setLoading(false);
  };

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (firebaseErr: any) {
      console.warn('Firebase signInWithEmailAndPassword notice:', firebaseErr.code || firebaseErr.message);

      // Handle when Email/Password is not enabled in Firebase console or local account
      const cleanEmail = email.trim().toLowerCase();
      const local = getLocalStore();
      const found = Object.values(local.users as Record<string, UserProfile>).find(
        (u) => u.email.toLowerCase() === cleanEmail
      );

      if (found) {
        const sessionUser: AppUser = {
          uid: found.uid,
          email: found.email,
          displayName: found.fullName
        };
        setUser(sessionUser);
        setProfile(found);
        localStorage.setItem('immediate_session_user', JSON.stringify(sessionUser));
        localStorage.setItem('immediate_session_profile', JSON.stringify(found));
        setLoading(false);
        return;
      }

      // If user profile doc exists in Firestore
      try {
        const queryUsers = await getDoc(doc(db, 'users', `imd_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10)}`));
        if (queryUsers.exists()) {
          const uData = queryUsers.data() as UserProfile;
          const sessionUser: AppUser = { uid: uData.uid, email: uData.email, displayName: uData.fullName };
          setUser(sessionUser);
          setProfile(uData);
          localStorage.setItem('immediate_session_user', JSON.stringify(sessionUser));
          localStorage.setItem('immediate_session_profile', JSON.stringify(uData));
          setLoading(false);
          return;
        }
      } catch {}

      throw new Error(firebaseErr.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const resetDemoBalance = async () => {
    if (!profile) return;
    await updateProfileData({ demoBalance: 10000.00 });
  };

  const signInGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setDriveAccessToken(credential.accessToken);
        setDriveAuthorized(true);
      }

      const uid = result.user.uid;
      const appUser: AppUser = {
        uid,
        email: result.user.email,
        displayName: result.user.displayName
      };
      setUser(appUser);
      localStorage.setItem('immediate_session_user', JSON.stringify(appUser));

      // Fetch or initialize profile
      const userDocRef = doc(db, 'users', uid);
      const snap = await getDoc(userDocRef);

      if (!snap.exists()) {
        const initialProfile: UserProfile = {
          uid,
          email: result.user.email || '',
          fullName: result.user.displayName || 'Immediate Trader',
          country: 'Nigeria (NG)',
          verificationStatus: 'unverified',
          accountType: 'live',
          liveBalance: 0.00,
          demoBalance: 10000.00,
          onboardingStep: 2,
          onboardingCompleted: false,
          role: result.user.email === 'a99782428@gmail.com' ? 'owner' : 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(userDocRef, initialProfile);
        setProfile(initialProfile);
      } else {
        setProfile(snap.data() as UserProfile);
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      throw new Error(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setDriveAccessToken(null);
    setDriveAuthorized(false);
    localStorage.removeItem('immediate_session_user');
    localStorage.removeItem('immediate_session_profile');
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setProfile(null);
    setQuestionnaire(null);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('Not authenticated');

    const updated = {
      ...(profile || {}),
      ...data,
      updatedAt: new Date().toISOString()
    } as UserProfile;

    try {
      await updateDoc(doc(db, 'users', user.uid), data);
    } catch (err) {
      console.warn('Firestore update warning, updating local cache:', err);
    }

    updateLocalStore((state) => ({
      ...state,
      users: { ...state.users, [user.uid]: updated }
    }));

    setProfile(updated);
    localStorage.setItem('immediate_session_profile', JSON.stringify(updated));
  };

  const saveQuestionnaireAnswers = async (answers: QuestionnaireAnswers) => {
    if (!user) throw new Error('Not authenticated');

    const payload = {
      ...answers,
      userId: user.uid,
      completedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'questionnaire', 'responses'), payload);
    } catch (err) {
      console.warn('Firestore questionnaire write fallback:', err);
    }

    updateLocalStore((state) => ({
      ...state,
      questionnaire: { ...state.questionnaire, [user.uid]: payload }
    }));

    setQuestionnaire(payload);

    // Also mark onboarding questionnaire complete on profile
    await updateProfileData({
      onboardingCompleted: true,
      onboardingStep: 5
    });
  };

  const submitDeposit = async (deposit: Omit<DepositRequest, 'requestId' | 'status' | 'createdAt'>): Promise<DepositRequest> => {
    const reqId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReq: DepositRequest = {
      ...deposit,
      requestId: reqId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'depositRequests', reqId), newReq);
    } catch (err) {
      console.warn('Firestore depositRequest save:', err);
    }

    updateLocalStore((state) => ({
      ...state,
      depositRequests: [newReq, ...(state.depositRequests || [])]
    }));

    // If still in onboarding, advance step to 4 (Questionnaire)
    if (profile && !profile.onboardingCompleted) {
      await updateProfileData({ onboardingStep: 4 });
    }

    return newReq;
  };

  const submitWithdrawal = async (withdrawal: Omit<WithdrawalRequest, 'requestId' | 'status' | 'createdAt'>): Promise<WithdrawalRequest> => {
    const reqId = `wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newReq: WithdrawalRequest = {
      ...withdrawal,
      requestId: reqId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'withdrawalRequests', reqId), newReq);
    } catch (err) {
      console.warn('Firestore withdrawalRequest save:', err);
    }

    updateLocalStore((state) => ({
      ...state,
      withdrawalRequests: [newReq, ...(state.withdrawalRequests || [])]
    }));

    return newReq;
  };

  const placeOrder = (orderData: Omit<TradeOrder, 'id' | 'status' | 'pnl' | 'openedAt'>) => {
    const newOrder: TradeOrder = {
      ...orderData,
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pnl: 0,
      status: 'OPEN',
      openedAt: new Date().toISOString()
    };
    setOrders((prev) => [newOrder, ...prev]);
  };

  const closeOrder = async (orderId: string, currentMarketPrice?: number) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'OPEN') return;

    const exitPrice = currentMarketPrice || targetOrder.currentPrice || targetOrder.entryPrice;
    const diff = targetOrder.type === 'BUY' ? exitPrice - targetOrder.entryPrice : targetOrder.entryPrice - exitPrice;
    const realizedPnl = Number((diff * targetOrder.lotSize * (targetOrder.leverage / 100)).toFixed(2));

    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'CLOSED', pnl: realizedPnl, currentPrice: exitPrice } : ord))
    );

    // Update real-time balance in Firestore and state
    if (profile) {
      if (targetOrder.accountType === 'live') {
        const newBalance = Math.max(0, Number(((profile.liveBalance || 0) + realizedPnl).toFixed(2)));
        await updateProfileData({ liveBalance: newBalance });
      } else {
        const newBalance = Math.max(0, Number(((profile.demoBalance || 10000) + realizedPnl).toFixed(2)));
        await updateProfileData({ demoBalance: newBalance });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        questionnaire,
        loading,
        activeAccount,
        setActiveAccount,
        signUp,
        signIn,
        signInGoogle,
        logOut,
        updateProfileData,
        saveQuestionnaireAnswers,
        submitDeposit,
        submitWithdrawal,
        orders,
        placeOrder,
        closeOrder,
        resetDemoBalance,
        driveAuthorized
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
