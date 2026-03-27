import { useState, useEffect } from 'react'
import './App.css'
import { auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
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