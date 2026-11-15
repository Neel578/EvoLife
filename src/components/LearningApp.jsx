import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const emptySubscribe = () => () => {};

// ---------- React Portal Wrapper to escape all parent stacking contexts ----------
function ModalPortal({ children }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

// ---------- Reusable Portal-based Modal Backdrop & Box ----------
function ModalBackdrop({ children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          animation: 'fadeIn 0.2s ease both',
        }}
      >
        <div
          className="modal-box"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '480px',
            background: 'var(--bg-2, #0d1526)',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
            borderRadius: 'var(--radius-xl, 24px)',
            padding: '28px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(167,139,250,0.18)',
            animation: 'scaleIn 0.25s var(--spring) both',
            position: 'relative',
            zIndex: 100000,
          }}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  );
}

// ---------- Simple Prompt Modal (For Chapters & Topics) ----------
function PromptModal({ title, subtitle, placeholder, confirmLabel = 'Add', onConfirm, onCancel }) {
  const [value, setValue] = useState('');
  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="modal-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>{subtitle}</p>}
        </div>
        <button className="modal-close" onClick={onCancel} aria-label="Close modal">
          <i className="ri-close-line"></i>
        </button>
      </div>
      <input
        autoFocus
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && value.trim() && onConfirm(value.trim())}
        style={{ marginBottom: '20px', fontSize: '16px' }}
      />
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
        <button
          className="btn-primary btn-purple"
          style={{ flex: 1 }}
          disabled={!value.trim()}
          onClick={() => value.trim() && onConfirm(value.trim())}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ---------- Confirm Deletion Modal ----------
function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="modal-close" onClick={onCancel} aria-label="Close modal">
          <i className="ri-close-line"></i>
        </button>
      </div>
      {message && <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5 }}>{message}</p>}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
        <button
          className="btn-primary btn-red"
          style={{ flex: 1 }}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalBackdrop>
  );
}

// ---------- Dedicated Add Study Course Modal ----------
const COURSE_CATEGORIES = ['Technology', 'Academics', 'Language', 'Science', 'Business', 'General'];

