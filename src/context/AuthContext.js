import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, authAPI } from '../../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});
export const useAuth = () => useContext(AuthContext);

const AUTH_KEY = '@kita_log_auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const accountInfo = await authAPI.getAccountInfo(parsed.idToken);
          if (accountInfo.users?.length > 0) {
            const firebaseUser = accountInfo.users[0];
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.localId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            setUser({
              uid: firebaseUser.localId,
              email: firebaseUser.email,
              idToken: parsed.idToken,
              refreshToken: parsed.refreshToken,
              ...userData,
            });
          }
        }
      } catch (e) {
        await AsyncStorage.removeItem(AUTH_KEY);
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const register = async (email, password, username, companyName, businessType) => {
    const authData = await authAPI.signUp(email, password);
    const uid = authData.localId;
    await setDoc(doc(db, 'users', uid), {
      username, email, company_name: companyName, business_type: businessType,
      created_at: new Date().toISOString(),
    });
    await setDoc(doc(db, 'user_settings', uid), {
      currency_symbol: '₱', date_format: 'MM/DD/YYYY', theme: 'light',
    });
    const userData = { uid, email, username, company_name: companyName, business_type: businessType };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
    }));
    setUser({ ...userData, idToken: authData.idToken, refreshToken: authData.refreshToken });
  };

  const login = async (email, password) => {
    const authData = await authAPI.signIn(email, password);
    const uid = authData.localId;
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.exists() ? userDoc.data() : { email };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
    }));
    setUser({ uid, email, idToken: authData.idToken, refreshToken: authData.refreshToken, ...userData });
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};