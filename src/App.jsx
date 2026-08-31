import { useState, useEffect, useRef } from 'react'
import './App.css'
import './ProfileScreen.additions.css'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { App as CapacitorApp } from '@capacitor/app'

import AppShell   from './components/AppShell'
import AuthScreen from './components/AuthScreen'

function App() {
  const [user, setUser]               = useState(undefined) // undefined = loading
  const [showAuth, setShowAuth]       = useState(false)
  const shellRef                      = useRef(null)        // ref to AppShell's setActiveTab

  // Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  // Hardware back button — navigate to home tab; exit if already on home
  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', () => {
      if (shellRef.current) {
        shellRef.current.goHome();
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => { listener.then(l => l.remove()); };
  }, []);

  // Still loading Firebase auth state
  if (user === undefined) return null;

  // Auth screen requested (from Profile tab "Sign In" or direct)
  if (showAuth) {
    return (
      <AuthScreen
        setCurrentScreen={(screen) => {
          // After login success AuthScreen calls setCurrentScreen('welcome')
          if (screen === 'welcome') setShowAuth(false);
        }}
      />
    );
  }

  return (
    <AppShell
      user={user}
      shellRef={shellRef}
      onAuthRequired={() => setShowAuth(true)}
    />
  );
}

export default App