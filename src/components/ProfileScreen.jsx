import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

function ProfileScreen({ setCurrentScreen, user }) {
  
  const handleLogout = async () => {
    try {
      await signOut(auth); // Tells Firebase to log the user out
      setCurrentScreen('welcome'); // Sends you back to the home screen
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="screen" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      
      <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '400px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setCurrentScreen('welcome')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '24px' }}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Big User Icon */}
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          backgroundColor: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          fontSize: '40px', marginBottom: '10px' 
        }}>
          <i className="ri-user-smile-line"></i>
        </div>

        <h2>My Account</h2>
        
        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '12px' }}>LOGGED IN AS</p>
          <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            {user?.email}
          </p>
        </div>

        <button 
          onClick={handleLogout} 
          style={{ 
            marginTop: '20px', width: '100%', padding: '15px', 
            borderRadius: '8px', backgroundColor: 'rgba(255, 77, 77, 0.1)', 
            color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.3)', 
            cursor: 'pointer', fontSize: '16px', fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)'}
        >
          <i className="ri-logout-box-r-line" style={{ marginRight: '8px' }}></i>
          Log Out
        </button>

      </div>
    </div>
  );
}

export default ProfileScreen;