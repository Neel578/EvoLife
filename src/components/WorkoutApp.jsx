import React, { useState, useEffect } from 'react';

function WorkoutApp({ setCurrentScreen }) {
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
    if (!data.length) return alert("Add at least one exercise.");
    setPlan({ type: planType, data });
    setShowCreator(false);
  };

  const log = (sIdx, exIdx, mult) => {
    const key = `${sIdx}-${exIdx}`;
    const amt = parseInt(repInputs[key]) || 0;
    if (!amt) return;
    const np = { ...plan };
    if (sIdx !== null) {
      np.data[sIdx].exercises[exIdx].current = Math.max(0, np.data[sIdx].exercises[exIdx].current + amt * mult);
    } else {
      np.data[exIdx].current = Math.max(0, np.data[exIdx].current + amt * mult);
    }
    setPlan(np);
    setRepInputs({ ...repInputs, [key]: '' });
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

  const ExerciseRow = ({ ex, sIdx, exIdx }) => {
    const key = `${sIdx}-${exIdx}`;
    const p = Math.min(100, ex.goal ? (ex.current / ex.goal) * 100 : 0);
    return (
      <div className="exercise-row">
        <div className="ex-label">
          <span className="ex-name">{ex.name}</span>
          <span className="ex-count">{ex.current} / {ex.goal}</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${p}%`, background: p >= 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--cyan), var(--green))' }}></div></div>
        <div className="ex-input-row">
          <input
            type="number" placeholder="Count"
            value={repInputs[key] || ''}
            onChange={e => setRepInputs({ ...repInputs, [key]: e.target.value })}
            min="1"
          />
          <button className="ex-btn minus" onClick={() => log(sIdx, exIdx, -1)}>−</button>
          <button className="ex-btn plus" onClick={() => log(sIdx, exIdx, 1)}>+</button>
        </div>
      </div>
    );
  };

  const EditRow = ({ ex, sIdx, exIdx }) => {
    const updateEx = (field, val) => {
      const np = { ...plan };
      if (sIdx !== null) np.data[sIdx].exercises[exIdx][field] = val;
      else np.data[exIdx][field] = val;
      setPlan(np);
    };
    const delEx = () => {
      if (!window.confirm("Remove this exercise?")) return;
      const np = { ...plan };
      if (sIdx !== null) np.data[sIdx].exercises.splice(exIdx, 1);
      else np.data.splice(exIdx, 1);
      setPlan(np);
    };
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
        <input type="text" value={ex.name} onChange={e => updateEx('name', e.target.value)} style={{ flex: 2, padding: '8px 10px', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)' }} placeholder="Exercise name" />
        <input type="number" value={ex.goal} onChange={e => updateEx('goal', e.target.value)} style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', minWidth: 0 }} placeholder="Goal" />
        <button onClick={delEx} style={{ background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '8px', padding: '8px 10px', flexShrink: 0 }}><i className="ri-close-line"></i></button>
      </div>
    );
  };

  return (
    <div className="screen">
      <div className="app-wrap">
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <button className="back-btn" onClick={() => setCurrentScreen('welcome')}>
              <i className="ri-arrow-left-line"></i> Back
            </button>
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
            <button className="btn-primary btn-red" onClick={() => { setShowCreator(true); setStep(1); }}>
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
              <button className={isEditing ? 'btn-primary' : 'btn-ghost'} style={{ flex: 1 }} onClick={() => setIsEditing(v => !v)}>
                <i className={isEditing ? 'ri-save-line' : 'ri-edit-line'}></i> {isEditing ? 'Save' : 'Edit Plan'}
              </button>
              <button className="btn-ghost" style={{ flex: 1, borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => window.confirm("Reset all workout data?") && setPlan(null)}>
                <i className="ri-delete-bin-line"></i> Reset
              </button>
            </div>

            {/* Render plan */}
            {plan.type === 'section' ? (
              plan.data.map((sec, sIdx) => (
                <div key={sIdx} className="card section-card animate-fadeUp" style={{ animationDelay: `${sIdx * 60}ms` }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
                      <input type="text" value={sec.sectionName}
                        onChange={e => { const np = {...plan}; np.data[sIdx].sectionName = e.target.value; setPlan(np); }}
                        style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem' }} />
                      <button onClick={() => { if (window.confirm("Delete section?")) { const np = {...plan}; np.data.splice(sIdx, 1); setPlan(np); } }}
                        style={{ background: 'var(--red-dim)', color: 'var(--red)', border: 'none', borderRadius: '8px', padding: '8px 10px' }}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="section-title"><i className="ri-run-line" style={{ marginRight: '6px' }}></i>{sec.sectionName}</div>
                  )}
                  {sec.exercises.map((ex, exIdx) =>
                    isEditing
                      ? <EditRow key={exIdx} ex={ex} sIdx={sIdx} exIdx={exIdx} />
                      : <ExerciseRow key={exIdx} ex={ex} sIdx={sIdx} exIdx={exIdx} />
                  )}
                  {isEditing && (
                    <button onClick={() => { const np = {...plan}; np.data[sIdx].exercises.push({ name: 'New Exercise', goal: 100, current: 0 }); setPlan(np); }}
                      style={{ width: '100%', padding: '10px', border: '1px dashed var(--muted-2)', background: 'none', color: 'var(--green)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: '8px' }}>
                      + Add Exercise
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="card section-card animate-fadeUp">
                {plan.data.map((ex, i) =>
                  isEditing
                    ? <EditRow key={i} ex={ex} sIdx={null} exIdx={i} />
                    : <ExerciseRow key={i} ex={ex} sIdx={null} exIdx={i} />
                )}
                {isEditing && (
                  <button onClick={() => { const np = {...plan}; np.data.push({ name: 'New Exercise', goal: 100, current: 0 }); setPlan(np); }}
                    style={{ width: '100%', padding: '10px', border: '1px dashed var(--muted-2)', background: 'none', color: 'var(--green)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginTop: '8px' }}>
                    + Add Exercise
                  </button>
                )}
              </div>
            )}
            {isEditing && plan.type === 'section' && (
              <button className="btn-ghost" style={{ marginTop: '8px' }}
                onClick={() => { const np = {...plan}; np.data.push({ sectionName: 'New Section', exercises: [{ name: 'Exercise', goal: 100, current: 0 }] }); setPlan(np); }}>
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
                  <button className="option-card" onClick={() => choosePlanType('section')}>
                    <h3>Body Part Sections</h3>
                    <p>Group by Chest, Legs, Abs, etc.</p>
                  </button>
                  <button className="option-card" onClick={() => choosePlanType('list')}>
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
                            onChange={e => { const b = [...builder]; b[sIdx].sectionName = e.target.value; setBuilder(b); }}
                            style={{ fontWeight: 700, marginBottom: '10px' }} />
                          {sec.exercises.map((ex, exIdx) => (
                            <div key={exIdx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                              <input type="text" placeholder="Exercise" value={ex.name}
                                onChange={e => { const b = [...builder]; b[sIdx].exercises[exIdx].name = e.target.value; setBuilder(b); }}
                                style={{ flex: 2, padding: '8px 10px', fontSize: '0.85rem' }} />
                              <input type="number" placeholder="Goal" value={ex.goal}
                                onChange={e => { const b = [...builder]; b[sIdx].exercises[exIdx].goal = e.target.value; setBuilder(b); }}
                                style={{ flex: 1, padding: '8px 10px', fontSize: '0.85rem', minWidth: 0 }} />
                            </div>
                          ))}
                          <button onClick={() => { const b = [...builder]; b[sIdx].exercises.push({ name: '', goal: '' }); setBuilder(b); }}
                            style={{ fontSize: '0.8rem', color: 'var(--green)', background: 'none', border: 'none', marginTop: '6px' }}>+ Exercise</button>
                        </div>
                      ))
                    ) : (
                      builder.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input type="text" placeholder="Exercise name" value={item.name}
                            onChange={e => { const b = [...builder]; b[i].name = e.target.value; setBuilder(b); }}
                            style={{ flex: 2 }} />
                          <input type="number" placeholder="Monthly goal" value={item.goal}
                            onChange={e => { const b = [...builder]; b[i].goal = e.target.value; setBuilder(b); }}
                            style={{ flex: 1, minWidth: 0 }} />
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button className="btn-ghost" onClick={() => setBuilder(prev => planType === 'section'
                      ? [...prev, { sectionName: '', exercises: [{ name: '', goal: '' }] }]
                      : [...prev, { name: '', goal: '' }])}>+ Add More</button>
                    <button className="btn-primary btn-red" onClick={savePlan}><i className="ri-save-line"></i> Save Plan</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkoutApp;