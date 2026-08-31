import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function WelcomeScreen({ user, setActiveTab }) {
  /* ── Calendar & chart data ──────────────────────────────────── */
  const [taskHistory] = useState(() => {
    const saved = localStorage.getItem('evoLifeTaskHistory');
    return saved ? JSON.parse(saved) : {};
  });
  const [isLight] = useState(() => document.body.classList.contains('light'));

  const date        = new Date();
  const year        = date.getFullYear();
  const monthIndex  = date.getMonth();
  const todayNum    = date.getDate();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const fullDateText= date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const monthName   = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
  const daysGone    = todayNum - 1;
  const daysLeft    = daysInMonth - todayNum;

  let thisMonthCompleted = 0;
  const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  Object.keys(taskHistory).forEach(k => { if (k.startsWith(prefix)) thisMonthCompleted += taskHistory[k]; });

  const last7Labels = [], last7Data = [];
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
      fill: true, data: last7Data,
      borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)',
      borderWidth: 2.5, tension: 0.4,
      pointBackgroundColor: isDark ? '#070b14' : '#fff',
      pointBorderColor: '#00d4ff', pointBorderWidth: 2, pointRadius: 4,
    }],
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: Math.max(5, ...last7Data) + 1,
           grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' },
           ticks: { color: isDark ? '#6b7fa3' : '#8090b0', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: isDark ? '#6b7fa3' : '#8090b0', font: { size: 10 } } },
    },
    interaction: { intersect: false, mode: 'index' },
  };

  /* ── Daily task state (merged from DailyFocus) ──────────────── */
  const [tasks, setTasks] = useState(() => {
    const saved    = localStorage.getItem('evoLifeTasks');
    const lastDate = localStorage.getItem('evoLifeLastDate');
    const today    = new Date().toLocaleDateString();
    let initial    = saved ? JSON.parse(saved) : [];
    if (lastDate !== today) {
      initial = initial.map(t => ({ ...t, completed: false }));
      localStorage.setItem('evoLifeLastDate', today);
    } else if (!lastDate) {
      localStorage.setItem('evoLifeLastDate', today);
    }
    return initial;
  });
  const [newTask, setNewTask] = useState('');

  useEffect(() => { localStorage.setItem('evoLifeTasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => {
    const completed = tasks.filter(t => t.completed).length;
    const d   = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const hist = JSON.parse(localStorage.getItem('evoLifeTaskHistory') || '{}');
    hist[key] = completed;
    localStorage.setItem('evoLifeTaskHistory', JSON.stringify(hist));
  }, [tasks]);

  const addTask    = () => {
    if (newTask.trim() && tasks.length < 10) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };
  const toggleTask = id => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = id => setTasks(tasks.filter(t => t.id !== id));

  const completed = tasks.filter(t => t.completed).length;
  const total     = tasks.length || 1;
  const pct       = Math.round((completed / total) * 100);

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="screen" style={{ position: 'relative' }}>
      <div className="welcome-wrap stagger">

        {/* ── Hero heading (no profile icon) ──────────────────── */}
        <div className="welcome-hero animate-fadeUp">
          <div>
            <h1>Your Journey</h1>
            <p>{fullDateText}</p>
          </div>
        </div>

        {/* ── This Week's Tasks mini chart ─────────────────────── */}
        <div className="card mini-chart-card animate-fadeUp"
          onClick={() => setActiveTab && setActiveTab(0)}>
          <div className="mini-chart-header">
            <span>This Week's Tasks</span>
            <i className="ri-bar-chart-2-line" />
          </div>
          <div style={{ height: '130px' }}>
            <Line data={chartData} options={chartOpts} />
          </div>
        </div>

        {/* ── Monthly calendar ─────────────────────────────────── */}
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
              else if (hasTasks)   cls += ' done';
              else if (day < todayNum) cls += ' past';
              return <div key={day} className={cls}>{day}</div>;
            })}
          </div>
        </div>

        {/* ── Month stats ──────────────────────────────────────── */}
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

        {/* ── Daily Focus task section ──────────────────────────── */}
        <div className="animate-fadeUp">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <h2 className="heading" style={{ fontSize:'1rem' }}>
              <i className="ri-focus-3-line" style={{ color:'var(--cyan)', marginRight:'8px' }} />
              Today's Habits
            </h2>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span className="chip chip-cyan">{tasks.length}/10</span>
              <span style={{ fontSize:'0.78rem', color:'var(--cyan)', fontWeight:700 }}>{pct}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="progress-track" style={{ marginBottom:'16px' }}>
            <div className="progress-fill" style={{ width:`${pct}%` }} />
          </div>

          {/* Task input */}
          <div className="task-add-row">
            <input
              type="text" placeholder="Add a new habit…" maxLength={40}
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              style={{ fontSize:'16px' }}
            />
            <button className="add-btn icon-btn-touch" onClick={addTask}
              disabled={!newTask.trim() || tasks.length >= 10}>
              <i className="ri-add-line" />
            </button>
          </div>

          {/* Task list */}
          <div className="task-list" style={{ marginTop:'12px' }}>
            {tasks.length === 0 && (
              <div className="empty-state">
                <i className="ri-checkbox-blank-circle-line" />
                <p>No habits yet. Add your first one!</p>
              </div>
            )}
            {tasks.map((task, i) => (
              <div key={task.id}
                className={`task-item ${task.completed ? 'done' : ''}`}
                style={{ animationDelay:`${i * 40}ms`, minHeight:'52px' }}>
                <div className="task-left" onClick={() => toggleTask(task.id)} style={{ minHeight:'44px' }}>
                  <div className="check-ring">
                    {task.completed && <i className="ri-check-line" />}
                  </div>
                  <span className="task-text">{task.text}</span>
                </div>
                <button className="del-btn icon-btn-touch"
                  onClick={e => { e.stopPropagation(); deleteTask(task.id); }}>
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default WelcomeScreen;