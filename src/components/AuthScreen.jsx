import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Importing the connection we just made!
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function AuthScreen({ setCurrentScreen }) {
  // Toggle between Login and Sign Up mode
  const [isLogin, setIsLogin] = useState(false); 
  const [error, setError] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // --- LOG IN EXISITING USER ---
        await signInWithEmailAndPassword(auth, email, password);
        setCurrentScreen('welcome'); // Send back to home on success
      } else {
        // --- CREATE NEW USER ---
        // 1. Create account in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Save custom details to Firestore Database
        await setDoc(doc(db, "users", user.uid), {
          fullName: fullName,
          username: username,
          age: Number(age), // Save age as a number
          gender: gender,
          email: email,
          createdAt: new Date()
        });

        setCurrentScreen('welcome'); // Send back to home on success
      }
    } catch (err) {
      console.error(err);
      // Firebase throws errors like "auth/email-already-in-use", we can display them
      setError("Error: " + err.message.replace('Firebase:', '')); 
    }
  };

  return (
    <div className="screen" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      
      <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '400px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{isLogin ? 'Welcome Back' : 'Start Your Journey'}</h2>
          <button onClick={() => setCurrentScreen('welcome')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        {error && <div style={{ color: '#ff4d4d', fontSize: '13px', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '5px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* ONLY show these fields if they are Signing Up */}
          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required style={{ ...inputStyle, flex: 1 }} min="1" max="120" />
                <select value={gender} onChange={(e) => setGender(e.target.value)} required style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </>
          )}

          {/* Always show Email and Password */}
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} minLength="6" />

          <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
            {isLogin ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: 'var(--cyan)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>

      </div>
    </div>
  );
}

// Basic inline styling for the inputs to match your dark theme
const inputStyle = {
  padding: '12px 15px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(0,0,0,0.2)',
  color: '#fff',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit'
};

export default AuthScreen;