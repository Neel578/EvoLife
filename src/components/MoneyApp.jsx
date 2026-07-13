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

// Lightweight in-app alert to replace alert()
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

function MoneyApp({ setCurrentScreen }) {
  const [moneyData, setMoneyData] = useState(() => {
    const s = localStorage.getItem('evoLifeMoney');
    return s ? JSON.parse(s) : { target: 0, transactions: [] };
  });
  const [goalInput, setGoalInput] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => { localStorage.setItem('evoLifeMoney', JSON.stringify(moneyData)); }, [moneyData]);

  const total = moneyData.transactions.reduce((s, t) => t.type === 'expense' ? s - t.amount : s + t.amount, 0);
  const pct = moneyData.target > 0 ? Math.min(100, (total / moneyData.target) * 100) : 0;

  const setGoal = () => { const a = parseFloat(goalInput); if (a > 0) setMoneyData({ ...moneyData, target: a }); };

  const transact = (type) => {
    const a = parseFloat(addAmount);
    if (!a || a <= 0) return;
    if (type === 'income' && total + a > moneyData.target) return setAlertMsg("This exceeds your target! Increase it first.");
    if (type === 'expense' && total - a < 0) return setAlertMsg("Insufficient balance!");
    setMoneyData({
      ...moneyData,
      transactions: [{ id: Date.now(), amount: a, note: addNote || (type === 'income' ? 'Income' : 'Expense'), date: new Date().toLocaleDateString(), type }, ...moneyData.transactions]
    });
    setAddAmount(''); setAddNote('');
  };

  const deleteT = id => {
    setConfirmModal({
      message: 'This transaction record will be permanently deleted.',
      onConfirm: () => {
        setMoneyData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
        setConfirmModal(null);
      }
    });
  };

  const reset = () => {
    setConfirmModal({
      message: 'This will erase your goal and all transaction history. This cannot be undone.',
      confirmLabel: 'Reset Everything',
      onConfirm: () => { setMoneyData({ target: 0, transactions: [] }); setConfirmModal(null); }
    });
  };

  const fmt = n => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const allocations = [
    { cls: 'needs', icon: 'ri-home-heart-line', label: 'Needs', pct: 45, desc: 'Food · Travel · Bills' },
    { cls: 'savings', icon: 'ri-safe-2-line', label: 'Emergency', pct: 15, desc: 'For sudden problems' },
    { cls: 'invest', icon: 'ri-line-chart-line', label: 'Invest', pct: 25, desc: 'Future wealth' },
    { cls: 'fun', icon: 'ri-gamepad-line', label: 'Fun', pct: 10, desc: 'Spend freely' },
  ];

  return (
    <div className="screen">
      <div className="app-wrap">
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <button className="back-btn" onClick={() => setCurrentScreen('welcome')}>
              <i className="ri-arrow-left-line"></i> Back
            </button>
            <div className="app-title-block">
              <h1 className="display grad-amber">Financial Freedom</h1>
              <p>45 / 15 / 25 / 10 Rule</p>
            </div>
          </div>
        </div>

        {moneyData.target === 0 ? (
          <div className="card goal-setup animate-scaleIn">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
            <h2>Set Your Goal</h2>
            <p>What's your total income target?</p>
            <input
              type="number" inputMode="decimal" placeholder="e.g. 100000"
              value={goalInput} onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setGoal()}
              style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '14px' }}
            />
            <button className="btn-primary btn-amber" style={{ minHeight: 48 }} onClick={setGoal}>
              <i className="ri-check-line"></i> Set Goal
            </button>
          </div>
        ) : (
          <>
            {/* Hero balance card */}
            <div className="card money-hero animate-fadeUp">
              <div className="label" style={{ marginBottom: '8px' }}>Total Balance</div>
              <div className="money-total">{fmt(total)}</div>
              <div className="money-goal-text">of {fmt(moneyData.target)} goal</div>
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }}>
                  <span>Progress</span><span style={{ color: 'var(--amber)', fontWeight: 700 }}>{pct.toFixed(1)}%</span>
                </div>
                <div className="progress-track" style={{ height: '8px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--amber), #ff7c00)', boxShadow: '0 0 8px rgba(255,184,0,0.4)' }}></div>
                </div>
              </div>

              {/* Add transaction */}
              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <input type="text" placeholder="Note (Salary, Food…)" value={addNote} onChange={e => setAddNote(e.target.value)}
                  style={{ flex: '2 1 140px' }} />
                <input type="number" inputMode="decimal" placeholder="Amount" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && transact('income')}
                  style={{ flex: '1 1 100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--green), #00a870)', boxShadow: '0 8px 24px rgba(0,229,160,0.3)', minHeight: 48 }} onClick={() => transact('income')}>
                  <i className="ri-add-line"></i> Income
                </button>
                <button className="btn-primary btn-red" style={{ minHeight: 48 }} onClick={() => transact('expense')}>
                  <i className="ri-subtract-line"></i> Spend
                </button>
              </div>
            </div>

            {/* Allocation cards */}
            <div className="money-grid animate-fadeUp">
              {allocations.map(a => (
                <div key={a.cls} className={`money-card ${a.cls}`}>
                  <div className="money-icon"><i className={a.icon}></i></div>
                  <div className="money-label">{a.label} ({a.pct}%)</div>
                  <div className="money-value">{fmt(total * a.pct / 100)}</div>
                  <div className="money-desc">{a.desc}</div>
                </div>
              ))}
            </div>

            {/* History */}
            {moneyData.transactions.length > 0 && (
              <div className="card history-section animate-fadeUp" style={{ marginTop: '16px' }}>
                <h3>History</h3>
                <div className="txn-list">
                  {moneyData.transactions.map(t => (
                    <div key={t.id} className="txn-item">
                      <div>
                        <div className="txn-note">{t.note}</div>
                        <div className="txn-date">{t.date}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className={`txn-amount ${t.type === 'expense' ? 'minus' : 'plus'}`}>
                          {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                        </span>
                        <button className="icon-btn-touch" onClick={() => deleteT(t.id)}>
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button className="btn-ghost" style={{ borderColor: 'var(--red)', color: 'var(--red)', minHeight: 48 }} onClick={reset}>
                <i className="ri-refresh-line"></i> Reset Goal
              </button>
            </div>
          </>
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

export default MoneyApp;