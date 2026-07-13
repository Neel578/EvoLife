import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

function AuthScreen({ setCurrentScreen }) {
  const [isLogin, setIsLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setCurrentScreen('welcome');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          fullName, username, age: Number(age), gender, email,
          createdAt: new Date()
        });

        setCurrentScreen('welcome');
      }
    } catch (err) {
      console.error(err);
      setError("Error: " + err.message.replace('Firebase:', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>

      <div className="card animate-fadeUp" style={{ width: '100%', maxWidth: '400px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{isLogin ? 'Welcome Back' : 'Start Your Journey'}</h2>
          <button
            onClick={() => setCurrentScreen('welcome')}
            className="icon-btn-touch"
            style={{ fontSize: '20px' }}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {error && <div style={{ color: '#ff4d4d', fontSize: '13px', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '5px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

          {!isLogin && (
            <>
              <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} autoComplete="name" />
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} autoComplete="username" />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="number" inputMode="numeric" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required style={{ ...inputStyle, flex: 1 }} min="1" max="120" />
                <select value={gender} onChange={(e) => setGender(e.target.value)} required style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </>
          )}

          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} autoComplete="email" inputMode="email" />
          <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} minLength="6" autoComplete={isLogin ? 'current-password' : 'new-password'} />

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px', justifyContent: 'center', minHeight: '48px' }}>
            {loading ? <i className="ri-loader-4-line spin"></i> : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span
            className="auth-toggle-link"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>

      </div>
    </div>
  );
}

// 16px font-size is required to prevent iOS zoom-on-focus
const inputStyle = {
  padding: '14px 15px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  backgroundColor: 'rgba(0,0,0,0.2)',
  color: '#fff',
  fontSize: '16px',
  outline: 'none',
  fontFamily: 'inherit'
};

export default AuthScreen;