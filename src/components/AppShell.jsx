import React, { useState, useImperativeHandle } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import BottomNav from './BottomNav';
import WelcomeScreen from './WelcomeScreen';
import MoneyApp from './MoneyApp';
import LearningApp from './LearningApp';
import WorkoutApp from './WorkoutApp';
import FeedTab from './FeedTab';
import ProfileScreen from './ProfileScreen';

/* AppShell — persistent layout shell with bottom nav.
   Tabs are always mounted (display toggled) so each tab keeps its state
   alive when switching between tabs. */
function AppShell({ user, onAuthRequired, shellRef }) {
  const [activeTab, setActiveTab] = useState(0);

  // Expose goHome() to parent (App.jsx) for Android back button
  useImperativeHandle(shellRef, () => ({
    goHome: () => {
      if (activeTab !== 0) {
        setActiveTab(0);
      } else {
        // Already on home — exit app
        CapacitorApp.exitApp();
      }
    },
  }));


  const tabStyle = (idx) => ({
    display: activeTab === idx ? 'block' : 'none',
  });

  return (
    <div className="shell">
      {/* ── Tab content area ─────────────────────────────────────── */}
      <div className="shell-content">

        <div style={tabStyle(0)}>
          <WelcomeScreen
            user={user}
            setActiveTab={setActiveTab}
          />
        </div>

        <div style={tabStyle(1)}>
          <MoneyApp />
        </div>

        <div style={tabStyle(2)}>
          <LearningApp />
        </div>

        <div style={tabStyle(3)}>
          <WorkoutApp />
        </div>

        <div style={tabStyle(4)}>
          <FeedTab />
        </div>

        <div style={tabStyle(5)}>
          <ProfileScreen
            user={user}
            onAuthRequired={onAuthRequired}
          />
        </div>

      </div>

      {/* ── Bottom navigation ────────────────────────────────────── */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default AppShell;
