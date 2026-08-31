import React from 'react';

function FeedTab() {
  return (
    <div className="screen feed-placeholder">
      <div className="feed-placeholder-inner">
        {/* Globe icon */}
        <div className="feed-placeholder-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" width="64" height="64">
            <circle cx="12" cy="12" r="10"/>
            <path d="M2 12h20"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
          </svg>
        </div>
        <h2 className="feed-placeholder-title">Public Feed</h2>
        <p className="feed-placeholder-sub">
          Share your progress, celebrate streaks, and connect with the EvoLife community.
        </p>
        <span className="feed-placeholder-badge">Coming Soon</span>
      </div>
    </div>
  );
}

export default FeedTab;
