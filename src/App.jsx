import { useState, useEffect, useRef } from 'react'
import './App.css'
import './ProfileScreen.additions.css'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { App as CapacitorApp } from '@capacitor/app'

import AppShell   from './components/AppShell'
import AuthScreen from './components/AuthScreen'
import { initNotificationSystem, rescheduleAllAlarms } from './utils/notificationService'

function App() {
  /** @type {[any, React.Dispatch<any>]} */
  const [user, setUser]               = useState(undefined) // undefined = loading
  const [showAuth, setShowAuth]       = useState(false)
  /** @type {React.MutableRefObject<any>} */
  const shellRef                      = useRef(null)        // ref to AppShell's setActiveTab

  // Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  // Initialize Native Notifications & restore alarms
  useEffect(() => {
    initNotificationSystem();
    try {
      const saved = localStorage.getItem('evoLifeTasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        rescheduleAllAlarms(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Hardware back button — navigate to home tab; exit if already on home
  useEffect(() => {
    let removeListener = null;
    CapacitorApp.addListener('backButton', () => {
      if (shellRef.current && typeof shellRef.current.goHome === 'function') {
        shellRef.current.goHome();
      } else {
        CapacitorApp.exitApp();
      }
    }).then((l) => {
      removeListener = () => {
        if (l && typeof l.remove === 'function') l.remove();
      };
    }).catch(() => {});

    return () => {
      if (removeListener) removeListener();
    };
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