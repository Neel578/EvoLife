import React, { useState, useEffect } from 'react';

function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel }) {
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

function AlertModal({ message, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Heads up</h2>
          <button className="modal-close" onClick={onClose}><i className="ri-close-line"></i></button>
        </div>
        <p style={{ color: 'var(--muted)', marginBottom: '20px', fontSize: '0.9rem' }}>{message}</p>
        <button className="btn-primary" style={{ width: '100%' }} onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}

// Quick-tap rep amounts — covers most logging without needing the keyboard at all
const QUICK_ADDS = [5, 10, 25];

// ---------------------------------------------------------------------------
// IMPORTANT: These two components are defined OUTSIDE WorkoutApp on purpose.
// If they were declared inside WorkoutApp's function body, every keystroke
// (every re-render) would create brand-new component identities, causing
// React to unmount + remount the <input> and drop focus/keyboard after each
// letter. Keeping them at module scope with stable props fixes that.
// ---------------------------------------------------------------------------

function ExerciseRow({ ex, sIdx, exIdx, repInputs, setRepInputs, onLog }) {
  const key = `${sIdx}-${exIdx}`;
  const p = Math.min(100, ex.goal ? (ex.current / ex.goal) * 100 : 0);
  return (
    <div className="exercise-row">
      <div className="ex-label">
        <span className="ex-name">{ex.name}</span>
        <span className="ex-count">{ex.current} / {ex.goal}</span>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${p}%`, background: p >= 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--cyan), var(--green))' }}></div></div>

      {/* Quick-add chips — one tap logs reps, no keyboard needed */}
      <div className="quick-add-row">
        {QUICK_ADDS.map(n => (
          <button key={n} className="quick-add-chip" onClick={() => onLog(sIdx, exIdx, 1, n)}>+{n}</button>
        ))}
      </div>

      {/* Manual entry for custom amounts */}
      <div className="ex-input-row">
        <button className="ex-btn minus" onClick={() => onLog(sIdx, exIdx, -1)} aria-label="Subtract">−</button>
        <input
          type="number" inputMode="numeric" placeholder="Custom"
          value={repInputs[key] || ''}
          onChange={e => setRepInputs(prev => ({ ...prev, [key]: e.target.value }))}
          min="1"
        />
        <button className="ex-btn plus" onClick={() => onLog(sIdx, exIdx, 1)} aria-label="Add">+</button>
      </div>
    </div>
  );
}

function EditRow({ ex, sIdx, exIdx, onUpdate, onDelete }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
      <input
        type="text"
        value={ex.name}
        onChange={e => onUpdate(sIdx, exIdx, 'name', e.target.value)}
        style={{ flex: 2, padding: '10px', fontSize: '16px', borderRadius: 'var(--radius-sm)' }}
        placeholder="Exercise name"
      />
      <input
        type="number" inputMode="numeric"
        value={ex.goal}
        onChange={e => onUpdate(sIdx, exIdx, 'goal', e.target.value)}
        style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: 'var(--radius-sm)', minWidth: 0 }}
        placeholder="Goal"
      />
      <button className="icon-btn-touch" onClick={() => onDelete(sIdx, exIdx)} style={{ flexShrink: 0, background: 'var(--red-dim)', color: 'var(--red)' }}>
        <i className="ri-close-line"></i>
      </button>
    </div>
  );
}

function WorkoutApp() {
  const [plan, setPlan] = useState(() => {
    const s = localStorage.getItem('evoLifeWorkout_v2');
    return s ? JSON.parse(s) : null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [step, setStep] = useState(1);
  const [planType, setPlanType] = useState('');
  const [builder, setBuilder] = useState([]);
  const [repInputs, setRepInputs] = useState({});
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    if (plan) localStorage.setItem('evoLifeWorkout_v2', JSON.stringify(plan));
    else localStorage.removeItem('evoLifeWorkout_v2');
  }, [plan]);

  const choosePlanType = type => {
    setPlanType(type);
    setBuilder(type === 'section'
      ? [{ sectionName: '', exercises: [{ name: '', goal: '' }] }]
      : [{ name: '', goal: '' }]);
    setStep(2);
  };

  const savePlan = () => {
    let data;
    if (planType === 'section') {
      data = builder.filter(s => s.sectionName.trim()).map(s => ({
        sectionName: s.sectionName,
        exercises: s.exercises.filter(e => e.name && e.goal).map(e => ({ name: e.name, goal: parseInt(e.goal), current: 0 }))
      }));
    } else {
      data = builder.filter(i => i.name && i.goal).map(i => ({ name: i.name, goal: parseInt(i.goal), current: 0 }));
    }
    if (!data.length) return setAlertMsg("Add at least one exercise.");
    setPlan({ type: planType, data });
    setShowCreator(false);
  };

  // amt param lets both the typed input AND the quick-add chips use the same logger
  const log = (sIdx, exIdx, mult, amtOverride) => {
    const key = `${sIdx}-${exIdx}`;
    setPlan(prev => {
      const amt = amtOverride ?? (parseInt(repInputs[key]) || 0);
      if (!amt) return prev;
      const np = { ...prev };
      if (sIdx !== null) {
        np.data = np.data.map((sec, i) => i !== sIdx ? sec : {
          ...sec,
          exercises: sec.exercises.map((e, j) => j !== exIdx ? e : { ...e, current: Math.max(0, e.current + amt * mult) })
        });
      } else {
        np.data = np.data.map((e, j) => j !== exIdx ? e : { ...e, current: Math.max(0, e.current + amt * mult) });
      }
      return np;
    });
    if (amtOverride === undefined) setRepInputs(prev => ({ ...prev, [key]: '' }));
  };

  // Edit-mode field updates for name/goal — stable callback, passed to EditRow
  const updateExerciseField = (sIdx, exIdx, field, val) => {
    setPlan(prev => {
      const np = { ...prev };
      if (sIdx !== null) {
        np.data = np.data.map((sec, i) => i !== sIdx ? sec : {
          ...sec,
          exercises: sec.exercises.map((e, j) => j !== exIdx ? e : { ...e, [field]: val })
        });
      } else {
        np.data = np.data.map((e, j) => j !== exIdx ? e : { ...e, [field]: val });
      }
      return np;
    });
  };

  const deleteExercise = (sIdx, exIdx) => {
    setConfirmModal({
      message: 'Remove this exercise from your plan?',
      onConfirm: () => {
        setPlan(prev => {
          const np = { ...prev };
          if (sIdx !== null) {
            np.data = np.data.map((sec, i) => i !== sIdx ? sec : { ...sec, exercises: sec.exercises.filter((_, j) => j !== exIdx) });
          } else {
            np.data = np.data.filter((_, j) => j !== exIdx);
          }
          return np;
        });
        setConfirmModal(null);
      }
    });
  };

  const updateSectionName = (sIdx, val) => {
    setPlan(prev => ({ ...prev, data: prev.data.map((sec, i) => i !== sIdx ? sec : { ...sec, sectionName: val }) }));
  };

  const deleteSection = (sIdx) => {
    setConfirmModal({
      message: 'Delete this entire section and its exercises?',
      onConfirm: () => {
        setPlan(prev => ({ ...prev, data: prev.data.filter((_, i) => i !== sIdx) }));
        setConfirmModal(null);
      }
    });
  };

  const resetPlan = () => {
    setConfirmModal({
      message: 'This will permanently delete your entire workout plan and progress.',
      confirmLabel: 'Reset Everything',
      onConfirm: () => { setPlan(null); setConfirmModal(null); }
    });
  };

  const addExerciseToSection = (sIdx) => {
    setPlan(prev => ({ ...prev, data: prev.data.map((sec, i) => i !== sIdx ? sec : { ...sec, exercises: [...sec.exercises, { name: 'New Exercise', goal: 100, current: 0 }] }) }));
  };

  const addExerciseToList = () => {
    setPlan(prev => ({ ...prev, data: [...prev.data, { name: 'New Exercise', goal: 100, current: 0 }] }));
  };

  const addSection = () => {
    setPlan(prev => ({ ...prev, data: [...prev.data, { sectionName: 'New Section', exercises: [{ name: 'Exercise', goal: 100, current: 0 }] }] }));
  };

  // calc totals
  let totalGoal = 0, totalCurrent = 0;
  if (plan) {
    const allEx = plan.type === 'section'
      ? plan.data.flatMap(s => s.exercises)
      : plan.data;
    allEx.forEach(e => { totalGoal += parseInt(e.goal || 0); totalCurrent += parseInt(e.current || 0); });
  }
  const totalPct = totalGoal ? Math.round((totalCurrent / totalGoal) * 100) : 0;

  return (
    <div className="screen">
      <div className="app-wrap">
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <div className="app-title-block">
              <h1 className="display" style={{ background: 'linear-gradient(135deg, var(--red), var(--amber))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                Physical Growth
              </h1>
              <p>Monthly Goals</p>
            </div>
          </div>
        </div>

        {/* No plan */}
        {!plan && (
          <div className="card animate-scaleIn" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💪</div>
            <h2 className="heading" style={{ marginBottom: '8px' }}>Create Your Plan</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Build a monthly rep goal to track your progress.</p>
            <button className="btn-primary btn-red" style={{ minHeight: 48 }} onClick={() => { setShowCreator(true); setStep(1); }}>
              <i className="ri-add-line"></i> Add Workout Plan
            </button>
          </div>
        )}

        {/* Dashboard */}
        {plan && (
          <>
            <div className="card animate-fadeUp" style={{ marginBottom: '16px' }}>
              <div className="workout-stat">
                <div className="workout-pct">{totalPct}%</div>
                <div className="workout-sub">{totalCurrent} / {totalGoal} reps this month</div>
                <div className="progress-track" style={{ height: '10px', margin: '16px 0 0' }}>
                  <div className="progress-fill" style={{ width: `${totalPct}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))', boxShadow: '0 0 12px rgba(0,229,160,0.4)' }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button className={isEditing ? 'btn-primary' : 'btn-ghost'} style={{ flex: 1, minHeight: 48 }} onClick={() => setIsEditing(v => !v)}>
                <i className={isEditing ? 'ri-save-line' : 'ri-edit-line'}></i> {isEditing ? 'Save' : 'Edit Plan'}
              </button>
              <button className="btn-ghost" style={{ flex: 1, borderColor: 'var(--red)', color: 'var(--red)', minHeight: 48 }} onClick={resetPlan}>
                <i className="ri-delete-bin-line"></i> Reset
              </button>
            </div>

            {/* Render plan */}
            {plan.type === 'section' ? (
              plan.data.map((sec, sIdx) => (
                <div key={sIdx} className="card section-card animate-fadeUp" style={{ animationDelay: `${sIdx * 60}ms` }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={sec.sectionName}
                        onChange={e => updateSectionName(sIdx, e.target.value)}
                        style={{ flex: 1, fontWeight: 700, fontSize: '16px' }}
                      />
                      <button className="icon-btn-touch" onClick={() => deleteSection(sIdx)} style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="section-title"><i className="ri-run-line" style={{ marginRight: '6px' }}></i>{sec.sectionName}</div>
                  )}
                  {sec.exercises.map((ex, exIdx) =>
                    isEditing
                      ? <EditRow key={exIdx} ex={ex} sIdx={sIdx} exIdx={exIdx} onUpdate={updateExerciseField} onDelete={deleteExercise} />
                      : <ExerciseRow key={exIdx} ex={ex} sIdx={sIdx} exIdx={exIdx} repInputs={repInputs} setRepInputs={setRepInputs} onLog={log} />
                  )}
                  {isEditing && (
                    <button onClick={() => addExerciseToSection(sIdx)}
                      style={{ width: '100%', padding: '12px', border: '1px dashed var(--muted-2)', background: 'none', color: 'var(--green)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: '8px', minHeight: 44 }}>
                      + Add Exercise
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="card section-card animate-fadeUp">
                {plan.data.map((ex, i) =>
                  isEditing
                    ? <EditRow key={i} ex={ex} sIdx={null} exIdx={i} onUpdate={updateExerciseField} onDelete={deleteExercise} />
                    : <ExerciseRow key={i} ex={ex} sIdx={null} exIdx={i} repInputs={repInputs} setRepInputs={setRepInputs} onLog={log} />
                )}
                {isEditing && (
                  <button onClick={addExerciseToList}
                    style={{ width: '100%', padding: '12px', border: '1px dashed var(--muted-2)', background: 'none', color: 'var(--green)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: '8px', minHeight: 44 }}>
                    + Add Exercise
                  </button>
                )}
              </div>
            )}
            {isEditing && plan.type === 'section' && (
              <button className="btn-ghost" style={{ marginTop: '8px', minHeight: 48 }} onClick={addSection}>
                + Add Body Part Section
              </button>
            )}
          </>
        )}

        {/* Creator modal */}
        {showCreator && (
          <div className="modal-overlay">
            <div className="modal-box">
              <div className="modal-header">
                <h2>{step === 1 ? 'Plan Type' : 'Build Your Plan'}</h2>
                <button className="modal-close" onClick={() => setShowCreator(false)}><i className="ri-close-line"></i></button>
              </div>

              {step === 1 && (
                <div>
                  <p style={{ color: 'var(--muted)', marginBottom: '16px', fontSize: '0.9rem' }}>How to organize your exercises?</p>
                  <button className="option-card" style={{ minHeight: 64 }} onClick={() => choosePlanType('section')}>
                    <h3>Body Part Sections</h3>
                    <p>Group by Chest, Legs, Abs, etc.</p>
                  </button>
                  <button className="option-card" style={{ minHeight: 64 }} onClick={() => choosePlanType('list')}>
                    <h3>Simple List</h3>
                    <p>All exercises together.</p>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div style={{ maxHeight: '55dvh', overflowY: 'auto', paddingRight: '4px' }}>
                    {planType === 'section' ? (
                      builder.map((sec, sIdx) => (
                        <div key={sIdx} className="card" style={{ padding: '14px', marginBottom: '12px' }}>
                          <input type="text" placeholder="Section name (e.g. Chest)" value={sec.sectionName}
                            onChange={e => setBuilder(prev => prev.map((s, i) => i !== sIdx ? s : { ...s, sectionName: e.target.value }))}
                            style={{ fontWeight: 700, marginBottom: '10px', fontSize: '16px' }} />
                          {sec.exercises.map((ex, exIdx) => (
                            <div key={exIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                              <input type="text" placeholder="Exercise" value={ex.name}
                                onChange={e => setBuilder(prev => prev.map((s, i) => i !== sIdx ? s : {
                                  ...s, exercises: s.exercises.map((ex2, j) => j !== exIdx ? ex2 : { ...ex2, name: e.target.value })
                                }))}
                                style={{ flex: 2, padding: '10px', fontSize: '16px' }} />
                              <input type="number" inputMode="numeric" placeholder="Goal" value={ex.goal}
                                onChange={e => setBuilder(prev => prev.map((s, i) => i !== sIdx ? s : {
                                  ...s, exercises: s.exercises.map((ex2, j) => j !== exIdx ? ex2 : { ...ex2, goal: e.target.value })
                                }))}
                                style={{ flex: 1, padding: '10px', fontSize: '16px', minWidth: 0 }} />
                            </div>
                          ))}
                          <button onClick={() => setBuilder(prev => prev.map((s, i) => i !== sIdx ? s : { ...s, exercises: [...s.exercises, { name: '', goal: '' }] }))}
                            style={{ fontSize: '0.8rem', color: 'var(--green)', background: 'none', border: 'none', marginTop: '6px', minHeight: 36 }}>+ Exercise</button>
                        </div>
                      ))
                    ) : (
                      builder.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input type="text" placeholder="Exercise name" value={item.name}
                            onChange={e => setBuilder(prev => prev.map((it, idx) => idx !== i ? it : { ...it, name: e.target.value }))}
                            style={{ flex: 2, fontSize: '16px' }} />
                          <input type="number" inputMode="numeric" placeholder="Monthly goal" value={item.goal}
                            onChange={e => setBuilder(prev => prev.map((it, idx) => idx !== i ? it : { ...it, goal: e.target.value }))}
                            style={{ flex: 1, minWidth: 0, fontSize: '16px' }} />
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button className="btn-ghost" style={{ minHeight: 44 }} onClick={() => setBuilder(prev => planType === 'section'
                      ? [...prev, { sectionName: '', exercises: [{ name: '', goal: '' }] }]
                      : [...prev, { name: '', goal: '' }])}>+ Add More</button>
                    <button className="btn-primary btn-red" style={{ minHeight: 44 }} onClick={savePlan}><i className="ri-save-line"></i> Save Plan</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg(null)} />}
    </div>
  );
}

export default WorkoutApp;