function AddCourseModal({ onConfirm, onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!title.trim()) return;
    onConfirm({
      title: title.trim(),
      category,
      goal: goal.trim(),
    });
  };

  return (
    <ModalBackdrop onClose={onCancel}>
      <div className="modal-header" style={{ marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'var(--purple-dim, rgba(167,139,250,0.15))',
              color: 'var(--purple, #a78bfa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem'
            }}>
              <i className="ri-book-read-line"></i>
            </span>
            <h2>New Study Course</h2>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Add a course or subject to track your study goals.
          </p>
        </div>
        <button className="modal-close" onClick={onCancel} aria-label="Close modal">
          <i className="ri-close-line"></i>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="label" style={{ marginBottom: '6px', display: 'block' }}>Course / Subject Title</label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. React & TypeScript, Calculus I, Spanish B1"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ fontSize: '16px' }}
            required
          />
        </div>

        <div>
          <label className="label" style={{ marginBottom: '8px', display: 'block' }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {COURSE_CATEGORIES.map(cat => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '99px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: isSelected ? '1px solid var(--purple)' : '1px solid var(--glass-border)',
                    background: isSelected ? 'var(--purple-dim, rgba(167,139,250,0.18))' : 'var(--glass)',
                    color: isSelected ? 'var(--purple, #a78bfa)' : 'var(--muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label" style={{ marginBottom: '6px', display: 'block' }}>Goal or Notes (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Finish 10 chapters by end of month"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            style={{ fontSize: '15px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary btn-purple"
            style={{ flex: 1 }}
            disabled={!title.trim()}
          >
            Create Course
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ---------- Main Mental Growth Component ----------
function LearningApp() {
  const [courses, setCourses] = useState(() => {
    const s = localStorage.getItem('evoLifeLearning');
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      // Filter out legacy "Project Planning" items so only study courses remain
      return Array.isArray(parsed) ? parsed.filter(c => c.type !== 'Project Planning') : [];
    } catch {
      return [];
    }
  });

  const [view, setView] = useState('dashboard'); // 'dashboard' | 'course'
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  // Modal states for chapter/topic/deletion
  const [promptModal, setPromptModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    localStorage.setItem('evoLifeLearning', JSON.stringify(courses));
  }, [courses]);

  const activeCourse = courses.find(c => c.id === activeCourseId);

  // Create course handler
  const handleCreateCourse = ({ title, category, goal }) => {
    const newCourse = {
      id: Date.now(),
      title,
      category: category || 'Technology',
      goal: goal || '',
      type: 'Study Planning',
      chapters: [],
      createdAt: new Date().toISOString()
    };
    setCourses(prev => [newCourse, ...prev]);
    setShowAddCourseModal(false);
  };

  // Delete course handler
  const handleDeleteCourse = (id, e) => {
    e?.stopPropagation();
    setConfirmModal({
      title: 'Delete Course?',
      message: 'This course and all its chapters will be permanently removed.',
      onConfirm: () => {
        setCourses(prev => prev.filter(c => c.id !== id));
        if (activeCourseId === id) {
          setView('dashboard');
          setActiveCourseId(null);
        }
        setConfirmModal(null);
      }
    });
  };

  // Open course handler
  const handleOpenCourse = (c) => {
    setActiveCourseId(c.id);
    setView('course');
  };

  // Calculate course progress
  const calcProg = (c) => {
    if (!c?.chapters || c.chapters.length === 0) return 0;
    let tot = 0, done = 0;
    c.chapters.forEach(ch => {
      tot += ch.topics.length;
      done += ch.topics.filter(t => t.completed).length;
    });
    return tot === 0 ? 0 : Math.round((done / tot) * 100);
  };

  // Chapter handlers
  const handleAddChapter = () => {
    setPromptModal({
      title: 'New Chapter',
      subtitle: 'Organize your topics into study modules',
      placeholder: 'e.g. Chapter 1: Foundations',
      confirmLabel: 'Add Chapter',
      onConfirm: (name) => {
        setCourses(prev => prev.map(c => c.id === activeCourseId
          ? { ...c, chapters: [...c.chapters, { id: Date.now(), title: name, topics: [] }] }
          : c
        ));
        setPromptModal(null);
      }
    });
  };

  const handleDeleteChapter = (chapterId, e) => {
    e?.stopPropagation();
    setConfirmModal({
      title: 'Delete Chapter?',
      message: 'This chapter and its topics will be removed from the course.',
      onConfirm: () => {
        setCourses(prev => prev.map(c => c.id === activeCourseId
          ? { ...c, chapters: c.chapters.filter(ch => ch.id !== chapterId) }
          : c
        ));
        setConfirmModal(null);
      }
    });
  };

  // Topic handlers
  const handleAddTopic = (chapterId) => {
    setPromptModal({
      title: 'New Topic',
      subtitle: 'Add a topic or lesson to study',
      placeholder: 'e.g. Async / Await and Promises',
      confirmLabel: 'Add Topic',
      onConfirm: (name) => {
        setCourses(prev => prev.map(c => c.id !== activeCourseId ? c : {
          ...c,
          chapters: c.chapters.map(ch => ch.id === chapterId
            ? { ...ch, topics: [...ch.topics, { id: Date.now(), title: name, completed: false }] }
            : ch
          )
        }));
        setPromptModal(null);
      }
    });
  };

  const handleToggleTopic = (chapterId, topicId) => {
    setCourses(prev => prev.map(c => c.id !== activeCourseId ? c : {
      ...c,
      chapters: c.chapters.map(ch => ch.id !== chapterId ? ch : {
        ...ch,
        topics: ch.topics.map(t => t.id === topicId ? { ...t, completed: !t.completed } : t)
      })
    }));
  };

  const handleDeleteTopic = (chapterId, topicId, e) => {
    e?.stopPropagation();
    setCourses(prev => prev.map(c => c.id !== activeCourseId ? c : {
      ...c,
      chapters: c.chapters.map(ch => ch.id !== chapterId ? ch : {
        ...ch,
        topics: ch.topics.filter(t => t.id !== topicId)
      })
    }));
  };

  // Modals Container
  const renderModals = () => (
    <>
      {showAddCourseModal && (
        <AddCourseModal
          onConfirm={handleCreateCourse}
          onCancel={() => setShowAddCourseModal(false)}
        />
      )}
      {promptModal && (
        <PromptModal
          title={promptModal.title}
          subtitle={promptModal.subtitle}
          placeholder={promptModal.placeholder}
          confirmLabel={promptModal.confirmLabel}
          onConfirm={promptModal.onConfirm}
          onCancel={() => setPromptModal(null)}
        />
      )}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </>
  );

  // ── DASHBOARD VIEW ─────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <div className="screen">
        <div className="app-wrap">
          {/* Header */}
          <div className="app-header animate-fadeUp">
            <div className="app-header-left">
              <div className="app-title-block">
                <h1 className="display grad-purple">Mental Growth</h1>
                <p>Study & Learning</p>
              </div>
            </div>
            <div className="app-header-right">
              <button
                className="btn-primary btn-purple btn-sm"
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowAddCourseModal(true)}
              >
                <i className="ri-add-line"></i> + Add
              </button>
            </div>
          </div>

          {/* Course List or Empty State */}
          {courses.length === 0 ? (
            <div
              className="empty-state card animate-fadeUp"
              style={{ padding: '48px 20px', cursor: 'pointer', textAlign: 'center' }}
              onClick={() => setShowAddCourseModal(true)}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'var(--purple-dim, rgba(167,139,250,0.12))',
                color: 'var(--purple, #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                margin: '0 auto 16px',
                border: '1px solid rgba(167,139,250,0.25)'
              }}>
                <i className="ri-book-open-line"></i>
              </div>
              <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-h, #f0f4ff)' }}>
                No courses or study goals yet.
              </p>
              <p style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--muted, #6b7fa3)' }}>
                Tap "+ Add" to get started!
              </p>
              <button
                className="btn-primary btn-purple btn-sm"
                style={{ marginTop: '18px', display: 'inline-flex', width: 'auto', marginInline: 'auto' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddCourseModal(true);
                }}
              >
                <i className="ri-add-line"></i> + Add Course
              </button>
            </div>
          ) : (
            <div className="course-grid animate-fadeUp">
              {courses.map((c, i) => {
                const prog = calcProg(c);
                const totalTopics = c.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
                const doneTopics = c.chapters.reduce((sum, ch) => sum + ch.topics.filter(t => t.completed).length, 0);

                return (
                  <div
                    key={c.id}
                    className="course-card"
                    style={{ animationDelay: `${i * 60}ms` }}
                    onClick={() => handleOpenCourse(c)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span className="chip chip-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <i className="ri-book-read-line"></i>
                        {c.category || 'Study Course'}
                      </span>
                      <button
                        className="icon-btn-touch"
                        style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onClick={e => handleDeleteCourse(c.id, e)}
                        title="Delete course"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>

                    <div>
                      <div className="course-title" style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{c.title}</div>
                      {c.goal && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '8px' }}>
                          {c.goal}
                        </p>
                      )}
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '6px' }}>
                        <span>{doneTopics}/{totalTopics} topics</span>
                        <span style={{ color: 'var(--purple)', fontWeight: 700 }}>{prog}%</span>
                      </div>
                      <div className="progress-track" style={{ height: '7px' }}>
                        <div
                          className="progress-fill"
                          style={{
                            width: `${prog}%`,
                            background: 'linear-gradient(90deg, var(--purple, #a78bfa), var(--cyan, #00d4ff))'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  // ── COURSE DETAIL VIEW ─────────────────────────────────────
  if (view === 'course' && activeCourse) {
    const prog = calcProg(activeCourse);
    const totalTopics = activeCourse.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
    const doneTopics = activeCourse.chapters.reduce((sum, ch) => sum + ch.topics.filter(t => t.completed).length, 0);

    return (
      <div className="screen">
        <div className="app-wrap">
          {/* Header */}
          <div className="app-header animate-fadeUp">
            <div className="app-header-left">
              <button
                className="back-btn"
                onClick={() => setView('dashboard')}
                style={{ cursor: 'pointer' }}
              >
                <i className="ri-arrow-left-line"></i> Dashboard
              </button>
              <div className="app-title-block">
                <h1 className="display" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)' }}>
                  {activeCourse.title}
                </h1>
                {activeCourse.category && (
                  <p style={{ color: 'var(--purple)', fontWeight: 600 }}>{activeCourse.category}</p>
                )}
              </div>
            </div>
            <div className="app-header-right">
              <button
                className="btn-primary btn-purple btn-sm"
                style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleAddChapter}
              >
                <i className="ri-add-line"></i> + Chapter
              </button>
            </div>
          </div>

          {/* Progress Card */}
          <div className="card animate-fadeUp" style={{ padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
                Course Completion ({doneTopics} of {totalTopics} topics)
              </span>
              <span style={{ fontSize: '1rem', color: 'var(--purple)', fontWeight: 800 }}>
                {prog}%
              </span>
            </div>
            <div className="progress-track" style={{ height: '10px' }}>
              <div
                className="progress-fill"
                style={{
                  width: `${prog}%`,
                  background: 'linear-gradient(90deg, var(--purple, #a78bfa), var(--cyan, #00d4ff))'
                }}
              ></div>
            </div>
          </div>

          {/* Chapters List */}
          {activeCourse.chapters.length === 0 ? (
            <div
              className="empty-state card animate-fadeUp"
              style={{ padding: '40px 20px', cursor: 'pointer' }}
              onClick={handleAddChapter}
            >
              <i className="ri-folder-add-line"></i>
              <p style={{ fontWeight: 700 }}>No chapters added yet.</p>
              <p style={{ marginTop: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
                Tap "+ Chapter" above to create your first module.
              </p>
            </div>
          ) : (
            activeCourse.chapters.map(ch => (
              <div key={ch.id} className="card chapter-box animate-fadeUp" style={{ marginBottom: '16px' }}>
                <div className="chapter-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{ch.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn-ghost btn-sm"
                      style={{ minHeight: 36, padding: '6px 12px' }}
                      onClick={() => handleAddTopic(ch.id)}
                    >
                      <i className="ri-add-line"></i> Topic
                    </button>
                    <button
                      className="icon-btn-touch"
                      style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={e => handleDeleteChapter(ch.id, e)}
                      title="Delete chapter"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>

                {ch.topics.length === 0 ? (
                  <div
                    style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px', cursor: 'pointer' }}
                    onClick={() => handleAddTopic(ch.id)}
                  >
                    No topics yet. Tap "+ Topic" to add one!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                    {ch.topics.map(t => (
                      <div
                        key={t.id}
                        className="topic-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md, 12px)',
                          background: t.completed ? 'rgba(0, 229, 160, 0.05)' : 'var(--glass)',
                          border: `1px solid ${t.completed ? 'rgba(0, 229, 160, 0.2)' : 'var(--glass-border)'}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <label style={{ minHeight: 36, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => handleToggleTopic(ch.id, t.id)}
                            style={{ width: 18, height: 18, accentColor: 'var(--purple)', cursor: 'pointer' }}
                          />
                          <span style={{
                            fontSize: '0.92rem',
                            fontWeight: 500,
                            textDecoration: t.completed ? 'line-through' : 'none',
                            opacity: t.completed ? 0.6 : 1,
                            color: t.completed ? 'var(--green, #00e5a0)' : 'var(--text-h, #f0f4ff)'
                          }}>
                            {t.title}
                          </span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {t.completed && (
                            <span className="chip chip-green" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                              <i className="ri-check-line"></i> Done
                            </span>
                          )}
                          <button
                            className="icon-btn-touch"
                            style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            onClick={e => handleDeleteTopic(ch.id, t.id, e)}
                            title="Delete topic"
                          >
                            <i className="ri-close-line" style={{ fontSize: '1.1rem' }}></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  return null;
}

export default LearningApp;