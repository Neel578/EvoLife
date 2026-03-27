import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// Notice we added "user" right here!
function WelcomeScreen({ setCurrentScreen, user }) {
  const [taskHistory] = useState(() => {
    const saved = localStorage.getItem('evoLifeTaskHistory');
    return saved ? JSON.parse(saved) : {};
  });
  const [isLight, setIsLight] = useState(() => document.body.classList.contains('light'));

  const toggleTheme = () => {
    document.body.classList.toggle('light');
    setIsLight(prev => !prev);
  };

  const date = new Date();
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const todayNum = date.getDate();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const fullDateText = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
  const daysGone = todayNum - 1;
  const daysLeft = daysInMonth - todayNum;

  let thisMonthCompleted = 0;
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  Object.keys(taskHistory).forEach(k => { if (k.startsWith(prefix)) thisMonthCompleted += taskHistory[k]; });

  const last7Labels = [];
  const last7Data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    last7Labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    last7Data.push(taskHistory[key] || 0);
  }

  const isDark = !isLight;
  const chartData = {
    labels: last7Labels,
    datasets: [{
      fill: true,
      data: last7Data,
      borderColor: '#00d4ff',
      backgroundColor: 'rgba(0,212,255,0.1)',
      borderWidth: 2.5, tension: 0.4,
      pointBackgroundColor: isDark ? '#070b14' : '#fff',
      pointBorderColor: '#00d4ff', pointBorderWidth: 2, pointRadius: 4,
    }]
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: Math.max(5, ...last7Data) + 1,
           grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
           ticks: { color: isDark ? '#6b7fa3' : '#8090b0', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: isDark ? '#6b7fa3' : '#8090b0', font: { size: 10 } } }
    },
    interaction: { intersect: false, mode: 'index' },
  };

  return (
    <div className="screen" style={{ position: 'relative' }}>
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        <i className={isLight ? 'ri-moon-line' : 'ri-sun-line'}></i>
      </button>

      <div className="welcome-wrap stagger">

        <div className="welcome-hero animate-fadeUp" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Your Journey</h1>
            <p>{fullDateText}</p>
          </div>
          
          {/* Smart Profile Icon Button */}
          <button 
            onClick={() => setCurrentScreen(user ? 'profileScreen' : 'authScreen')}
            style={{ 
              width: '45px', 
              height: '45px', 
              borderRadius: '50%', 
              backgroundColor: '#00d4ff', 
              border: 'none',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              cursor: 'pointer',
              color: '#070b14', 
              fontSize: '22px',
              boxShadow: '0 4px 10px rgba(0, 212, 255, 0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title={user ? "My Profile" : "Log In"}
          >
            <i className="ri-user-line"></i>
          </button>
        </div>

        <div className="card mini-chart-card animate-fadeUp" onClick={() => setCurrentScreen('analyticsApp')}>
          <div className="mini-chart-header">
            <span>This Week's Tasks</span>
            <i className="ri-external-link-line"></i>
          </div>
          <div style={{ height: '130px' }}>
            <Line data={chartData} options={chartOpts} />
          </div>
        </div>

        <div className="card cal-card animate-fadeUp">
          <div className="cal-header">
            <span>{monthName}</span>
            <div className="cal-legend">
              <span><span style={{color:'var(--cyan)'}}>●</span> Today</span>
              <span><span style={{color:'var(--green)'}}>●</span> Done</span>
              <span style={{color:'var(--muted-2)'}}>◯ Future</span>
            </div>
          </div>
          <div className="cal-grid">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const key = `${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const hasTasks = taskHistory[key] > 0;
              let cls = 'day-cell';
              if (day === todayNum) cls += ' today';
              else if (hasTasks) cls += ' done';
              else if (day < todayNum) cls += ' past';
              return <div key={day} className={cls}>{day}</div>;
            })}
          </div>
        </div>

        <div className="stats-row animate-fadeUp">
          <div className="stat-card card">
            <div className="stat-val">{daysGone}</div>
            <div className="stat-lbl">Gone</div>
          </div>
          <div className="stat-card card">
            <div className="stat-val">{daysLeft}</div>
            <div className="stat-lbl">Left</div>
          </div>
          <div className="stat-card card accent">
            <div className="stat-val">{thisMonthCompleted}</div>
            <div className="stat-lbl">Done</div>
          </div>
        </div>

        <div className="nav-buttons animate-fadeUp stagger">
          <button className="btn-primary" onClick={() => setCurrentScreen('mainApp')}>
            <i className="ri-focus-3-line"></i> Start My Day
            <i className="ri-arrow-right-line" style={{ marginLeft: 'auto' }}></i>
          </button>

          <button className="btn-primary btn-amber" onClick={() => setCurrentScreen('moneyApp')}>
            <i className="ri-money-dollar-circle-line"></i> Financial Freedom
            <i className="ri-arrow-right-line" style={{ marginLeft: 'auto' }}></i>
          </button>

          <button className="btn-primary btn-purple" onClick={() => setCurrentScreen('learningApp')}>
            <i className="ri-brain-line"></i> Mental Growth
            <i className="ri-arrow-right-line" style={{ marginLeft: 'auto' }}></i>
          </button>

          <button className="nav-btn-workout" onClick={() => setCurrentScreen('workoutApp')}>
            <div className="top"><i className="ri-fire-fill"></i> Physical Growth</div>
            <div className="pct">Track monthly reps</div>
            <div className="bar"><div className="bar-fill" style={{ width: '0%' }}></div></div>
          </button>
        </div>

      </div>
    </div>
  );
}

export default WelcomeScreen;