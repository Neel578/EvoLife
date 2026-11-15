import React, { useState, useEffect, useMemo, useRef } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

const PRESET_AVATARS = ['⚡', '🦁', '🚀', '👑', '🔥', '🌟', '🐺', '🎯'];

/* ─── Edit Profile Modal ─────────────────────────────────────────────────── */
function EditProfileModal({ initial, onSave, onCancel, saving }) {
  const [fullName, setFullName] = useState(initial.fullName || '');
  const [username, setUsername] = useState(initial.username || '');
  const [age, setAge]           = useState(initial.age || 24);
  const [gender, setGender]     = useState(initial.gender || 'Male');
  const [photoURL, setPhotoURL] = useState(initial.photoURL || null);
  const [presetAvatar, setPresetAvatar] = useState(initial.presetAvatar || '⚡');
  const fileInputRef = useRef(null);

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState('available'); // 'available' | 'checking' | 'taken' | 'invalid'
  const [usernameMsg, setUsernameMsg]       = useState('');

  useEffect(() => {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const timer = setTimeout(async () => {
      if (!clean) {
        setUsernameStatus('invalid');
        setUsernameMsg('Username cannot be empty');
        return;
      }

      if (clean === initial.username?.toLowerCase()) {
        setUsernameStatus('available');
        setUsernameMsg('Current username');
        return;
      }

      if (clean.length < 3) {
        setUsernameStatus('invalid');
        setUsernameMsg('Must be at least 3 characters');
        return;
      }

      setUsernameStatus('checking');
      setUsernameMsg('Checking availability…');

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
        console.error(err);
        setUsernameStatus('available');
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, initial.username]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setPhotoURL(dataUrl);
        setPresetAvatar(null);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const canSave = fullName.trim() && username.trim() && usernameStatus === 'available' && age && gender;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onCancel}><i className="ri-close-line" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Avatar Edit ────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div
              className="pf-avatar-ring"
              style={{ width: 88, height: 88, cursor: 'pointer' }}
              onClick={() => fileInputRef.current?.click()}
              title="Click to change photo"
            >
              <div className="pf-avatar-inner" style={{ overflow: 'hidden' }}>
                {photoURL ? (
                  <img src={photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '2rem' }}>{presetAvatar || '⚡'}</span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="ri-camera-line" /> Change Photo
              </button>
              {photoURL && (
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  style={{ color: 'var(--red)' }}
                  onClick={() => { setPhotoURL(null); setPresetAvatar('⚡'); }}
                >
                  <i className="ri-delete-bin-line" /> Remove
                </button>
              )}
            </div>

            {/* Preset avatar emojis */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {PRESET_AVATARS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`preset-avatar-btn ${presetAvatar === emoji && !photoURL ? 'selected' : ''}`}
                  style={{ width: 34, height: 34, fontSize: '1.1rem' }}
                  onClick={() => { setPresetAvatar(emoji); setPhotoURL(null); }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* ── Name & Username ────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
            />

            <div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  style={{ paddingRight: '100px' }}
                />
                {usernameStatus === 'checking' && (
                  <span style={{ position: 'absolute', right: 12, fontSize: '0.78rem', color: 'var(--cyan)' }}>
                    <i className="ri-loader-4-line spin" /> Checking…
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span style={{ position: 'absolute', right: 12, fontSize: '0.78rem', color: 'var(--green)', fontWeight: 700 }}>
                    ✓ Available
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span style={{ position: 'absolute', right: 12, fontSize: '0.78rem', color: 'var(--red)', fontWeight: 700 }}>
                    ✕ Taken
                  </span>
                )}
              </div>
              {usernameMsg && (
                <div style={{
                  fontSize: '0.75rem',
                  marginTop: '4px',
                  color: usernameStatus === 'available' ? 'var(--green)' : usernameStatus === 'taken' ? 'var(--red)' : 'var(--muted)'
                }}>
                  {usernameMsg}
                </div>
              )}
            </div>
          </div>

          {/* ── Age Selection Slider ───────────────────────────── */}
          <div className="age-selector-box" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span className="label">Age</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--cyan)', fontSize: '1.2rem' }}>
                {age} yrs
              </span>
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
          </div>

          {/* ── Gender Selection ───────────────────────────────── */}
          <div>
            <span className="label" style={{ marginBottom: '8px', display: 'block' }}>Gender</span>
            <div className="gender-cards-grid" style={{ gap: '8px' }}>
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
                    style={{ padding: '12px 6px' }}
                    onClick={() => setGender(item.id)}
                  >
                    {isSelected && <span className="gender-card-check">✓</span>}
                    <div className="gender-icon-bubble" style={{ width: 34, height: 34, fontSize: '1.1rem' }}>
                      <i className={item.icon} />
                    </div>
                    <span className="gender-card-label" style={{ fontSize: '0.8rem' }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={!canSave || saving}
            onClick={() => onSave({
              fullName: fullName.trim(),
              username: username.trim().toLowerCase(),
              age: Number(age),
              gender,
              photoURL: photoURL || null,
              presetAvatar: presetAvatar || null
            })}
          >
            {saving ? <i className="ri-loader-4-line spin" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Confirm Modal ──────────────────────────────────────────────────────── */
function ConfirmModal({ title='Are you sure?', message, confirmLabel='Confirm', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}><i className="ri-close-line" /></button>
        </div>
        {message && <p style={{ color:'var(--muted)', marginBottom:'20px', fontSize:'0.9rem' }}>{message}</p>}
        <div style={{ display:'flex', gap:'10px' }}>
          <button className="btn-ghost" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
          <button className="btn-primary btn-red" style={{ flex:1 }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SVG Circular progress ring ─────────────────────────────────────────── */
function RingProgress({ pct=0, color='var(--cyan)', size=60, stroke=5 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', display:'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition:'stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)' }} />
    </svg>
  );
}


/* ─── Main Screen ────────────────────────────────────────────────────────── */
function ProfileScreen({ user, onAuthRequired }) {
  const [profile, setProfile]                     = useState(null);
  const [loading, setLoading]                     = useState(true);
  const [showEdit, setShowEdit]                   = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLight, setIsLight]                     = useState(() => document.body.classList.contains('light'));
  const [error, setError]                         = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!cancelled && snap.exists()) setProfile(snap.data());
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Couldn't load your profile details.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const stats = useMemo(() => {
    const taskHistory = JSON.parse(localStorage.getItem('evoLifeTaskHistory') || '{}');
    const habitsTotal = Object.values(taskHistory).reduce((a, b) => a + b, 0);
    let habitStreak = 0;
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (taskHistory[k] > 0) habitStreak++; else break;
    }
    const money      = JSON.parse(localStorage.getItem('evoLifeMoney') || '{"target":0,"transactions":[]}');
    const moneyTotal = money.transactions.reduce((s, t) => t.type==='expense' ? s-t.amount : s+t.amount, 0);
    const moneyPct   = money.target > 0 ? Math.min(100, Math.round((moneyTotal / money.target) * 100)) : 0;
    const learning   = JSON.parse(localStorage.getItem('evoLifeLearning') || '[]');
    const workout    = JSON.parse(localStorage.getItem('evoLifeWorkout_v2') || 'null');
    let workoutPct   = 0;
    if (workout) {
      const allEx  = workout.type==='section' ? workout.data.flatMap(s => s.exercises) : workout.data;
      const goal   = allEx.reduce((s, e) => s + (parseInt(e.goal)    || 0), 0);
      const current= allEx.reduce((s, e) => s + (parseInt(e.current) || 0), 0);
      workoutPct   = goal ? Math.round((current/goal)*100) : 0;
    }
    return { habitsTotal, habitStreak, moneyPct, moneyGoalSet:money.target>0, coursesCount:learning.length, workoutPct, hasWorkoutPlan:!!workout };
  }, []);

  const toggleTheme = () => { document.body.classList.toggle('light'); setIsLight(p => !p); };

  const handleLogout = async () => {
    try { await signOut(auth); }
    catch (err) { console.error(err); setError("Couldn't log out. Try again."); }
  };

  // Not logged in — show sign-in prompt
  if (!user) {
    return (
      <div className="screen">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'20px', textAlign:'center', padding:'0 24px' }}>
          <div style={{ fontSize:'4rem' }}>👤</div>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:800 }}>Your Profile</h2>
          <p style={{ color:'var(--muted)', fontSize:'0.9rem', maxWidth:'260px' }}>
            Sign in to view your stats, track your progress, and personalise your EvoLife journey.
          </p>
          <button className="btn-primary" style={{ maxWidth:'260px' }} onClick={onAuthRequired}>
            <i className="ri-login-box-line" /> Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (updates) => {
    setSaving(true); setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setProfile(prev => ({ ...prev, ...updates }));
      setShowEdit(false);
    } catch (err) { console.error(err); setError("Couldn't save changes. Try again."); }
    finally { setSaving(false); }
  };

  const initials = (profile?.fullName || user?.email || '?')
    .trim().split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');

  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('en-US', { month:'long', year:'numeric' })
    : null;

  /* Stat ring cards */
  const statCards = [
    { icon:'ri-fire-fill',           color:'var(--cyan)',   label:'Day Streak', value:stats.habitStreak,                              pct:Math.min(100, stats.habitStreak * 10) },
    { icon:'ri-checkbox-circle-fill',color:'var(--green)',  label:'Habits Done',value:stats.habitsTotal,                              pct:Math.min(100, stats.habitsTotal  * 5)  },
    { icon:'ri-run-line',            color:'var(--amber)',  label:'Workout',    value:stats.hasWorkoutPlan ? `${stats.workoutPct}%`:'—', pct:stats.workoutPct },
    { icon:'ri-book-read-line',      color:'var(--purple)', label:'Courses',   value:stats.coursesCount,                              pct:Math.min(100, stats.coursesCount * 20) },
  ];

  /* Account info rows */
  const infoRows = [
    { icon:'ri-user-3-line',   label:'Full Name', value: loading ? '—' : (profile?.fullName || '—') },
    { icon:'ri-at-line',       label:'Username',  value: loading ? '—' : (profile?.username ? `@${profile.username}` : '—') },
    { icon:'ri-cake-line',     label:'Age',       value: loading ? '—' : (profile?.age      || '—') },
    { icon:'ri-profile-line',  label:'Gender',    value: loading ? '—' : (profile?.gender   || '—') },
    { icon:'ri-mail-line',     label:'Email',     value: user?.email || profile?.email || '—', small: true },
  ];

  return (
    <div className="screen">
      <div className="app-wrap" style={{ maxWidth:'520px', paddingBottom:'40px' }}>

        {/* ── Hero card ────────────────────────────────────────────────── */}
        <div className="pf-hero animate-fadeUp">
          {/* Decorative banner */}
          <div className="pf-banner">
            <div className="pf-orb pf-orb-1" />
            <div className="pf-orb pf-orb-2" />
            <div className="pf-orb pf-orb-3" />
            <div className="pf-banner-grid" />
          </div>

          {/* Avatar */}
          <div className="pf-avatar-wrap">
            <div className="pf-avatar-ring">
              <div className="pf-avatar-inner" style={{ overflow: 'hidden' }}>
                {profile?.photoURL || user?.photoURL ? (
                  <img
                    src={profile?.photoURL || user?.photoURL}
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : profile?.presetAvatar ? (
                  <span style={{ fontSize: '2.4rem' }}>{profile.presetAvatar}</span>
                ) : (
                  initials || <i className="ri-user-smile-line" style={{ fontSize:'2rem' }} />
                )}
              </div>
            </div>
            <button className="pf-edit-fab" onClick={() => setShowEdit(true)} disabled={loading} title="Edit profile">
              <i className="ri-pencil-line" />
            </button>
          </div>

          {/* Identity */}
          <div className="pf-identity">
            {loading
              ? <div className="pf-skel pf-skel-name" />
              : <h2 className="pf-name">{profile?.fullName || 'EvoLife Member'}</h2>
            }
            {!loading && profile?.username && (
              <span className="pf-handle">@{profile.username}</span>
            )}
            <p className="pf-email">{user?.email}</p>
            {memberSince && (
              <p className="pf-since"><i className="ri-calendar-check-line" /> Member since {memberSince}</p>
            )}
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div style={{ color:'var(--red)', fontSize:'13px', background:'var(--red-dim)', padding:'10px 14px', borderRadius:'var(--radius-sm)', marginBottom:'16px' }}>
            {error}
          </div>
        )}

        {/* ── Progress ─────────────────────────────────────────────────── */}
        <div className="pf-section-title animate-fadeUp">
          <i className="ri-bar-chart-box-line" /> Your Progress
        </div>
        <div className="pf-stat-grid animate-fadeUp">
          {statCards.map((s, i) => (
            <div key={i} className="pf-stat-card" style={{ animationDelay:`${i*70}ms` }}>
              <div className="pf-ring-wrap">
                <RingProgress pct={s.pct} color={s.color} size={64} stroke={5} />
                <div className="pf-ring-icon" style={{ color:s.color }}>
                  <i className={s.icon} />
                </div>
              </div>
              <div className="pf-stat-val">{s.value}</div>
              <div className="pf-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Account Details ──────────────────────────────────────────── */}
        <div className="pf-section-title animate-fadeUp">
          <i className="ri-shield-user-line" /> Account Details
        </div>
        <div className="pf-info-card animate-fadeUp">
          {infoRows.map((row, i) => (
            <div key={i} className="pf-info-row" style={{ borderBottom: i < infoRows.length-1 ? '1px solid var(--glass-border)' : 'none' }}>
              <div className="pf-info-left">
                <span className="pf-info-ico"><i className={row.icon} /></span>
                <span className="pf-info-label">{row.label}</span>
              </div>
              <span className="pf-info-value" style={row.small ? { fontSize:'0.78rem', wordBreak:'break-all', textAlign:'right', maxWidth:'60%' } : {}}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <div className="pf-section-title animate-fadeUp">
          <i className="ri-settings-3-line" /> Preferences
        </div>
        <div className="pf-info-card animate-fadeUp">
          <div className="pf-info-row" style={{ borderBottom:'none' }}>
            <div className="pf-info-left">
              <span className="pf-info-ico"><i className={isLight ? 'ri-sun-line' : 'ri-moon-line'} /></span>
              <span className="pf-info-label">{isLight ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <button className="pf-toggle" data-on={isLight} onClick={toggleTheme} aria-label="Toggle theme">
              <span className="pf-toggle-knob" />
            </button>
          </div>
        </div>

        {/* ── Logout ───────────────────────────────────────────────────── */}
        <button className="pf-logout animate-fadeUp" onClick={() => setShowLogoutConfirm(true)}>
          <i className="ri-logout-box-r-line" /> Log Out
        </button>

      </div>

      {showEdit && (
        <EditProfileModal initial={profile||{}} saving={saving}
          onCancel={() => setShowEdit(false)} onSave={handleSaveProfile} />
      )}
      {showLogoutConfirm && (
        <ConfirmModal title="Log out?"
          message="You'll need to sign back in to access your account."
          confirmLabel="Log Out" onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)} />
      )}
    </div>
  );
}

export default ProfileScreen;