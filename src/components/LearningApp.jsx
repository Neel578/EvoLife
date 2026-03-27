import React, { useState, useEffect, useRef } from 'react';

function LearningApp({ setCurrentScreen }) {
  const [courses, setCourses] = useState(() => {
    const s = localStorage.getItem('evoLifeLearning');
    return s ? JSON.parse(s) : [];
  });
  const [view, setView] = useState('dashboard');
  const [active, setActive] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeTool, setActiveTool] = useState('cursor');
  const [dragNode, setDragNode] = useState(null);
  const [connectStart, setConnectStart] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { localStorage.setItem('evoLifeLearning', JSON.stringify(courses)); }, [courses]);

  const createNew = type => {
    const title = prompt(`New ${type} title:`);
    if (!title) return;
    const item = {
      id: Date.now(), title, type,
      chapters: type === 'Study Planning' ? [] : undefined,
      boardNodes: type === 'Project Planning' ? [] : undefined,
      boardConnections: type === 'Project Planning' ? [] : undefined,
    };
    setCourses([item, ...courses]);
    setShowAddMenu(false);
  };

  const deleteCourse = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this?")) setCourses(courses.filter(c => c.id !== id));
  };

  const openItem = c => {
    if (c.type === 'Project Planning' && !c.boardConnections) c.boardConnections = [];
    setActive(c); setView(c.type === 'Study Planning' ? 'course' : 'board');
  };

  // Study handlers
  const addChapter = () => {
    const t = prompt("Chapter name:"); if (!t) return;
    setCourses(courses.map(c => c.id === active.id ? { ...c, chapters: [...c.chapters, { id: Date.now(), title: t, topics: [] }] } : c));
  };
  const addTopic = cId => {
    const t = prompt("Topic name:"); if (!t) return;
    setCourses(courses.map(c => c.id !== active.id ? c : { ...c, chapters: c.chapters.map(ch => ch.id === cId ? { ...ch, topics: [...ch.topics, { id: Date.now(), title: t, completed: false }] } : ch) }));
  };
  const toggleTopic = (cId, tId) => {
    setCourses(courses.map(c => c.id !== active.id ? c : { ...c, chapters: c.chapters.map(ch => ch.id !== cId ? ch : { ...ch, topics: ch.topics.map(t => t.id === tId ? { ...t, completed: !t.completed } : t) }) }));
  };
  const calcProg = c => {
    if (!c?.chapters) return 0;
    let tot = 0, done = 0;
    c.chapters.forEach(ch => { tot += ch.topics.length; done += ch.topics.filter(t => t.completed).length; });
    return tot === 0 ? 0 : Math.round((done / tot) * 100);
  };

  // Board handlers
  const updateBoard = (nodes, conns) => {
    const upd = { ...active, boardNodes: nodes, boardConnections: conns };
    setActive(upd);
    setCourses(courses.map(c => c.id === active.id ? upd : c));
  };
  const handleBoardClick = e => {
    if (e.target.id !== 'board-cv') { if (activeTool === 'connect') setConnectStart(null); return; }
    if (activeTool === 'note') {
      const r = e.currentTarget.getBoundingClientRect();
      const n = { id: Date.now(), type: 'note', x: e.clientX - r.left, y: e.clientY - r.top, width: 180, height: 100, content: 'New note...' };
      updateBoard([...active.boardNodes, n], active.boardConnections);
      setActiveTool('cursor');
    } else if (activeTool === 'connect') setConnectStart(null);
  };
  const handleNodeClick = (e, id) => {
    e.stopPropagation();
    if (activeTool === 'delete') { updateBoard(active.boardNodes.filter(n => n.id !== id), (active.boardConnections||[]).filter(c => c.from !== id && c.to !== id)); }
    else if (activeTool === 'connect') {
      if (!connectStart) setConnectStart(id);
      else if (connectStart !== id) { updateBoard(active.boardNodes, [...(active.boardConnections||[]), { from: connectStart, to: id }]); setConnectStart(null); }
    }
  };
  const handleMouseMove = e => {
    if (activeTool === 'cursor' && dragNode !== null) {
      updateBoard(active.boardNodes.map(n => n.id === dragNode ? { ...n, x: n.x + e.movementX, y: n.y + e.movementY } : n), active.boardConnections);
    }
  };
  const handleImgUpload = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const n = { id: Date.now(), type: 'image', x: 50, y: 50, width: 220, height: 180, content: reader.result };
      updateBoard([...active.boardNodes, n], active.boardConnections);
    };
    reader.readAsDataURL(file);
    setActiveTool('cursor');
  };

  // DASHBOARD
  if (view === 'dashboard') return (
    <div className="screen">
      <div className="app-wrap">
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <button className="back-btn" onClick={() => setCurrentScreen('welcome')}>
              <i className="ri-arrow-left-line"></i> Back
            </button>
            <div className="app-title-block">
              <h1 className="display grad-purple">Mental Growth</h1>
              <p>Learning & Projects</p>
            </div>
          </div>
          <div className="app-header-right" style={{ position: 'relative' }}>
            <button className="btn-primary btn-sm" style={{ width: 'auto' }} onClick={() => setShowAddMenu(v => !v)}>
              <i className="ri-add-line"></i> Add
            </button>
            {showAddMenu && (
              <div className="card animate-scaleIn" style={{ position: 'absolute', right: 0, top: '48px', padding: '12px', width: '180px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn-ghost btn-sm" onClick={() => createNew('Study Planning')}><i className="ri-book-read-line"></i> Study Course</button>
                <button className="btn-ghost btn-sm" onClick={() => createNew('Project Planning')}><i className="ri-layout-masonry-line"></i> Project Board</button>
              </div>
            )}
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state card" style={{ padding: '48px 20px' }}>
            <i className="ri-book-open-line"></i>
            <p>No courses or projects yet.</p>
            <p style={{ marginTop: '6px', fontSize: '0.8rem' }}>Click "Add" to get started!</p>
          </div>
        ) : (
          <div className="course-grid animate-fadeUp">
            {courses.map((c, i) => {
              const prog = calcProg(c);
              return (
                <div key={c.id} className="course-card" style={{ animationDelay: `${i * 60}ms` }} onClick={() => openItem(c)}>
                  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <span className={`chip ${c.type === 'Study Planning' ? 'chip-cyan' : 'chip-green'}`}>
                      <i className={c.type === 'Study Planning' ? 'ri-book-read-line' : 'ri-layout-masonry-line'}></i>
                      {c.type === 'Study Planning' ? 'Course' : 'Board'}
                    </span>
                    <button onClick={e => deleteCourse(c.id, e)} style={{ background: 'none', color: 'var(--muted)', fontSize: '1rem', marginLeft: 'auto', padding: '2px' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--red)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--muted)'}>
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="course-title">{c.title}</div>
                  {c.type === 'Study Planning' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '5px' }}>
                        <span>Progress</span><span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{prog}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${prog}%` }}></div></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // COURSE VIEW
  if (view === 'course') {
    const course = courses.find(c => c.id === active.id);
    const prog = calcProg(course);
    return (
      <div className="screen">
        <div className="app-wrap">
          <div className="app-header animate-fadeUp">
            <div className="app-header-left">
              <button className="back-btn" onClick={() => setView('dashboard')}>
                <i className="ri-arrow-left-line"></i> Dashboard
              </button>
              <div className="app-title-block">
                <h1 className="display" style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)' }}>{course.title}</h1>
              </div>
            </div>
            <div className="app-header-right">
              <button className="btn-primary btn-sm" style={{ width: 'auto' }} onClick={addChapter}>
                <i className="ri-add-line"></i> Chapter
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: '8px' }}>
              <span>Course Progress</span><span>{prog}%</span>
            </div>
            <div className="progress-track" style={{ height: '10px' }}><div className="progress-fill" style={{ width: `${prog}%` }}></div></div>
          </div>

          {course.chapters.length === 0
            ? <div className="empty-state card" style={{ padding: '40px' }}><i className="ri-folder-open-line"></i><p>No chapters yet. Add one!</p></div>
            : course.chapters.map(ch => (
              <div key={ch.id} className="card chapter-box animate-fadeUp">
                <div className="chapter-head">
                  <h3>{ch.title}</h3>
                  <button className="btn-ghost btn-sm" onClick={() => addTopic(ch.id)}><i className="ri-add-line"></i> Topic</button>
                </div>
                {ch.topics.length === 0
                  ? <div style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px' }}>No topics yet.</div>
                  : ch.topics.map(t => (
                    <div key={t.id} className="topic-row">
                      <label>
                        <input type="checkbox" checked={t.completed} onChange={() => toggleTopic(ch.id, t.id)} />
                        <span style={{ textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.5 : 1 }}>{t.title}</span>
                      </label>
                      {t.completed && <span className="chip chip-green" style={{ fontSize: '0.65rem' }}><i className="ri-check-line"></i></span>}
                    </div>
                  ))
                }
              </div>
            ))
          }
        </div>
      </div>
    );
  }

  // BOARD VIEW
  const tools = [
    { id: 'cursor', icon: '👆', label: 'Move' },
    { id: 'note', icon: '📝', label: 'Note' },
    { id: 'connect', icon: '🔗', label: 'Connect' },
    { id: 'image', icon: '🖼️', label: 'Image' },
    { id: 'delete', icon: '🗑️', label: 'Delete' },
  ];

  return (
    <div className="screen">
      <div className="app-wrap">
        <div className="app-header animate-fadeUp">
          <div className="app-header-left">
            <button className="back-btn" onClick={() => setView('dashboard')}>
              <i className="ri-arrow-left-line"></i> Dashboard
            </button>
            <div className="app-title-block">
              <h1 className="display" style={{ fontSize: 'clamp(1.2rem, 4vw, 1.7rem)' }}>{active.title}</h1>
            </div>
          </div>
        </div>

        <div className="card board-toolbar">
          {tools.map(t => (
            <button
              key={t.id}
              className={`tool-btn ${activeTool === t.id ? (t.id === 'delete' ? 'active-delete' : t.id === 'connect' ? 'active-connect' : 'active') : ''}`}
              onClick={() => { if (t.id === 'image') fileRef.current.click(); else { setActiveTool(t.id); setConnectStart(null); } }}
            >{t.icon} {t.label}</button>
          ))}
          <input type="file" accept="image/*" ref={fileRef} onChange={handleImgUpload} style={{ display: 'none' }} />
        </div>

        {connectStart && (
          <div className="chip chip-green animate-fadeIn" style={{ marginBottom: '12px', display: 'inline-flex' }}>
            <i className="ri-focus-3-line"></i> Node selected — click another to connect
          </div>
        )}

        <div
          id="board-cv"
          className="board-canvas"
          onClick={handleBoardClick}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setDragNode(null)}
          onMouseLeave={() => setDragNode(null)}
          style={{ cursor: activeTool === 'note' || activeTool === 'connect' ? 'crosshair' : 'default' }}
        >
          {/* SVG connections */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }}>
            {(active.boardConnections || []).map((conn, i) => {
              const s = active.boardNodes.find(n => n.id === conn.from);
              const e = active.boardNodes.find(n => n.id === conn.to);
              if (!s || !e) return null;
              const x1 = s.x + (s.width || 180) / 2, y1 = s.y + (s.height || 100) / 2;
              const x2 = e.x + (e.width || 180) / 2, y2 = e.y + (e.height || 100) / 2;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--green)" strokeWidth="2.5" strokeDasharray="6,5" opacity="0.8" />;
            })}
          </svg>

          {/* Nodes */}
          {(active.boardNodes || []).map(node => (
            <div
              key={node.id}
              className="board-node"
              onMouseDown={e => { if (activeTool === 'cursor') { e.stopPropagation(); setDragNode(node.id); } }}
              onClick={e => handleNodeClick(e, node.id)}
              onMouseUp={() => setDragNode(null)}
              style={{
                left: node.x, top: node.y, width: node.width || 180, height: node.height || 100,
                border: `2px solid ${connectStart === node.id ? 'var(--green)' : node.type === 'image' ? 'var(--green)' : 'var(--cyan)'}`,
                padding: node.type === 'image' ? '0' : '16px',
                boxShadow: dragNode === node.id ? '0 24px 48px rgba(0,0,0,0.6)' : '0 12px 32px rgba(0,0,0,0.4)',
                cursor: activeTool === 'delete' ? 'no-drop' : activeTool === 'connect' ? 'pointer' : (dragNode === node.id ? 'grabbing' : 'grab'),
                resize: activeTool === 'cursor' ? 'both' : 'none',
                zIndex: dragNode === node.id ? 200 : connectStart === node.id ? 150 : 10,
              }}
            >
              {node.type === 'note'
                ? <div contentEditable suppressContentEditableWarning onBlur={e => updateBoard(active.boardNodes.map(n => n.id === node.id ? { ...n, content: e.target.innerText } : n), active.boardConnections)}
                    style={{ outline: 'none', width: '100%', height: '100%', fontSize: '0.88rem', fontWeight: 500 }}>{node.content}</div>
                : <img src={node.content} alt="" draggable="false" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', pointerEvents: 'none' }} />
              }
            </div>
          ))}

          {(active.boardNodes || []).length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.9rem', pointerEvents: 'none', flexDirection: 'column', gap: '8px' }}>
              <i className="ri-layout-masonry-line" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
              <span>Select 📝 Note and click to add</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningApp;