import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

function DailyFocus({ setCurrentScreen }) {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('evoLifeTasks');
    const lastDate = localStorage.getItem('evoLifeLastDate');
    const today = new Date().toLocaleDateString();
    let initial = saved ? JSON.parse(saved) : [];
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
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const hist = JSON.parse(localStorage.getItem('evoLifeTaskHistory') || '{}');
    hist[key] = completed;
    localStorage.setItem('evoLifeTaskHistory', JSON.stringify(hist));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim() && tasks.length < 10) {
      setTasks([...tasks, { id: Date.now(), text: newTask.trim(), completed: false }]);
      setNewTask('');
    }
  };
  const toggleTask = id => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = id => setTasks(tasks.filter(t => t.id !== id));

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length || 1;
  const pct = Math.round((completed / total) * 100);

  const todayText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isDark = !document.body.classList.contains('light');

  // Build last-7-days data
  const hist = JSON.parse(localStorage.getItem('evoLifeTaskHistory') || '{}');
  const labels = []; const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    data.push(hist[k] || 0);
  }

  const chartData = {
    labels, datasets: [{
      fill: true, label: 'Tasks', data,
      borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)',
      borderWidth: 2.5, tension: 0.4,
      pointBackgroundColor: isDark ? '#070b14' : '#fff',
      pointBorderColor: '#00d4ff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
    }]
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }, ticks: { color: '#6b7fa3', font: { size: 10 } } },
      x: { grid: { display: false }, ticks: { color: '#6b7fa3', font: { size: 10 } } }
    },
    interaction: { intersect: false, mode: 'index' },
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
              <h1 className="display grad-text">Daily Focus</h1>
              <p>{todayText}</p>
            </div>
          </div>
          <div className="app-header-right">
            <div className="card" style={{ padding: '12px 16px', minWidth: '160px' }}>
              <div className="progress-row">
                <span className="label">Progress</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--cyan)' }}>{pct}%</span>
              </div>
              <div className="progress-track" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${pct}%` }}></div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--muted)' }}>{completed} of {tasks.length} done</div>
            </div>
          </div>
        </div>

        <div className="focus-grid">
          {/* Task list */}
          <div className="card animate-fadeUp" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 className="heading" style={{ fontSize: '1rem' }}><i className="ri-list-check" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i>Today's Habits</h2>
              <span className="chip chip-cyan">{tasks.length}/10</span>
            </div>

            <div className="task-add-row">
              <input
                type="text" placeholder="Add a new habit…" maxLength={40}
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <button className="add-btn" onClick={addTask}>
                <i className="ri-add-line"></i>
              </button>
            </div>

            <div className="task-list">
              {tasks.length === 0 && (
                <div className="empty-state">
                  <i className="ri-checkbox-blank-circle-line"></i>
                  <p>No habits yet. Add your first one!</p>
                </div>
              )}
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  className={`task-item ${task.completed ? 'done' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="task-left" onClick={() => toggleTask(task.id)}>
                    <div className="check-ring">
                      {task.completed && <i className="ri-check-line"></i>}
                    </div>
                    <span className="task-text">{task.text}</span>
                  </div>
                  <button className="del-btn" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}>
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="card animate-fadeUp" style={{ padding: '20px', animationDelay: '80ms' }}>
            <h2 className="heading" style={{ fontSize: '1rem', marginBottom: '16px' }}>
              <i className="ri-bar-chart-2-line" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i>Weekly Growth
            </h2>
            <div style={{ height: '200px' }}>
              <Line data={chartData} options={chartOpts} />
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
              <div style={{ background: 'var(--cyan-dim)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--cyan)' }}>{completed}</div>
                <div className="label">Completed</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>{tasks.length - completed}</div>
                <div className="label">Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyFocus;