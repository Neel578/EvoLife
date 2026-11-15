import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { parseTimeString, formatTimeString } from '../utils/notificationService';
import './TaskAlarmModal.css';

const emptySubscribe = () => () => {};

function ModalPortal({ children }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

const PRESETS = [
  { label: 'Morning', time: '07:00 AM', tag: '07:00 AM' },
  { label: 'Noon',    time: '12:00 PM', tag: '12:00 PM' },
  { label: 'Evening', time: '06:00 PM', tag: '06:00 PM' },
  { label: 'Night',   time: '09:00 PM', tag: '09:00 PM' },
];

const DURATION_PRESETS = [
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '45m', value: '45m' },
  { label: '1h 00m', value: '1h 00m' },
  { label: '1h 30m', value: '1h 30m' },
  { label: '2h 00m', value: '2h 00m' },
];

export default function TaskAlarmModal({
  task,
  initialMode = 'prompt',
  onClose,
  onSave,
  onDeleteAlarm,
}) {
  const [mode, setMode] = useState(initialMode);

  // Parse initial time or default to 08:00 AM
  const parsed = parseTimeString(task?.alarmTime || '08:00 AM') || { hour: 8, minute: 0 };
  const initialPeriod = parsed.hour >= 12 ? 'PM' : 'AM';
  let initialHour12 = parsed.hour % 12;
  if (initialHour12 === 0) initialHour12 = 12;

  const [hour, setHour] = useState(initialHour12);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(initialPeriod);
  const [enabled, setEnabled] = useState(task?.alarmEnabled !== false);
  const [duration, setDuration] = useState(task?.duration || null);

  // Compute formatted time string
  let hour24 = hour % 12;
  if (period === 'PM') hour24 += 12;
  const formattedTime = formatTimeString(hour24, minute);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const stepHour = (delta) => {
    setHour((prev) => {
      let next = prev + delta;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  };

  const stepMinute = (delta) => {
    setMinute((prev) => {
      let next = prev + delta;
      if (next >= 60) next = 0;
      if (next < 0) next = 55;
      return next;
    });
  };

  const applyPreset = (presetTime) => {
    const p = parseTimeString(presetTime);
    if (!p) return;
    const prd = p.hour >= 12 ? 'PM' : 'AM';
    let h12 = p.hour % 12;
    if (h12 === 0) h12 = 12;
    setHour(h12);
    setMinute(p.minute);
    setPeriod(prd);
  };

  const handleSave = () => {
    onSave({
      alarmTime: formattedTime,
      alarmEnabled: enabled,
      duration: duration || null,
    });
  };

  const handleClearTime = () => {
    if (onDeleteAlarm) {
      onDeleteAlarm();
    } else {
      onSave({
        alarmTime: null,
        alarmEnabled: false,
        duration: null,
      });
    }
  };

  const taskTitle = task?.text || task?.title || 'Habit';

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose}>
        <div className="alarm-modal-box" onClick={(e) => e.stopPropagation()}>
          {mode === 'prompt' ? (
            /* ── Mode 1: Post-Add Alarm Prompt ── */
            <div className="alarm-prompt-content">
              <div className="alarm-bell-icon-wrap">
                <i className="ri-alarm-line"></i>
              </div>

              <h2 className="alarm-prompt-title">
                Set a daily alarm for{' '}
                <span className="alarm-task-highlight">"{taskTitle}"</span>?
              </h2>

              <p className="alarm-prompt-desc">
                Get a native reminder at the exact time so you never miss this habit!
              </p>

              <div className="alarm-prompt-actions">
                <button className="btn-ghost" onClick={onClose}>
                  No, skip
                </button>
                <button className="btn-primary" onClick={() => setMode('picker')}>
                  <i className="ri-notification-3-line" style={{ marginRight: '6px' }}></i>
                  Yes, set alarm
                </button>
              </div>
            </div>
          ) : (
            /* ── Mode 2: Interactive Time Picker ── */
            <div>
              <div className="alarm-picker-header">
                <div className="alarm-picker-title-group">
                  <h3>Set Daily Alarm</h3>
                  <div className="alarm-picker-task-tag">
                    <i className="ri-checkbox-circle-line"></i>
                    <span>{taskTitle}</span>
                  </div>
                </div>
                <button className="modal-close" onClick={onClose} aria-label="Close">
                  <i className="ri-close-line"></i>
                </button>
              </div>

              {/* Digital Stepper Clock */}
              <div className="alarm-digital-clock">
                <div className="alarm-digits-col">
                  <button className="alarm-stepper-btn" onClick={() => stepHour(1)} aria-label="Increase hour">
                    <i className="ri-arrow-up-s-line"></i>
                  </button>
                  <span className="alarm-digits-display">{String(hour).padStart(2, '0')}</span>
                  <button className="alarm-stepper-btn" onClick={() => stepHour(-1)} aria-label="Decrease hour">
                    <i className="ri-arrow-down-s-line"></i>
                  </button>
                </div>
                <span className="alarm-colon">:</span>
                <div className="alarm-digits-col">
                  <button className="alarm-stepper-btn" onClick={() => stepMinute(5)} aria-label="Increase minutes">
                    <i className="ri-arrow-up-s-line"></i>
                  </button>
                  <span className="alarm-digits-display">{String(minute).padStart(2, '0')}</span>
                  <button className="alarm-stepper-btn" onClick={() => stepMinute(-5)} aria-label="Decrease minutes">
                    <i className="ri-arrow-down-s-line"></i>
                  </button>
                </div>
                <div className="alarm-ampm-col">
                  <button type="button" className={`alarm-ampm-btn ${period === 'AM' ? 'active' : ''}`} onClick={() => setPeriod('AM')}>AM</button>
                  <button type="button" className={`alarm-ampm-btn ${period === 'PM' ? 'active' : ''}`} onClick={() => setPeriod('PM')}>PM</button>
                </div>
              </div>

              {/* Quick Time Presets */}
              <div className="alarm-presets-section">
                <span className="alarm-presets-label">Quick Presets</span>
                <div className="alarm-presets-grid">
                  {PRESETS.map((p) => (
                    <button key={p.time} type="button" className="alarm-preset-btn" onClick={() => applyPreset(p.time)}>
                      <span className="alarm-preset-time">{p.tag}</span>
                      <span className="alarm-preset-tag">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Duration (optional) */}
              <div className="alarm-presets-section">
                <span className="alarm-presets-label">Session Duration (optional)</span>
                <div className="alarm-duration-grid">
                  {DURATION_PRESETS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      className={`alarm-duration-btn ${duration === d.value ? 'active' : ''}`}
                      onClick={() => setDuration(duration === d.value ? null : d.value)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Preview */}
              <div className="alarm-preview-card">
                <div className="alarm-preview-icon">
                  <i className="ri-notification-line"></i>
                </div>
                <div className="alarm-preview-info">
                  <div className="alarm-preview-title">
                    ⏰ EvoLife: {taskTitle}
                  </div>
                  <div className="alarm-preview-body">
                    It's {formattedTime} — time for your "{taskTitle}" habit!
                    {duration && ` (${duration} session)`}
                  </div>
                </div>
              </div>

              {/* Toggle & Remove – only show for existing tasks with alarm */}
              {task?.alarmTime && task?.id !== '__preselect__' && (
                <div className="alarm-controls-row">
                  <label className="alarm-toggle-label">
                    <input
                      type="checkbox"
                      className="alarm-toggle-input"
                      checked={enabled}
                      onChange={(e) => setEnabled(e.target.checked)}
                    />
                    <span>Alarm {enabled ? 'Enabled' : 'Paused'}</span>
                  </label>
                  <button type="button" className="alarm-remove-btn" onClick={handleClearTime}>
                    <i className="ri-delete-bin-line"></i>
                    Clear Time
                  </button>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="alarm-picker-actions">
                <button type="button" className="btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleSave}>
                  <i className="ri-check-line" style={{ marginRight: '6px' }}></i>
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
