import React from 'react';

/* ── Inline SVG icons ─────────────────────────────────────────────────── */
const icons = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 10h.01"/>
      <path d="M2 10h20"/>
    </svg>
  ),
  sparkles: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/>
      <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z"/>
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <path d="M8.5 14.5A5 5 0 0 0 17 11c0-3-3-5-3-5s.5 3-2 4.5c0 0 0-2-1.5-3.5C9 8.5 7 11 7 13a5 5 0 0 0 1.5 3.5"/>
      <path d="M12 21a5 5 0 0 0 5-5c0-2.5-2-4-2-4s.5 2-1 3.5C14 15.5 12 14 12 14s-2 1.5-2 3a5 5 0 0 0 2 4z"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
};

/* Each tab has its own accent color */
const TABS = [
  { id: 0, key: 'home',     icon: icons.home,     label: 'Home',     color: '#00d4ff', bg: 'rgba(0,212,255,0.12)'    }, // cyan
  { id: 1, key: 'wallet',   icon: icons.wallet,   label: 'Finance',  color: '#ffb800', bg: 'rgba(255,184,0,0.12)'    }, // amber
  { id: 2, key: 'sparkles', icon: icons.sparkles, label: 'Mental',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'  }, // purple
  { id: 3, key: 'flame',    icon: icons.flame,    label: 'Physical', color: '#ff4d6d', bg: 'rgba(255,77,109,0.12)'   }, // red
  { id: 4, key: 'globe',    icon: icons.globe,    label: 'Feed',     color: '#00e5a0', bg: 'rgba(0,229,160,0.12)'    }, // green
  { id: 5, key: 'user',     icon: icons.user,     label: 'Profile',  color: '#f472b6', bg: 'rgba(244,114,182,0.12)'  }, // pink
];

function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bnav" role="tablist" aria-label="Main navigation">
      <div className="bnav-inner">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={`bnav-tab${isActive ? ' bnav-tab--active' : ''}`}
              style={{
                color: tab.color,
                background: isActive ? tab.bg : 'transparent',
                opacity: isActive ? 1 : 0.45,
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span
                className="bnav-icon"
                style={isActive ? {
                  filter: `drop-shadow(0 0 8px ${tab.color}bb)`,
                  transform: 'translateY(-2px) scale(1.12)',
                } : {}}
              >
                {tab.icon}
              </span>
              {isActive && (
                <span
                  className="bnav-pip"
                  style={{ background: tab.color, boxShadow: `0 0 8px ${tab.color}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;

