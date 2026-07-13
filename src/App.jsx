import { useState, useEffect } from 'react'
import './App.css'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { App as CapacitorApp } from '@capacitor/app'

import WelcomeScreen from './components/WelcomeScreen'
import DailyFocus from './components/DailyFocus'
import MoneyApp from './components/MoneyApp'
import LearningApp from './components/LearningApp'
import WorkoutApp from './components/WorkoutApp'
import AnalyticsApp from './components/AnalyticsApp'
import AuthScreen from './components/AuthScreen'
import ProfileScreen from './components/ProfileScreen'

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome')
  const [user, setUser] = useState(null)

  // Firebase Auth Setup
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Hardware Back Button Setup
  useEffect(() => {
    // We attach the listener ONLY once now
    const backButtonListener = CapacitorApp.addListener('backButton', () => {
      
      // We use prevScreen to safely check the current state without needing it in the dependency array
      setCurrentScreen((prevScreen) => {
        if (prevScreen === 'welcome') {
          // If we are already on the welcome screen, close the app natively
          CapacitorApp.exitApp();
          return prevScreen; 
        } else {
          // If we are in any other app/screen, take us back to the home screen
          return 'welcome';
        }
      });
      
    });

    // Cleanup the listener when the app fully closes
    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, []); 

  return (
    <>
      {currentScreen === 'welcome' && (
        <WelcomeScreen setCurrentScreen={setCurrentScreen} user={user} />
      )}

      {currentScreen === 'authScreen' && (
        <AuthScreen setCurrentScreen={setCurrentScreen} />
      )}

      {currentScreen === 'profileScreen' && (
        <ProfileScreen setCurrentScreen={setCurrentScreen} user={user} />
      )}

      {currentScreen === 'analyticsApp' && (
        <AnalyticsApp setCurrentScreen={setCurrentScreen} />
      )}

      {currentScreen === 'mainApp' && (
        <DailyFocus setCurrentScreen={setCurrentScreen} />
      )}

      {currentScreen === 'moneyApp' && (
        <MoneyApp setCurrentScreen={setCurrentScreen} />
      )}
      
      {currentScreen === 'learningApp' && (
        <LearningApp setCurrentScreen={setCurrentScreen} />
      )}
      
      {currentScreen === 'workoutApp' && (
        <WorkoutApp setCurrentScreen={setCurrentScreen} />
      )}
    </>
  )
}

export default App