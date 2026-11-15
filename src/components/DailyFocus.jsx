import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Filler,
} from 'chart.js';
import { scheduleTaskAlarm, cancelTaskAlarm } from '../utils/notificationService';
import TaskAlarmModal from './TaskAlarmModal';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

/* ── Duration helpers ──────────────────────────────────────── */
function formatDuration(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function parseDurationToSec(dur) {
  if (!dur) return 0;
  const hMatch = dur.match(/(\d+)\s*h/);
  const mMatch = dur.match(/(\d+)\s*m/);
  const hours = hMatch ? parseInt(hMatch[1], 10) : 0;
  const mins = mMatch ? parseInt(mMatch[1], 10) : 0;
  return hours * 3600 + mins * 60;
}

/* ── Live Countdown Timer Hook ──────────────────────────────── */
function useCountdown() {
  const [timers, setTimers] = useState({});
  const intervalsRef = useRef({});

  const startTimer = useCallback((taskId, durationSec) => {
    // Clear existing interval if any
    if (intervalsRef.current[taskId]) clearInterval(intervalsRef.current[taskId]);

    const endTime = Date.now() + durationSec * 1000;
    setTimers(prev => ({ ...prev, [taskId]: { remaining: durationSec, running: true, endTime } }));

    intervalsRef.current[taskId] = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(intervalsRef.current[taskId]);
        delete intervalsRef.current[taskId];
        setTimers(prev => {
          const copy = { ...prev };
          delete copy[taskId];
          return copy;
        });
      } else {
        setTimers(prev => ({
          ...prev,
          [taskId]: { ...prev[taskId], remaining, running: true }
        }));
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback((taskId) => {
    if (intervalsRef.current[taskId]) {
      clearInterval(intervalsRef.current[taskId]);
      delete intervalsRef.current[taskId];
    }
    setTimers(prev => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const intervals = intervalsRef.current;
    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, []);

  return { timers, startTimer, stopTimer };
}

/* ═══════════════════════════════════════════════════════════════ */
/*  DailyFocus Component                                         */
/* ═══════════════════════════════════════════════════════════════ */
function DailyFocus() {
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
  const [preSelectedTime, setPreSelectedTime] = useState(null);  // inline "Add a time" pill
  const [preSelectedDuration, setPreSelectedDuration] = useState(null);
  const [alarmModalTask, setAlarmModalTask] = useState(null);
  const [alarmModalMode, setAlarmModalMode] = useState('picker');
  const { timers, startTimer, stopTimer } = useCountdown();

  // Persist tasks
  useEffect(() => { localStorage.setItem('evoLifeTasks', JSON.stringify(tasks)); }, [tasks]);

  // Update daily history
  useEffect(() => {
    const completed = tasks.filter(t => t.completed).length;
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const hist = JSON.parse(localStorage.getItem('evoLifeTaskHistory') || '{}');
    hist[key] = completed;
    localStorage.setItem('evoLifeTaskHistory', JSON.stringify(hist));
  }, [tasks]);

  /* ── Add Task ──────────────────────────────────────────────── */
  const addTask = async () => {
    if (!newTask.trim() || tasks.length >= 10) return;

    const taskObj = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      alarmTime: preSelectedTime || null,
      alarmEnabled: !!preSelectedTime,
      duration: preSelectedDuration || null,
    };

    setTasks(prev => [...prev, taskObj]);
    setNewTask('');

    if (preSelectedTime) {
      // Time was pre-selected via the inline pill — schedule immediately
      await scheduleTaskAlarm(taskObj.id, taskObj.text, preSelectedTime);
      setPreSelectedTime(null);
      setPreSelectedDuration(null);
    } else {
      // No pre-selected time — open the post-add prompt
      setAlarmModalTask(taskObj);
      setAlarmModalMode('prompt');
    }
  };

  /* ── Task operations ───────────────────────────────────────── */
  const toggleTask = id => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

  const deleteTask = (id) => {
    cancelTaskAlarm(id);
    stopTimer(id);
    setTasks(tasks.filter(t => t.id !== id));
    if (alarmModalTask?.id === id) setAlarmModalTask(null);
  };

  const openAlarmModal = (task, mode = 'picker') => {
    setAlarmModalTask(task);
    setAlarmModalMode(mode);
  };

  /* ── Alarm save / delete callbacks ─────────────────────────── */
  const handleSaveAlarm = async ({ alarmTime, alarmEnabled, duration }) => {
    if (!alarmModalTask) return;
    const taskId = alarmModalTask.id;
    const taskTitle = alarmModalTask.text;

    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, alarmTime, alarmEnabled, duration: duration !== undefined ? duration : t.duration }
        : t
    ));

    if (alarmEnabled && alarmTime) {
      await scheduleTaskAlarm(taskId, taskTitle, alarmTime);
    } else {
      await cancelTaskAlarm(taskId);
    }
    setAlarmModalTask(null);
  };

  const handleDeleteAlarm = async () => {
    if (!alarmModalTask) return;
    await cancelTaskAlarm(alarmModalTask.id);
    setTasks(prev => prev.map(t =>
      t.id === alarmModalTask.id ? { ...t, alarmTime: null, alarmEnabled: false, duration: null } : t
    ));
    setAlarmModalTask(null);
  };

  /* ── Pre-select time via inline pill ───────────────────────── */
  const handleInlineTimeSave = ({ alarmTime, duration }) => {
    setPreSelectedTime(alarmTime);
    setPreSelectedDuration(duration || null);
    setAlarmModalTask(null);
  };

  /* ── Timer start/stop on habit card ────────────────────────── */
  const handleStartTimer = (task) => {
    const sec = parseDurationToSec(task.duration);
    if (sec > 0) startTimer(task.id, sec);
  };

  /* ── Stats & chart ─────────────────────────────────────────── */
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length || 1;
  const pct = Math.round((completed / total) * 100);
  const todayText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isDark = !document.body.classList.contains('light');

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

  /* ═══════════════════════════════════════════════════════════ */
  /*  RENDER                                                    */
  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="screen">
      <div className="app-wrap">
        {/* Header */}
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
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
          {/* ── Task List Card ──────────────────────────────────── */}
          <div className="card animate-fadeUp" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 className="heading" style={{ fontSize: '1rem' }}>
                <i className="ri-list-check" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i>Today's Habits
              </h2>
              <span className="chip chip-cyan">{tasks.length}/10</span>
            </div>

            {/* ── Input Row with inline "Add a time" pill ──────── */}
            <div className="task-add-row-v2">
              <div className="task-input-wrap">
                <input
                  type="text"
                  placeholder="Add a new habit…"
                  maxLength={40}
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  style={{ fontSize: '16px' }}
                />
                {/* Inside right side of input: visible cyan-outlined pill button */}
                <button
                  type="button"
                  className={`inline-time-pill ${preSelectedTime ? 'has-time' : ''}`}
                  onClick={() => {
                    setAlarmModalTask({
                      id: '__preselect__',
                      text: newTask.trim() || 'New Habit',
                      alarmTime: preSelectedTime,
                      duration: preSelectedDuration,
                    });
                    setAlarmModalMode('picker');
                  }}
                  title="Schedule a time for this habit"
                >
                  🕒 {preSelectedTime || 'Add a time'}
                </button>
              </div>
              <button
                className="add-btn icon-btn-touch"
                onClick={addTask}
                disabled={!newTask.trim() || tasks.length >= 10}
                title="Add habit"
              >
                <i className="ri-add-line"></i>
              </button>
            </div>

            {/* ── Task List ────────────────────────────────────── */}
            <div className="task-list">
              {tasks.length === 0 && (
                <div className="empty-state">
                  <i className="ri-checkbox-blank-circle-line"></i>
                  <p>No habits yet. Add your first one!</p>
                </div>
              )}

              {tasks.map((task, i) => {
                const hasTime = !!task.alarmTime;
                const hasDuration = !!task.duration;
                const activeTimer = timers[task.id];

                return (
                  <div
                    key={task.id}
                    className={`task-item ${task.completed ? 'done' : ''} ${hasTime ? 'task-timed' : ''}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Left: Check + Title */}
                    <div className="task-left" onClick={() => toggleTask(task.id)}>
                      <div className="check-ring">
                        {task.completed && <i className="ri-check-line"></i>}
                      </div>
                      <span className="task-text">{task.text}</span>

                      {/* Live running countdown timer if active */}
                      {activeTimer && (
                        <span
                          className="task-timer-live"
                          onClick={(e) => { e.stopPropagation(); stopTimer(task.id); }}
                          title="Click to stop countdown timer"
                        >
                          <i className="ri-stop-circle-line"></i>
                          {formatDuration(activeTimer.remaining)}
                        </span>
                      )}
                    </div>

                    {/* Right: Actions — ALWAYS VISIBLE INLINE BUTTONS */}
                    <div className="task-actions">
                      {hasTime ? (
                        <button
                          type="button"
                          className={`habit-row-time-pill has-time ${task.alarmEnabled !== false ? '' : 'paused'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            openAlarmModal(task, 'picker');
                          }}
                          title="Tap to edit alarm time & duration"
                        >
                          🕒 {task.alarmTime}
                          {hasDuration && (
                            <span
                              className="pill-duration-tag"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!activeTimer) handleStartTimer(task);
                                else stopTimer(task.id);
                              }}
                              title={activeTimer ? "Stop timer" : "Start timer"}
                            >
                              {task.duration}
                            </span>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="habit-row-time-pill no-time"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAlarmModal(task, 'picker');
                          }}
                          title="Set alarm time & duration"
                        >
                          + Add Time
                        </button>
                      )}

                      <button
                        type="button"
                        className="del-btn icon-btn-touch"
                        onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                        title="Delete habit"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Chart Card ─────────────────────────────────────── */}
          <div className="card animate-fadeUp" style={{ padding: '20px', animationDelay: '80ms' }}>
            <h2 className="heading" style={{ fontSize: '1rem', marginBottom: '16px' }}>
              <i className="ri-bar-chart-2-line" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i>Weekly Growth
            </h2>
            <div style={{ height: '200px', position: 'relative', minHeight: '200px' }}>
              <Line data={chartData} options={chartOpts} />
            </div>
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

        {/* ── Task Alarm Modal ─────────────────────────────────── */}
        {alarmModalTask && (
          <TaskAlarmModal
            task={alarmModalTask}
            initialMode={alarmModalMode}
            onClose={() => {
              setAlarmModalTask(null);
            }}
            onSave={(result) => {
              if (alarmModalTask.id === '__preselect__') {
                handleInlineTimeSave(result);
              } else {
                handleSaveAlarm(result);
              }
            }}
            onDeleteAlarm={alarmModalTask.id === '__preselect__' ? undefined : handleDeleteAlarm}
          />
        )}
      </div>
    </div>
  );
}

export default DailyFocus;
