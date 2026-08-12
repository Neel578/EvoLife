import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Small edit modal — matches the PromptModal/ConfirmModal pattern used
// everywhere else in the app (LearningApp, MoneyApp, WorkoutApp).
function EditProfileModal({ initial, onSave, onCancel, saving }) {
  const [fullName, setFullName] = useState(initial.fullName || '');
  const [username, setUsername] = useState(initial.username || '');
  const [age, setAge] = useState(initial.age || '');
  const [gender, setGender] = useState(initial.gender || '');

  const canSave = fullName.trim() && username.trim() && age && gender;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button className="modal-close" onClick={onCancel}><i className="ri-close-line"></i></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text" placeholder="Full Name" value={fullName}
            onChange={e => setFullName(e.target.value)} autoComplete="name"
          />
          <input
            type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} autoComplete="username"
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number" inputMode="numeric" placeholder="Age" value={age}
              onChange={e => setAge(e.target.value)} min="1" max="120"
              style={{ flex: 1 }}
            />
            <select value={gender} onChange={e => setGender(e.target.value)} style={{ flex: 1, cursor: 'pointer' }}>
              <option value="" disabled>Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel} disabled={saving}>Cancel</button>
          <button
            className="btn-primary" style={{ flex: 1 }}
            disabled={!canSave || saving}
            onClick={() => onSave({ fullName: fullName.trim(), username: username.trim(), age: Number(age), gender })}
          >
            {saving ? <i className="ri-loader-4-line spin"></i> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}><i className="ri-close-line"></i></button>
        </div>
        {message && <p style={{ color: 'var(--muted)', marginBottom: '20px', fontSize: '0.9rem' }}>{message}</p>}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn-primary btn-red" style={{ flex: 1 }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ setCurrentScreen, user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light'));
  const [error, setError] = useState('');

  // Pull the Firestore profile doc created at signup (AuthScreen writes this)
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

  // Local, cross-app stats — read once on mount, purely for the summary cards
  const stats = useMemo(() => {
    const taskHistory = JSON.parse(localStorage.getItem('evoLifeTaskHistory') || '{}');
    const habitsTotal = Object.values(taskHistory).reduce((a, b) => a + b, 0);

    let habitStreak = 0;
    for (let i = 0; ; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (taskHistory[k] > 0) habitStreak++; else break;
    }

    const money = JSON.parse(localStorage.getItem('evoLifeMoney') || '{"target":0,"transactions":[]}');
    const moneyTotal = money.transactions.reduce((s, t) => t.type === 'expense' ? s - t.amount : s + t.amount, 0);
    const moneyPct = money.target > 0 ? Math.min(100, Math.round((moneyTotal / money.target) * 100)) : 0;

    const learning = JSON.parse(localStorage.getItem('evoLifeLearning') || '[]');

    const workout = JSON.parse(localStorage.getItem('evoLifeWorkout_v2') || 'null');
    let workoutPct = 0;
    if (workout) {
      const allEx = workout.type === 'section' ? workout.data.flatMap(s => s.exercises) : workout.data;
      const goal = allEx.reduce((s, e) => s + (parseInt(e.goal) || 0), 0);
      const current = allEx.reduce((s, e) => s + (parseInt(e.current) || 0), 0);
      workoutPct = goal ? Math.round((current / goal) * 100) : 0;
    }

    return {
      habitsTotal, habitStreak,
      moneyPct, moneyGoalSet: money.target > 0,
      coursesCount: learning.length,
      workoutPct, hasWorkoutPlan: !!workout,
    };
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle('light');
    setIsLight(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('welcome');
    } catch (err) {
      console.error('Error logging out:', err);
      setError("Couldn't log out. Try again.");
    }
  };

  const handleSaveProfile = async (updates) => {
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setProfile(prev => ({ ...prev, ...updates }));
      setShowEdit(false);
    } catch (err) {
      console.error(err);
      setError("Couldn't save changes. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.fullName || user?.email || '?')
    .trim().split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const memberSince = profile?.createdAt?.toDate
    ? profile.createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const summaryCards = [
    { icon: 'ri-fire-fill', color: 'cyan', value: stats.habitStreak, label: stats.habitStreak === 1 ? 'Day Streak' : 'Day Streak' },
    { icon: 'ri-checkbox-circle-fill', color: 'green', value: stats.habitsTotal, label: 'Habits Done' },
    { icon: 'ri-run-line', color: 'amber', value: stats.hasWorkoutPlan ? `${stats.workoutPct}%` : '—', label: 'Workout Goal' },
    { icon: 'ri-book-read-line', color: 'purple', value: stats.coursesCount, label: 'Courses & Boards' },
  ];

  return (
    <div className="screen">
      <div className="app-wrap" style={{ maxWidth: '520px' }}>

        {/* Header */}
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <button className="back-btn" onClick={() => setCurrentScreen('welcome')}>
              <i className="ri-arrow-left-line"></i> Back
            </button>
            <div className="app-title-block">
              <h1 className="display grad-text">My Profile</h1>
              <p>Account & progress overview</p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: '13px', background: 'var(--red-dim)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Identity card */}
        <div className="card animate-fadeUp" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '4px' }}>
          <div className="profile-avatar-ring">
            <div className="profile-avatar">{initials || <i className="ri-user-smile-line"></i>}</div>
          </div>

          {loading ? (
            <div style={{ height: '24px' }} />
          ) : (
            <>
              <h2 style={{ marginTop: '14px' }}>{profile?.fullName || 'EvoLife Member'}</h2>
              {profile?.username && <span className="chip chip-cyan" style={{ marginTop: '4px' }}>@{profile.username}</span>}
            </>
          )}

          <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--muted)' }}>{user?.email}</p>
          {memberSince && (
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-2)', marginTop: '2px' }}>
              <i className="ri-calendar-check-line"></i> Member since {memberSince}
            </p>
          )}

          <button
            className="btn-ghost btn-sm"
            style={{ marginTop: '18px', width: '100%' }}
            onClick={() => setShowEdit(true)}
            disabled={loading}
          >
            <i className="ri-edit-line"></i> Edit Profile
          </button>
        </div>

        {/* Progress snapshot */}
        <h3 className="heading" style={{ margin: '24px 0 12px', fontSize: '0.95rem' }}>
          <i className="ri-bar-chart-2-line" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i>
          Your Progress
        </h3>
        <div className="profile-stat-grid animate-fadeUp">
          {summaryCards.map((s, i) => (
            <div key={i} className={`profile-stat-card chip-${s.color}-surface`} style={{ animationDelay: `${i * 50}ms` }}>
              <i className={s.icon} style={{ color: `var(--${s.color})` }}></i>
              <div className="profile-stat-value">{s.value}</div>
              <div className="profile-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Account details */}
        <h3 className="heading" style={{ margin: '24px 0 12px', fontSize: '0.95rem' }}>
          <i className="ri-shield-user-line" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i>
          Account Details
        </h3>
        <div className="card animate-fadeUp" style={{ padding: '4px 20px' }}>
          <div className="profile-info-row">
            <span className="label">Age</span>
            <span>{loading ? '—' : (profile?.age || '—')}</span>
          </div>
          <div className="profile-info-row">
            <span className="label">Gender</span>
            <span>{loading ? '—' : (profile?.gender || '—')}</span>
          </div>
          <div className="profile-info-row" style={{ borderBottom: 'none' }}>
            <span className="label">Email</span>
            <span style={{ wordBreak: 'break-all', textAlign: 'right' }}>{user?.email}</span>
          </div>
        </div>

        {/* Settings */}
        <h3 className="heading" style={{ margin: '24px 0 12px', fontSize: '0.95rem' }}>
          <i className="ri-settings-3-line" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i>
          Preferences
        </h3>
        <div className="card animate-fadeUp" style={{ padding: '4px 20px' }}>
          <div className="profile-info-row" style={{ borderBottom: 'none' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-h)', fontWeight: 600 }}>
              <i className={isLight ? 'ri-sun-line' : 'ri-moon-line'}></i> {isLight ? 'Light Mode' : 'Dark Mode'}
            </span>
            <button className="profile-toggle" data-on={isLight} onClick={toggleTheme} aria-label="Toggle theme">
              <span className="profile-toggle-knob" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          className="btn-ghost"
          style={{ width: '100%', marginTop: '24px', borderColor: 'var(--red)', color: 'var(--red)', minHeight: 48 }}
          onClick={() => setShowLogoutConfirm(true)}
        >
          <i className="ri-logout-box-r-line"></i> Log Out
        </button>
      </div>

      {showEdit && (
        <EditProfileModal
          initial={profile || {}}
          saving={saving}
          onCancel={() => setShowEdit(false)}
          onSave={handleSaveProfile}
        />
      )}

      {showLogoutConfirm && (
        <ConfirmModal
          title="Log out?"
          message="You'll need to sign back in to access your account."
          confirmLabel="Log Out"
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}

export default ProfileScreen;