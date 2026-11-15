import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import ConfettiCanvas from './ConfettiCanvas';
import '../AuthScreen.css';

/* ── Google SVG Icon ─────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

const PRESET_AVATARS = ['⚡', '🦁', '🚀', '👑', '🔥', '🌟', '🐺', '🎯'];

export default function AuthScreen({ setCurrentScreen }) {
  // Modes: 'login' | 'signup'
  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(0); // 0: gateway, 1: name & creds, 2: username, 3: age, 4: gender, 5: avatar, 6: celebration
  const totalSteps = 5; // steps 1 to 5

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepSuccessMsg, setStepSuccessMsg] = useState('');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Username validation state
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameMsg, setUsernameMsg] = useState('');

  // Age & Gender
  const [age, setAge] = useState(22);
  const [gender, setGender] = useState('Male');

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState('⚡');
  const fileInputRef = useRef(null);

  // Celebration state
  const [createdUser, setCreatedUser] = useState(null);

  // Debounced Username Uniqueness Checker
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus('idle');
      setUsernameMsg('');
      return;
    }

    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (clean !== username.toLowerCase()) {
      setUsernameStatus('invalid');
      setUsernameMsg('Only letters, numbers, and underscores allowed');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMsg('Must be at least 3 characters');
      return;
    }

    if (clean.length > 20) {
      setUsernameStatus('invalid');
      setUsernameMsg('Cannot exceed 20 characters');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMsg('Checking availability…');

    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', clean));
        const snap = await getDocs(q);
        if (snap.empty) {
          setUsernameStatus('available');
          setUsernameMsg(`@${clean} is available!`);
        } else {
          setUsernameStatus('taken');
          setUsernameMsg(`@${clean} is already taken`);
        }
      } catch (err) {
        console.error('Username check error:', err);
        setUsernameStatus('available');
        setUsernameMsg(`@${clean}`);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username]);

  // Handle Google Sign-In
  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      const userRef = doc(db, 'users', gUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const baseUsername = (gUser.email ? gUser.email.split('@')[0] : 'user')
          .replace(/[^a-z0-9_]/g, '').slice(0, 15);
        const autoUsername = `${baseUsername}_${Math.floor(100 + Math.random() * 900)}`;

        await setDoc(userRef, {
          fullName: gUser.displayName || 'EvoLife Member',
          username: autoUsername,
          email: gUser.email || '',
          photoURL: gUser.photoURL || null,
          age: 24,
          gender: 'Other',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      setCurrentScreen('welcome');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message.replace('Firebase:', '').trim());
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentScreen('welcome');
    } catch (err) {
      console.error(err);
      setError(err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  // Handle image upload & crop
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarPreview(dataUrl);
        setSelectedPreset(null);
        setError('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Step 1: Submit Credentials & Full Name
  const handleStep1Next = (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setStepSuccessMsg('Account details set! 👍');
    setTimeout(() => {
      setStepSuccessMsg('');
      setStep(2);
    }, 450);
  };

  // Step 2: Submit Username
  const handleStep2Next = (e) => {
    e.preventDefault();
    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }
    setError('');
    setStep(3);
  };

  // Final Registration Step: Create user and save to Firestore
  const handleFinalizeSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const profileData = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        age: Number(age),
        gender,
        email: email.trim(),
        photoURL: avatarPreview || null,
        presetAvatar: selectedPreset || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', newUser.uid), profileData);

      setCreatedUser({
        ...profileData,
        uid: newUser.uid,
      });

      // Move to celebration step!
      setStep(6);
    } catch (err) {
      console.error(err);
      setError('Registration Error: ' + err.message.replace('Firebase:', '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Celebration Confetti ──────────────────────────────── */}
      {step === 6 && <ConfettiCanvas duration={6000} particleCount={110} />}

      <div className="auth-container animate-scaleIn">

        {/* ── Header & Stepper Navigation ──────────────────────── */}
        <div className="auth-header">
          {(!isLogin && step > 0 && step < 6) ? (
            <button
              className="auth-back-btn"
              onClick={() => { setError(''); setStep(s => s - 1); }}
              title="Go back"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
          ) : (
            <div style={{ width: 38 }} />
          )}

          {!isLogin && step > 0 && step < 6 ? (
            <div className="auth-progress-wrap">
              <div className="auth-progress-labels">
                <span className="current-step-text">Step {step} of {totalSteps}</span>
                <span>{Math.round((step / totalSteps) * 100)}%</span>
              </div>
              <div className="auth-progress-track">
                <div
                  className="auth-progress-bar"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          <button
            className="auth-close-btn"
            onClick={() => setCurrentScreen('welcome')}
            title="Close"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* ── Error Banner ─────────────────────────────────────── */}
        {error && (
          <div style={{
            color: 'var(--red, #ff4d6d)',
            fontSize: '13px',
            background: 'rgba(255, 77, 109, 0.12)',
            border: '1px solid rgba(255, 77, 109, 0.3)',
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="ri-error-warning-line" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Success Toast ────────────────────────────────────── */}
        {stepSuccessMsg && (
          <div className="step-success-toast" style={{ marginBottom: '14px' }}>
            <i className="ri-checkbox-circle-fill" /> {stepSuccessMsg}
          </div>
        )}

        {/* ========================================================
            LOGIN MODE
           ======================================================== */}
        {isLogin ? (
          <div className="auth-step-pane">
            <div>
              <h2 className="auth-step-title">Welcome Back</h2>
              <p className="auth-step-desc">Continue your evolution with EvoLife</p>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              className="btn-google"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider">or continue with email</div>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="ri-mail-line" /></span>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  inputMode="email"
                  required
                />
              </div>

              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="ri-lock-2-line" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ minHeight: '48px', marginTop: '6px' }}
              >
                {loading ? <i className="ri-loader-4-line spin" /> : 'Log In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--muted)' }}>
              Don't have an account?{' '}
              <span
                style={{ color: 'var(--cyan)', fontWeight: 700, cursor: 'pointer' }}
                onClick={() => { setError(''); setIsLogin(false); setStep(0); }}
              >
                Sign Up
              </span>
            </p>
          </div>
        ) : (
          /* ========================================================
              MULTI-STEP SIGN UP / ONBOARDING MODE
             ======================================================== */
          <>
            {/* ── Step 0: Gateway (Google Quick or Custom) ────────── */}
            {step === 0 && (
              <div className="auth-step-pane">
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🌱</div>
                  <h2 className="auth-step-title" style={{ fontSize: '1.7rem' }}>Start Your Journey</h2>
                  <p className="auth-step-desc">Build elite habits, wealth, and mind with EvoLife.</p>
                </div>

                <button
                  type="button"
                  className="btn-google"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  style={{ minHeight: '52px' }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <div className="auth-divider">or create custom profile</div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => { setError(''); setStep(1); }}
                  style={{ minHeight: '50px' }}
                >
                  <span>Start Step-by-Step Setup</span>
                  <i className="ri-arrow-right-line" />
                </button>

                <p style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--muted)', marginTop: '4px' }}>
                  Already have an account?{' '}
                  <span
                    style={{ color: 'var(--cyan)', fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => { setError(''); setIsLogin(true); }}
                  >
                    Log In
                  </span>
                </p>
              </div>
            )}

            {/* ── Step 1: Full Name & Account Credentials ───────── */}
            {step === 1 && (
              <div className="auth-step-pane">
                <div>
                  <h2 className="auth-step-title">What should we call you?</h2>
                  <p className="auth-step-desc">Enter your name and create your login credentials.</p>
                </div>

                <form onSubmit={handleStep1Next} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="auth-input-group">
                    <span className="auth-input-icon"><i className="ri-user-line" /></span>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Full Name"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      autoComplete="name"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon"><i className="ri-mail-line" /></span>
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      inputMode="email"
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <span className="auth-input-icon"><i className="ri-lock-2-line" /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Password (min 6 chars)"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      minLength={6}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ minHeight: '48px', marginTop: '10px' }}
                  >
                    <span>Continue</span>
                    <i className="ri-arrow-right-line" />
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 2: Unique Username ───────────────────────── */}
            {step === 2 && (
              <div className="auth-step-pane">
                <div>
                  <h2 className="auth-step-title">Pick your handle</h2>
                  <p className="auth-step-desc">Choose a unique username for your EvoLife identity.</p>
                </div>

                <form onSubmit={handleStep2Next} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div className="auth-input-group">
                      <span className="auth-input-icon"><i className="ri-at-line" /></span>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoComplete="username"
                        autoCapitalize="none"
                        autoFocus
                        required
                        style={{ paddingRight: '120px' }}
                      />

                      {/* Status badge */}
                      {usernameStatus === 'checking' && (
                        <span className="username-status-badge checking">
                          <i className="ri-loader-4-line spin" /> Checking…
                        </span>
                      )}
                      {usernameStatus === 'available' && (
                        <span className="username-status-badge available">
                          <i className="ri-checkbox-circle-fill" /> Available
                        </span>
                      )}
                      {usernameStatus === 'taken' && (
                        <span className="username-status-badge taken">
                          <i className="ri-close-circle-fill" /> Taken
                        </span>
                      )}
                    </div>

                    {usernameMsg && (
                      <div className={`username-helper-text ${
                        usernameStatus === 'available' ? 'success' :
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'error' : 'neutral'
                      }`}>
                        {usernameStatus === 'available' && <i className="ri-check-line" />}
                        {usernameStatus === 'taken' && <i className="ri-close-line" />}
                        {usernameMsg}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={usernameStatus !== 'available'}
                    style={{ minHeight: '48px', marginTop: '10px' }}
                  >
                    <span>Confirm Handle</span>
                    <i className="ri-arrow-right-line" />
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 3: Age Selection ─────────────────────────── */}
            {step === 3 && (
              <div className="auth-step-pane">
                <div>
                  <h2 className="auth-step-title">How old are you?</h2>
                  <p className="auth-step-desc">Helps us calibrate workout recommendations & metrics.</p>
                </div>

                <div className="age-selector-box">
                  <div className="age-display-bubble">
                    {age}
                    <span className="age-display-unit">Years</span>
                  </div>

                  <input
                    type="range"
                    min="12"
                    max="90"
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="custom-range-slider"
                    style={{ '--slider-pct': `${((age - 12) / (90 - 12)) * 100}%` }}
                  />

                  <div className="age-presets-row">
                    {[18, 21, 25, 30, 40].map(val => (
                      <button
                        key={val}
                        type="button"
                        className={`age-chip ${age === val ? 'active' : ''}`}
                        onClick={() => setAge(val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep(4)}
                  style={{ minHeight: '48px', marginTop: '6px' }}
                >
                  <span>Set Age ({age})</span>
                  <i className="ri-arrow-right-line" />
                </button>
              </div>
            )}

            {/* ── Step 4: Gender Selection ──────────────────────── */}
            {step === 4 && (
              <div className="auth-step-pane">
                <div>
                  <h2 className="auth-step-title">Select your gender</h2>
                  <p className="auth-step-desc">Personalizes physiological calculations.</p>
                </div>

                <div className="gender-cards-grid">
                  {[
                    { id: 'Male', label: 'Male', icon: 'ri-men-line', cls: 'male' },
                    { id: 'Female', label: 'Female', icon: 'ri-women-line', cls: 'female' },
                    { id: 'Other', label: 'Other', icon: 'ri-sparkles-line', cls: 'other' },
                  ].map(item => {
                    const isSelected = gender === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`gender-card ${item.cls} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setGender(item.id)}
                      >
                        {isSelected && <span className="gender-card-check">✓</span>}
                        <div className="gender-icon-bubble">
                          <i className={item.icon} />
                        </div>
                        <span className="gender-card-label">{item.label}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setStep(5)}
                  style={{ minHeight: '48px', marginTop: '10px' }}
                >
                  <span>Continue</span>
                  <i className="ri-arrow-right-line" />
                </button>
              </div>
            )}

            {/* ── Step 5: Profile Picture Upload ────────────────── */}
            {step === 5 && (
              <div className="auth-step-pane">
                <div>
                  <h2 className="auth-step-title">Choose your avatar</h2>
                  <p className="auth-step-desc">Upload a photo or pick a dynamic badge.</p>
                </div>

                <div className="avatar-onboarding-box">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />

                  {/* Circular preview */}
                  <div
                    className="avatar-preview-ring"
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload image"
                  >
                    <div className="avatar-preview-inner">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="avatar-preview-img"
                          style={{ transform: `scale(${avatarZoom})` }}
                        />
                      ) : (
                        <span style={{ fontSize: '2.5rem' }}>{selectedPreset}</span>
                      )}
                    </div>
                    <div className="avatar-upload-overlay">
                      <i className="ri-camera-fill" />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="avatar-actions-row">
                    <button
                      type="button"
                      className="btn-ghost btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="ri-upload-2-line" /> Upload Photo
                    </button>

                    {avatarPreview && (
                      <button
                        type="button"
                        className="btn-ghost btn-sm"
                        style={{ color: 'var(--red)' }}
                        onClick={() => { setAvatarPreview(null); setSelectedPreset('⚡'); }}
                      >
                        <i className="ri-delete-bin-line" /> Remove
                      </button>
                    )}
                  </div>

                  {/* Zoom slider if photo is uploaded */}
                  {avatarPreview && (
                    <div className="avatar-zoom-control animate-scaleIn">
                      <div className="avatar-zoom-header">
                        <span>Adjust Fit & Zoom</span>
                        <span>{Math.round(avatarZoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.05"
                        value={avatarZoom}
                        onChange={e => setAvatarZoom(Number(e.target.value))}
                        className="custom-range-slider"
                      />
                    </div>
                  )}

                  {/* Preset Avatars */}
                  <span className="preset-avatars-label">Or choose a preset</span>
                  <div className="preset-avatars-row">
                    {PRESET_AVATARS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className={`preset-avatar-btn ${selectedPreset === emoji && !avatarPreview ? 'selected' : ''}`}
                        onClick={() => { setSelectedPreset(emoji); setAvatarPreview(null); }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={loading}
                  onClick={handleFinalizeSignup}
                  style={{ minHeight: '50px', marginTop: '6px' }}
                >
                  {loading ? (
                    <i className="ri-loader-4-line spin" />
                  ) : (
                    <>
                      <span>Complete Profile</span>
                      <i className="ri-check-double-line" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Step 6: Celebration & Completion ──────────────── */}
            {step === 6 && (
              <div className="auth-step-pane celebration-pane animate-scaleIn">
                <div className="celebration-trophy-ring">
                  🏆
                </div>

                <div>
                  <h2 className="auth-step-title" style={{ fontSize: '1.65rem' }}>
                    Welcome to EvoLife! 🎉
                  </h2>
                  <p className="auth-step-desc">
                    Your profile has been created successfully. Your transformation begins now.
                  </p>
                </div>

                {/* Summary Card */}
                {createdUser && (
                  <div className="celebration-user-summary">
                    <div className="celebration-summary-avatar">
                      {createdUser.photoURL ? (
                        <img src={createdUser.photoURL} alt="Avatar" />
                      ) : (
                        <span>{createdUser.presetAvatar || createdUser.fullName?.[0] || '🌟'}</span>
                      )}
                    </div>
                    <div>
                      <div className="celebration-summary-name">{createdUser.fullName}</div>
                      <div className="celebration-summary-sub">@{createdUser.username}</div>
                      <div className="celebration-summary-meta">
                        {createdUser.age} yrs • {createdUser.gender}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setCurrentScreen('welcome')}
                  style={{ minHeight: '52px', width: '100%', marginTop: '12px' }}
                >
                  <span>Enter Dashboard</span>
                  <i className="ri-rocket-line" />
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
