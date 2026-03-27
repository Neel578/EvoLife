import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function AnalyticsApp({ setCurrentScreen }) {
  const [activeTab, setActiveTab] = useState('7d');
  const isDark = !document.body.classList.contains('light');

  const [taskHistory] = useState(() => {
    const saved = localStorage.getItem('evoLifeTaskHistory');
    if (saved) return JSON.parse(saved);
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { [key]: 2 };
  });

  const { labels, dataPoints, totalTasks, avgPerDay, bestDay } = useMemo(() => {
    let l = [], dp = [], count = 0;
    const gen = (days) => {
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        l.push(d.toLocaleDateString('en-US', { weekday: days <= 14 ? 'short' : undefined, month: days > 14 ? 'short' : undefined, day: 'numeric' }));
        const v = taskHistory[k] || 0;
        dp.push(v); count += v;
      }
    };
    if (activeTab === 'monthly') {
      const mm = {};
      Object.keys(taskHistory).sort().forEach(k => {
        const [y, m] = k.split('-');
        const mk = `${new Date(y, m-1).toLocaleString('default', { month: 'short' })} ${y}`;
        mm[mk] = (mm[mk] || 0) + taskHistory[k];
        count += taskHistory[k];
      });
      l = Object.keys(mm); dp = Object.values(mm);
    } else if (activeTab === 'yearly') {
      const ym = {};
      Object.keys(taskHistory).sort().forEach(k => {
        const y = k.split('-')[0];
        ym[y] = (ym[y] || 0) + taskHistory[k];
        count += taskHistory[k];
      });
      l = Object.keys(ym); dp = Object.values(ym);
    } else if (activeTab === 'life') {
      l = Object.keys(taskHistory).sort();
      dp = l.map(k => taskHistory[k]);
      count = dp.reduce((a, b) => a + b, 0);
    } else {
      gen(parseInt(activeTab.replace('d', '')));
    }
    const avg = dp.length > 0 ? (count / dp.filter(v => v > 0).length || 0).toFixed(1) : 0;
    const best = dp.length > 0 ? Math.max(...dp) : 0;
    return { labels: l, dataPoints: dp, totalTasks: count, avgPerDay: avg, bestDay: best };
  }, [activeTab, taskHistory]);

  const chartData = {
    labels,
    datasets: [{
      fill: true, label: 'Tasks',
      data: dataPoints,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0,212,255,0.08)',
      borderWidth: 2.5, tension: 0.35,
      pointBackgroundColor: isDark ? '#070b14' : '#fff',
      pointBorderColor: '#00d4ff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
    }]
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }, ticks: { color: '#6b7fa3', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#6b7fa3', font: { size: 10 }, maxTicksLimit: 8 } }
    },
    interaction: { intersect: false, mode: 'index' },
  };

  const tabs1 = [['7d', '7 Days'], ['28d', '28 Days'], ['90d', '90 Days'], ['365d', '365 Days'], ['life', 'Lifetime']];
  const tabs2 = [['monthly', 'By Month'], ['yearly', 'By Year']];

  return (
    <div className="screen">
      <div className="app-wrap">
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <button className="back-btn" onClick={() => setCurrentScreen('welcome')}>
              <i className="ri-arrow-left-line"></i> Back
            </button>
            <div className="app-title-block">
              <h1 className="display grad-text">Analytics</h1>
              <p>Performance overview</p>
            </div>
          </div>
        </div>

        <div className="tab-row">
          {tabs1.map(([val, lbl]) => (
            <button key={val} className={`tab-pill ${activeTab === val ? 'active' : ''}`} onClick={() => setActiveTab(val)}>{lbl}</button>
          ))}
        </div>
        <div className="tab-row" style={{ marginBottom: '20px' }}>
          {tabs2.map(([val, lbl]) => (
            <button key={val} className={`tab-pill ${activeTab === val ? 'active' : ''}`} onClick={() => setActiveTab(val)}>{lbl}</button>
          ))}
        </div>

        {/* Big stat */}
        <div className="card animate-fadeUp" style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 800, color: 'var(--cyan)', letterSpacing: '-0.03em' }}>{totalTasks}</div>
              <div className="label">Total Tasks</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>{isNaN(avgPerDay) ? 0 : avgPerDay}</div>
              <div className="label">Daily Avg</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 800, color: 'var(--green)', letterSpacing: '-0.03em' }}>{bestDay}</div>
              <div className="label">Best Day</div>
            </div>
          </div>
          <div style={{ height: 'clamp(200px, 40vw, 320px)' }}>
            {labels.length > 0
              ? <Line data={chartData} options={chartOpts} />
              : <div className="empty-state"><i className="ri-line-chart-line"></i><p>No data yet. Start completing tasks!</p></div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsApp;