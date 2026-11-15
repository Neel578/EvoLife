import React, { useState, useImperativeHandle } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import BottomNav from './BottomNav';
import WelcomeScreen from './WelcomeScreen';
import MoneyApp from './MoneyApp';
import LearningApp from './LearningApp';
import WorkoutApp from './WorkoutApp';
import FeedTab from './FeedTab';
import ProfileScreen from './ProfileScreen';
import AnalyticsApp from './AnalyticsApp';

/* AppShell — persistent layout shell with bottom nav.
   Tabs are always mounted (display toggled) so each tab keeps its state
   alive when switching between tabs. */
function AppShell({ user, onAuthRequired, shellRef }) {
  const [activeTab, setActiveTab]         = useState(0);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Expose goHome() to parent (App.jsx) for Android back button
  useImperativeHandle(shellRef, () => ({
    goHome: () => {
      if (analyticsOpen) { setAnalyticsOpen(false); return; }
      if (activeTab !== 0) { setActiveTab(0); }
      else { CapacitorApp.exitApp(); }
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
            openAnalytics={() => setAnalyticsOpen(true)}
          />
        </div>

        <div style={tabStyle(1)}><MoneyApp /></div>
        <div style={tabStyle(2)}><LearningApp /></div>
        <div style={tabStyle(3)}><WorkoutApp /></div>
        <div style={tabStyle(4)}><FeedTab /></div>

        <div style={tabStyle(5)}>
          <ProfileScreen user={user} onAuthRequired={onAuthRequired} />
        </div>

      </div>

      {/* ── Analytics overlay (slide up from bottom) ─────────────── */}
      {analyticsOpen && (
        <div className="analytics-overlay">
          <div className="analytics-overlay-header">
            <button
              className="back-btn"
              onClick={() => setAnalyticsOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
              Back
            </button>
          </div>
          <div className="analytics-overlay-body">
            <AnalyticsApp />
          </div>
        </div>
      )}

      {/* ── Bottom navigation ────────────────────────────────────── */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default AppShell;

