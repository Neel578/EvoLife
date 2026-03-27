import React, { useState, useEffect } from 'react';

function MoneyApp({ setCurrentScreen }) {
  const [moneyData, setMoneyData] = useState(() => {
    const s = localStorage.getItem('evoLifeMoney');
    return s ? JSON.parse(s) : { target: 0, transactions: [] };
  });
  const [goalInput, setGoalInput] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');

  useEffect(() => { localStorage.setItem('evoLifeMoney', JSON.stringify(moneyData)); }, [moneyData]);

  const total = moneyData.transactions.reduce((s, t) => t.type === 'expense' ? s - t.amount : s + t.amount, 0);
  const pct = moneyData.target > 0 ? Math.min(100, (total / moneyData.target) * 100) : 0;

  const setGoal = () => { const a = parseFloat(goalInput); if (a > 0) setMoneyData({ ...moneyData, target: a }); };
  const transact = (type) => {
    const a = parseFloat(addAmount);
    if (!a || a <= 0) return;
    if (type === 'income' && total + a > moneyData.target) return alert("Exceeds your target! Increase it first.");
    if (type === 'expense' && total - a < 0) return alert("Insufficient balance!");
    setMoneyData({
      ...moneyData,
      transactions: [{ id: Date.now(), amount: a, note: addNote || (type === 'income' ? 'Income' : 'Expense'), date: new Date().toLocaleDateString(), type }, ...moneyData.transactions]
    });
    setAddAmount(''); setAddNote('');
  };
  const deleteT = id => { if (window.confirm("Delete this record?")) setMoneyData({ ...moneyData, transactions: moneyData.transactions.filter(t => t.id !== id) }); };
  const reset = () => { if (window.confirm("Reset all financial data?")) setMoneyData({ target: 0, transactions: [] }); };

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
              type="number" placeholder="e.g. 100000"
              value={goalInput} onChange={e => setGoalInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setGoal()}
              style={{ textAlign: 'center', fontSize: '1.1rem', marginBottom: '14px' }}
            />
            <button className="btn-primary btn-amber" onClick={setGoal}>
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
                <input type="number" placeholder="Amount" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && transact('income')}
                  style={{ flex: '1 1 100px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--green), #00a870)', boxShadow: '0 8px 24px rgba(0,229,160,0.3)' }} onClick={() => transact('income')}>
                  <i className="ri-add-line"></i> Income
                </button>
                <button className="btn-primary btn-red" onClick={() => transact('expense')}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className={`txn-amount ${t.type === 'expense' ? 'minus' : 'plus'}`}>
                          {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                        </span>
                        <button onClick={() => deleteT(t.id)} style={{ background: 'none', color: 'var(--muted)', fontSize: '1rem', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseOut={e => e.currentTarget.style.color = 'var(--muted)'}>
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px' }}>
              <button className="btn-ghost" onClick={reset} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                <i className="ri-refresh-line"></i> Reset Goal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MoneyApp;