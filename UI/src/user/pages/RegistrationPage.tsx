import React, { useState, useLayoutEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GagnerEvent, Participant, saveParticipant } from '../../shared/utils/storage';
import gsap from 'gsap';

interface ParticipantForm {
    name: string;
    email: string;
    phone: string;
    gender: string;
    bloodGroup: string;
    dob: string;
    age: string;
    tshirtSize: string;
    category: string;
}

const emptyForm: ParticipantForm = {
    name: '', email: '', phone: '', gender: '', bloodGroup: '', dob: '', age: '', tshirtSize: '', category: ''
};

export default function RegistrationPage({ events }: { events: Record<string, GagnerEvent> }) {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    
    // Check if we are still waiting for events to load (object is empty)
    const isDataLoading = Object.keys(events).length === 0;
    const event = slug ? events[slug] : null;

    // Multi-participant state
    const [ticketCount, setTicketCount] = useState(1);
    const [participants, setParticipants] = useState<ParticipantForm[]>([]);
    const [currentForm, setCurrentForm] = useState<ParticipantForm>({ ...emptyForm });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step, setStep] = useState<'count' | 'fill'>('count');
    const formRef = useRef<HTMLDivElement>(null);

    const remaining = ticketCount - participants.length;
    const allFilled = participants.length === ticketCount;

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        if (!event) return;
        
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            tl.fromTo('.reg-info-glass > *', 
                { opacity: 0, x: -50 },
                { opacity: 1, x: 0, duration: 1.2, stagger: 0.1, ease: 'power4.out' }
            )
            .fromTo('.form-glass-card', 
                { opacity: 0, y: 100, scale: 0.9 },
                { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'expo.out' }, '-=0.8'
            );
            
            // Only animate form fields if they exist (step === 'fill')
            const formFields = document.querySelectorAll('.form-group-premium, .category-select-premium');
            if (formFields.length > 0) {
                tl.fromTo('.form-group-premium, .category-select-premium', 
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'power3.out' }, '-=1'
                );
            }
            
            gsap.fromTo('.bg-glow-orb', 
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 3, stagger: 0.5, ease: 'sine.inOut' }
            );
        });

        // Global click to close dropdowns
        const handleGlobalClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.custom-select-wrap')) {
                document.querySelectorAll('.cs-options').forEach(el => el.classList.remove('show'));
            }
        };
        document.addEventListener('mousedown', handleGlobalClick);
        
        return () => {
            ctx.revert();
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [event]);

    const formatEventDate = (dateStr: string) => {
        if (!dateStr) return 'TBA';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const formatPremiumDescription = (rawText: string) => {
        if (!rawText) return 'Join us for an uncompromising experience of athletic excellence.';
        
        const processed = rawText
            .replace(/ (📍|⏰|📅|🏃|🟢|💰|🥇|🥈|🥉|🎁|✔️|✓|📞|🌐|💪)/g, '\n\n$1')
            .replace(/ (🌍 [A-Z])/g, '\n\n$1'); 
            
        return processed.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={idx} />;

            const isHighlight = /^(📍|⏰|📅|🟢|🎁|📞|🌐|💰|🥇|🥈|🥉)/.test(trimmed);
            const isBullet = /^(✔️|✓)/.test(trimmed);

            if (isHighlight) {
                return (
                    <div key={idx} style={{
                        background: 'rgba(255, 95, 0, 0.05)',
                        borderLeft: '3px solid var(--primary)',
                        padding: '1rem 1.5rem',
                        margin: '1.2rem 0',
                        borderRadius: '0 12px 12px 0',
                        color: '#fff',
                        fontWeight: 500,
                        letterSpacing: '0.5px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}>
                        {trimmed}
                    </div>
                );
            }
            
            if (isBullet) {
                return (
                    <div key={idx} style={{
                        display: 'flex', gap: '10px', alignItems: 'center',
                        margin: '0.5rem 0', paddingLeft: '1rem',
                        color: 'rgba(255,255,255,0.8)'
                    }}>
                        {trimmed}
                    </div>
                );
            }

            return (
                <p key={idx} style={{
                    marginBottom: '1rem',
                    lineHeight: '1.8',
                    fontSize: '1.05rem',
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'justify'
                }}>
                    {trimmed}
                </p>
            );
        });
    };

    const renderDescription = () => {
        const d = event?.desc || event?.description || '';
        if (d.includes('<p>') || d.includes('<h2>') || d.includes('<ul>')) {
            return <div className="event-desc-premium premium-rich-text" dangerouslySetInnerHTML={{ __html: d }} />;
        }
        return <div className="event-desc-premium" style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>{formatPremiumDescription(d)}</div>;
    };

    if (!event) {
        if (isDataLoading) {
            return (
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
                    <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,95,0,0.3)', borderTopColor: '#ff5f00', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '1.5rem', letterSpacing: '2px', fontSize: '0.8rem', opacity: 0.5 }}>LOADING EVENT DATA...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            );
        }
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#020408', padding: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '6rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)', marginBottom: '-2rem' }}>404</h1>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#fff', letterSpacing: '-1px' }}>EVENT NOT FOUND</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '3rem', maxWidth: '400px' }}>The event you are looking for might have been moved, archived, or the slug is incorrect.</p>
                <Link to="/" style={{ color: '#fff', background: '#ff5f00', fontWeight: 800, textDecoration: 'none', padding: '1.2rem 2.5rem', borderRadius: '12px', boxShadow: '0 20px 40px rgba(255,95,0,0.2)' }}>BACK TO HOME</Link>
            </div>
        );
    }

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingIndex !== null) {
            // Update existing
            const updated = [...participants];
            updated[editingIndex] = { ...currentForm };
            setParticipants(updated);
            setEditingIndex(null);
        } else {
            // Add new
            setParticipants(prev => [...prev, { ...currentForm }]);
        }
        setCurrentForm({ ...emptyForm });
        // Scroll to cards
        setTimeout(() => {
            const cards = document.querySelector('.filled-participants-list');
            if (cards) cards.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    };

    const handleEditParticipant = (idx: number) => {
        setCurrentForm({ ...participants[idx] });
        setEditingIndex(idx);
        // Scroll to form
        setTimeout(() => {
            if (formRef.current) formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleDeleteParticipant = (idx: number) => {
        setParticipants(prev => prev.filter((_, i) => i !== idx));
        if (editingIndex === idx) {
            setEditingIndex(null);
            setCurrentForm({ ...emptyForm });
        } else if (editingIndex !== null && editingIndex > idx) {
            setEditingIndex(editingIndex - 1);
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const orderId = `ORD-${Date.now()}`;
            let totalAmount = 0;
            
            const participantsToSave = participants.map((form) => {
                const catInfo = (event?.categories || []).find((c: any) => c.name === form.category);
                if (catInfo && catInfo.price) {
                     totalAmount += Number(String(catInfo.price).replace(/[^0-9.]/g, ''));
                }
                return {
                    id: `P-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    ...form,
                    orderId,
                    city: 'N/A',
                    ageGroup: form.age,
                    tshirtSize: form.tshirtSize,
                    eventSlug: event.slug || slug || '',
                    eventName: event.title,
                    registeredAt: new Date().toISOString(),
                    paymentStatus: 'Pending' as const,
                    isPaid: false
                };
            });

            // Save locally first with Pending status
            for (const p of participantsToSave) {
                await saveParticipant(p);
            }

            // If total amount is 0, skip payment
            if (totalAmount === 0 || isNaN(totalAmount)) {
                setSuccess(true);
                setTimeout(() => navigate('/'), 4000);
                return;
            }

            // Call CCAvenue initiation endpoint
            const qs = `amount=${totalAmount}&orderId=${orderId}&data=bulk`;
            const resp = await fetch(`/api/payment/initiate?${qs}`);
            const data = await resp.json();

            if (data.success && data.encRequest) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = data.gateway_url;

                const encReq = document.createElement('input');
                encReq.type = 'hidden';
                encReq.name = 'encRequest';
                encReq.value = data.encRequest;
                form.appendChild(encReq);

                const accessCode = document.createElement('input');
                accessCode.type = 'hidden';
                accessCode.name = 'access_code';
                accessCode.value = data.access_code;
                form.appendChild(accessCode);

                document.body.appendChild(form);
                form.submit();
            } else {
                alert('Payment gateway failed to initialize. Please try again later.');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert('Registration failed. Please try again.');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="registration-success-wrap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0a' }}>
                <div className="success-content" style={{ background: '#111', padding: '4rem', borderRadius: '20px', border: '1px solid #222', textAlign: 'center', maxWidth: '500px', margin: '0 1.5rem' }}>
                    <div style={{ fontSize: '4rem', color: '#00c853', marginBottom: '1rem' }}>✓</div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>{(participants || []).length} ATTENDEE{(participants || []).length > 1 ? 'S' : ''} CONFIRMED</h2>
                    <p style={{ color: '#aaa', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        {(participants || []).map(p => p.name).join(', ')} registered for <strong style={{color:'#fff'}}>{event?.title || 'Event'}</strong>.
                    </p>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '2rem' }}>Redirecting to home...</p>
                    <Link to="/" style={{ background: '#ff5f00', color: '#fff', padding: '1rem 2rem', textDecoration: 'none', fontWeight: 700, borderRadius: '12px', display: 'inline-block' }}>BACK TO HOME</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="registration-mad-container" style={{ background: '#020408', color: '#fff', paddingTop: '220px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
            <div className="bg-glow-orb" style={{ position: 'absolute', top: '10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255, 95, 0, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}></div>
            <div className="bg-glow-orb" style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0, 200, 83, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>

            <div className="registration-content-wrapper" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '0 4rem', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '6rem', alignItems: 'start' }}>
                
                {/* LEFT INFO PANEL */}
                <div className="reg-info-glass">
                    <Link to="/" className="back-link-unique">
                        <span className="arrow">←</span> <span className="text">BACK TO EXPLORE</span>
                    </Link>
                    
                    <div className="event-badge-unique">
                        <span className="dot"></span> {event.tag || 'ELITE EVENT'}
                    </div>

                    <h1 className="event-title-extreme" style={{ overflowWrap: 'break-word', wordWrap: 'break-word', hyphens: 'auto' }}>{event.title}</h1>
                    
                    <div className="event-stats-glass-grid">
                        <div className="stat-card-mini">
                            <span className="label">DATE</span>
                            <span className="value">{formatEventDate(event.date)}</span>
                        </div>
                        <div className="stat-card-mini">
                            <span className="label">TIME</span>
                            <span className="value">{event.time || '06:00 AM'}</span>
                        </div>
                        <div className="stat-card-mini full">
                            <span className="label">LOCATION</span>
                            <span className="value">{event.venue}</span>
                        </div>
                    </div>

                    {/* Description moved to bottom */}

                    <div className="deliverables-unique">
                      {(event?.deliverables || []).map((d, i) => (
                          <div key={i} className="del-pill">
                              <span className="check">✓</span> {d}
                          </div>
                      ))}
                    </div>
                </div>

                {/* RIGHT FORM PANEL */}
                <div className="reg-form-glass-wrap" ref={formRef} style={{ position: 'sticky', top: '160px', zIndex: 10 }}>
                    <div className="form-glass-card">
                        <div className="form-header-premium">
                            <h2>SECURE YOUR <span className="highlight">SLOT</span></h2>
                            <div className="header-line"></div>
                        </div>

                        {/* STEP 1: TICKET COUNT */}
                        {step === 'count' && (
                            <div className="ticket-count-step">
                                <label className="tc-label">HOW MANY PARTICIPANTS?</label>
                                <div className="tc-selector">
                                    <button type="button" className="tc-btn" onClick={() => setTicketCount(c => Math.max(1, c - 1))}>−</button>
                                    <span className="tc-value">{ticketCount}</span>
                                    <button type="button" className="tc-btn" onClick={() => setTicketCount(c => Math.min(10, c + 1))}>+</button>
                                </div>
                                <div style={{ marginTop: '2.5rem' }}>
                                    <button type="button" className="btn-submit-premium-mad" onClick={() => setStep('fill')}>
                                        CONTINUE TO DETAILS →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: FORM FILLING */}
                        {step === 'fill' && (
                            <>
                                {/* Progress */}
                                <div className="reg-progress-bar">
                                    <div className="rpb-text">
                                        <span style={{ color: '#fff', opacity: 0.9 }}>{editingIndex !== null ? `EDITING: #${editingIndex + 1}` : `ENTRY ${participants.length + 1} OF ${ticketCount}`}</span>
                                        <span className="rpb-count" style={{ color: 'var(--secondary)', fontWeight: 900 }}>{participants.length}/{ticketCount} COMPLETED</span>
                                    </div>
                                    <div className="rpb-track">
                                        <div className="rpb-fill" style={{ width: `${(participants.length / ticketCount) * 100}%` }}></div>
                                    </div>
                                </div>

                                {/* Show form if not all filled, or if editing */}
                                {(!allFilled || editingIndex !== null) && (
                                    <form className="premium-form-flow" onSubmit={handleAddParticipant}>
                                        <div className="form-grid-premium">
                                            <div className="form-group-premium">
                                                <label>FULL NAME</label>
                                                <input type="text" required value={currentForm.name} onChange={e => setCurrentForm(f => ({ ...f, name: e.target.value }))} placeholder="E.g. John Doe" />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>EMAIL ADDRESS</label>
                                                <input type="email" required value={currentForm.email} onChange={e => setCurrentForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>MOBILE NUMBER</label>
                                                <input 
                                                  type="text" 
                                                  required 
                                                  value={currentForm.phone} 
                                                  onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, ''); // Number only
                                                    setCurrentForm(f => ({ ...f, phone: val }));
                                                  }} 
                                                  placeholder="00000 00000" 
                                                />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>GENDER</label>
                                                <select required value={currentForm.gender} onChange={e => setCurrentForm(f => ({ ...f, gender: e.target.value }))}>
                                                    <option value="" disabled>Select Gender</option>
                                                    {["Male", "Female", "Other"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>

                                            <div className="form-group-premium">
                                                <label>BLOOD GROUP</label>
                                                <select required value={currentForm.bloodGroup} onChange={e => setCurrentForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                                                    <option value="" disabled>Select Blood Group</option>
                                                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>

                                            <div className="form-group-premium">
                                                <label>DATE OF BIRTH</label>
                                                <input 
                                                  type="date" 
                                                  required 
                                                  value={currentForm.dob} 
                                                  onChange={e => setCurrentForm(f => ({ ...f, dob: e.target.value }))}
                                                  style={{ colorScheme: 'dark' }}
                                                />
                                            </div>

                                            <div className="form-group-premium">
                                                <label>AGE</label>
                                                <input 
                                                  type="text" 
                                                  required 
                                                  maxLength={3}
                                                  value={currentForm.age} 
                                                  onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, '').substring(0, 3); 
                                                    setCurrentForm(f => ({ ...f, age: val }));
                                                  }} 
                                                  placeholder="000" 
                                                />
                                            </div>

                                            <div className="form-group-premium">
                                                <label>T-SHIRT SIZE</label>
                                                <select required value={currentForm.tshirtSize} onChange={e => setCurrentForm(f => ({ ...f, tshirtSize: e.target.value }))}>
                                                    <option value="" disabled>Select Size</option>
                                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="category-select-premium">
                                            <label>CHOOSE CATEGORY</label>
                                            <div className="cat-options-grid">
                                                {(event?.categories || []).map((cat, i) => (
                                                    <div key={i} className={`cat-card-option ${currentForm.category === cat.name ? 'selected' : ''}`} onClick={() => setCurrentForm(f => ({ ...f, category: cat.name }))}>
                                                        <div className="cat-info" style={{ flex: 1, marginRight: '1rem' }}>
                                                            <span className="cat-name">{cat.name}</span>
                                                            <span className="cat-price">₹ {cat.price}</span>
                                                        </div>
                                                        <div className="cat-check"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button type="submit" className="btn-submit-premium-mad" style={{ background: editingIndex !== null ? '#00C853' : undefined }}>
                                            {editingIndex !== null ? 'UPDATE PARTICIPANT ✓' : `ADD PARTICIPANT ${participants.length + 1} →`}
                                        </button>

                                        {editingIndex !== null && (
                                            <button type="button" className="btn-cancel-edit" onClick={() => { setEditingIndex(null); setCurrentForm({ ...emptyForm }); }}>
                                                CANCEL EDIT
                                            </button>
                                        )}
                                    </form>
                                )}

                                {/* FILLED PARTICIPANT CARDS */}
                                {participants.length > 0 && (
                                    <div className="filled-participants-list">
                                        <h4 className="fpl-title">REGISTERED PARTICIPANTS ({participants.length})</h4>
                                        {(participants || []).map((p, idx) => (
                                            <div key={idx} className={`participant-card ${editingIndex === idx ? 'editing' : ''}`}>
                                                <div className="pc-header">
                                                    <div className="pc-num">{idx + 1}</div>
                                                    <div className="pc-info">
                                                        <span className="pc-name">{p.name}</span>
                                                        <span className="pc-meta">{p.category} • {p.gender} • Age {p.age}</span>
                                                    </div>
                                                    <div className="pc-actions">
                                                        <button type="button" className="pc-btn edit" onClick={() => handleEditParticipant(idx)} title="Edit">✎</button>
                                                        <button type="button" className="pc-btn delete" onClick={() => handleDeleteParticipant(idx)} title="Delete">✕</button>
                                                    </div>
                                                </div>
                                                <div className="pc-details">
                                                    <span>📧 {p.email}</span>
                                                    <span>📱 {p.phone}</span>
                                                    <span>🩸 {p.bloodGroup}</span>
                                                    <span>📅 {p.dob}</span>
                                                    <span>👕 Size {p.tshirtSize}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* FINAL SUBMIT */}
                                {allFilled && editingIndex === null && (
                                    <button type="button" disabled={loading} className="btn-submit-premium-mad btn-final-submit" onClick={handleFinalSubmit}>
                                        {loading ? 'SUBMITTING...' : `COMPLETE REGISTRATION (${ticketCount} PARTICIPANT${ticketCount > 1 ? 'S' : ''}) →`}
                                    </button>
                                )}

                                {/* Back to change count */}
                                <button type="button" className="btn-back-count" onClick={() => { setStep('count'); setParticipants([]); setCurrentForm({ ...emptyForm }); setEditingIndex(null); }}>
                                    ← CHANGE PARTICIPANT COUNT
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* FULL WIDTH DESCRIPTION SECTION BELOW */}
            <div className="full-width-desc-wrapper" style={{ maxWidth: '1400px', margin: '2rem auto 2rem auto', padding: '0 4rem', position: 'relative', zIndex: 1 }}>
                <div className="desc-glass-panel" style={{
                    background: 'linear-gradient(145deg, rgba(20,20,20,0.6) 0%, rgba(5,5,5,0.9) 100%)',
                    padding: '4rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginTop: 0, marginBottom: '2rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        ABOUT THE <span style={{color: 'var(--primary)'}}>EVENT</span>
                    </h2>
                    {renderDescription()}
                </div>
            </div>

            <style>{`
                .premium-rich-text {
                    color: rgba(255,255,255,0.85);
                    font-size: 1.1rem;
                    line-height: 1.8;
                    text-align: left;
                }
                .premium-rich-text p { margin-bottom: 1.2rem; }
                .premium-rich-text h1, .premium-rich-text h2, .premium-rich-text h3 {
                    color: #fff; font-weight: 800; margin-top: 1.5rem; margin-bottom: 0.8rem;
                }
                .premium-rich-text ul, .premium-rich-text ol {
                    margin: 1rem 0; padding-left: 1.5rem;
                    background: rgba(255,255,255,0.02);
                    border-radius: 12px;
                    padding: 1.2rem 1.2rem 1.2rem 2.5rem;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .premium-rich-text li { margin-bottom: 0.5rem; }
                .registration-mad-container {
                    font-family: 'Outfit', sans-serif;
                }
                .reg-info-glass {
                    padding-top: 2rem;
                }
                .back-link-unique {
                    color: rgba(255,255,255,0.4);
                    text-decoration: none;
                    font-weight: 700;
                    font-size: 0.8rem;
                    letter-spacing: 2px;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 4rem;
                    transition: all 0.3s;
                }
                .back-link-unique:hover { color: var(--primary); transform: translateX(-5px); }
                
                .event-badge-unique {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 95, 0, 0.1);
                    color: var(--primary);
                    padding: 8px 16px;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 800;
                    letter-spacing: 2px;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(255, 95, 0, 0.2);
                }
                .event-badge-unique .dot { width: 6px; height: 6px; background: var(--primary); border-radius: 50%; box-shadow: 0 0 10px var(--primary); }
                
                .event-title-extreme {
                    font-size: clamp(2rem, 6vw, 5rem);
                    font-weight: 900;
                    line-height: 0.95;
                    letter-spacing: -2px;
                    margin-bottom: 2.5rem;
                    text-transform: uppercase;
                    background: linear-gradient(to bottom, #fff 0%, #ddd 60%, rgba(255,255,255,0.6));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    word-break: break-word;
                }

                .event-stats-glass-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .stat-card-mini {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 1.5rem;
                    border-radius: 18px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    transition: all 0.3s;
                }
                .stat-card-mini:hover { background: rgba(255,255,255,0.08); border-color: var(--primary); }
                .stat-card-mini.full { grid-column: span 2; }
                .stat-card-mini .label { font-size: 0.75rem; color: rgba(255,255,255,0.5); font-weight: 800; letter-spacing: 2px; margin-bottom: 4px; display: block; }
                .stat-card-mini .value { font-size: 1.15rem; font-weight: 700; color: #fff; line-height: 1.4; display: block; }

                .event-desc-premium { font-size: 1.1rem; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 2.5rem; max-width: 95%; }
                
                .deliverables-unique { display: flex; flex-wrap: wrap; gap: 12px; }
                .del-pill {
                    background: rgba(0, 200, 83, 0.1);
                    border: 1px solid rgba(0, 200, 83, 0.2);
                    color: #00c853;
                    padding: 8px 18px;
                    border-radius: 100px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }

                /* ============ FORM STYLES ============ */
                .form-glass-card {
                    background: rgba(20, 20, 20, 0.85);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 32px;
                    padding: 4rem;
                    box-shadow: 0 50px 120px rgba(0,0,0,0.6);
                }
                .form-header-premium h2 { font-size: 2.2rem; font-weight: 900; margin-bottom: 1rem; color: #fff; text-transform: uppercase; letter-spacing: -1px; }
                .form-header-premium .highlight { color: var(--primary); }
                .form-header-premium .header-line { width: 80px; height: 5px; background: var(--primary); border-radius: 2px; margin-bottom: 3rem; box-shadow: 0 0 20px rgba(255, 95, 0, 0.5); }

                /* TICKET COUNT STEP */
                .ticket-count-step { text-align: center; padding: 2rem 0; }
                .tc-label { font-size: 0.85rem; font-weight: 800; color: rgba(255,255,255,0.5); letter-spacing: 3px; display: block; margin-bottom: 2.5rem; text-transform: uppercase; }
                .tc-selector { display: flex; align-items: center; justify-content: center; gap: 2rem; margin-bottom: 1.5rem; }
                .tc-btn {
                    width: 50px; height: 50px;
                    border-radius: 50%;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.03);
                    color: #fff;
                    font-size: 1.5rem;
                    font-weight: 300;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center;
                }
                .tc-btn:hover { border-color: var(--primary); background: rgba(255,95,0,0.1); color: var(--primary); }
                .tc-value { font-size: 4rem; font-weight: 900; color: #fff; min-width: 80px; }
                .tc-hint { color: rgba(255,255,255,0.3); font-size: 0.85rem; margin-bottom: 2rem; }

                /* PROGRESS BAR */
                .reg-progress-bar { margin-bottom: 2rem; }
                .rpb-text { display: flex; justify-content: space-between; margin-bottom: 0.8rem; font-size: 0.75rem; font-weight: 800; letter-spacing: 1.5px; color: rgba(255,255,255,0.4); }
                .rpb-count { color: var(--secondary); font-weight: 900; }
                .rpb-track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
                .rpb-fill { height: 100%; background: linear-gradient(to right, var(--primary), var(--secondary)); border-radius: 4px; transition: width 0.5s ease; }

                .form-grid-premium { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .form-group-premium { display: flex; flex-direction: column; gap: 6px; }
                .form-group-premium label { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; }
                .form-group-premium input, .form-group-premium select {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 0.9rem 1rem;
                    border-radius: 12px;
                    color: #fff;
                    font-size: 0.95rem;
                    font-family: 'Outfit', sans-serif;
                    outline: none;
                    transition: all 0.3s;
                    -webkit-appearance: none;
                }
                .form-group-premium input::placeholder { color: rgba(255,255,255,0.2); }
                /* Custom Select Styles */
                .form-group-premium { position: relative; }
                .form-group-premium:focus-within { z-index: 1000; }
                .custom-select-wrap { position: relative; width: 100%; }
                .cs-current {
                    background: #111;
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 0.9rem 1rem;
                    border-radius: 12px;
                    color: rgba(255,255,255,0.4);
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s;
                    position: relative;
                    z-index: 2;
                }
                .cs-current.active { color: #fff; border-color: var(--primary); }
                .cs-current:hover { border-color: var(--primary); background: rgba(255,95,0,0.05); }
                .cs-arrow { font-size: 0.6rem; opacity: 0.5; transition: transform 0.3s; }
                
                .cs-options {
                    position: absolute;
                    top: 100%;
                    left: 0; width: 100%;
                    background: #000;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0 0 12px 12px;
                    z-index: 2000;
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                    animation: cs-fade 0.2s ease-out;
                    margin-top: -1px;
                }
                .cs-options.show { display: flex; }
                .cs-option {
                    padding: 1rem;
                    cursor: pointer;
                    font-size: 0.95rem;
                    color: rgba(255,255,255,0.7);
                    transition: all 0.2s;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    background: #000;
                }
                .cs-option:last-child { border-bottom: none; }
                .cs-option:hover { background: var(--primary); color: #000; font-weight: 800; transform: translateX(5px); }

                .custom-grid-selector {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 8px;
                    margin-top: 5px;
                }
                .custom-grid-selector.sizes {
                    grid-template-columns: repeat(4, 1fr);
                }
                .grid-opt {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    padding: 0.8rem 0.5rem;
                    border-radius: 10px;
                    text-align: center;
                    font-size: 0.8rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
                    color: rgba(255,255,255,0.4);
                }
                .grid-opt:hover {
                    border-color: rgba(255,95,0,0.4);
                    background: rgba(255,95,0,0.05);
                    color: #fff;
                }
                .grid-opt.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: #000;
                    box-shadow: 0 0 15px rgba(255,95,0,0.3);
                }
                @media (max-width: 600px) {
                    .custom-grid-selector { grid-template-columns: repeat(4, 1fr); }
                    .form-group-premium.full-width-sm { grid-column: span 1; }
                }

                @keyframes cs-fade { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

                .form-group-premium select option { background: #111; color: #fff; padding: 10px; }
                .form-group-premium input:focus, .form-group-premium select:focus { 
                    border-color: var(--primary); 
                    background: rgba(255,95,0,0.05); 
                    box-shadow: 0 0 20px rgba(255,95,0,0.1); 
                }
                /* Project Theme Select highlight */
                select:active, select:focus {
                    background-color: rgba(255, 95, 0, 0.1) !important;
                }
                option:hover, option:focus, option:checked {
                    background-color: var(--primary) !important;
                    color: #000 !important;
                }

                .category-select-premium label { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; display: block; margin-bottom: 1rem; }
                .cat-options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-bottom: 2rem; }
                .cat-card-option {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 1rem;
                    border-radius: 14px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.3s;
                }
                .cat-card-option:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
                .cat-card-option.selected { border-color: var(--primary); background: rgba(255,95,0,0.1); }
                .cat-card-option .cat-name { display: block; font-weight: 700; font-size: 0.9rem; margin-bottom: 6px; color: #fff; line-height: 1.2; }
                .cat-card-option .cat-price { display: block; color: var(--primary); font-weight: 800; font-size: 1.1rem; line-height: 1; }
                .cat-card-option .cat-check { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.1); border-radius: 50%; position: relative; flex-shrink: 0; }
                .cat-card-option.selected .cat-check { background: var(--primary); border-color: var(--primary); }
                .cat-card-option.selected .cat-check::after { content: ''; position: absolute; top: 45%; left: 50%; width: 5px; height: 8px; border: solid #fff; border-width: 0 2px 2px 0; transform: translate(-50%, -50%) rotate(45deg); }

                .btn-submit-premium-mad {
                    width: 100%;
                    padding: 1.2rem;
                    border: none;
                    background: var(--primary);
                    color: #000;
                    font-weight: 900;
                    font-size: 0.9rem;
                    letter-spacing: 2px;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
                    box-shadow: 0 15px 40px rgba(255, 95, 0, 0.2);
                    font-family: 'Outfit', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                .btn-submit-premium-mad:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 20px 50px rgba(255, 95, 0, 0.4); filter: brightness(1.1); }
                .btn-submit-premium-mad:disabled { opacity: 0.5; cursor: not-allowed; }

                .btn-final-submit {
                    margin-top: 1.5rem;
                    background: linear-gradient(135deg, var(--primary), var(--secondary));
                    font-size: 1rem;
                    padding: 1.4rem;
                }

                .btn-cancel-edit {
                    width: 100%;
                    padding: 0.8rem;
                    margin-top: 0.8rem;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: transparent;
                    color: rgba(255,255,255,0.4);
                    font-weight: 700;
                    font-size: 0.75rem;
                    letter-spacing: 2px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: 'Outfit', sans-serif;
                }
                .btn-cancel-edit:hover { border-color: #ff4444; color: #ff4444; }

                .btn-back-count {
                    width: 100%;
                    padding: 0.8rem;
                    margin-top: 1.5rem;
                    border: none;
                    background: transparent;
                    color: rgba(255,255,255,0.25);
                    font-weight: 700;
                    font-size: 0.7rem;
                    letter-spacing: 2px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: 'Outfit', sans-serif;
                }
                .btn-back-count:hover { color: var(--primary); }

                /* ============ FILLED PARTICIPANT CARDS ============ */
                .filled-participants-list {
                    margin-top: 2rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding-top: 1.5rem;
                }
                .fpl-title {
                    font-size: 0.7rem;
                    font-weight: 800;
                    color: rgba(255,255,255,0.3);
                    letter-spacing: 3px;
                    margin-bottom: 1rem;
                }
                .participant-card {
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    padding: 1.2rem;
                    margin-bottom: 0.8rem;
                    transition: all 0.3s;
                }
                .participant-card:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
                .participant-card.editing { border-color: var(--secondary); background: rgba(0,200,83,0.05); }

                .pc-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.8rem;
                }
                .pc-num {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    background: rgba(255,95,0,0.1);
                    color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 900;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }
                .pc-info { flex: 1; min-width: 0; }
                .pc-name { display: block; font-weight: 700; font-size: 1rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .pc-meta { display: block; font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 2px; }

                .pc-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
                .pc-btn {
                    width: 32px; height: 32px;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: transparent;
                    color: rgba(255,255,255,0.4);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex; align-items: center; justify-content: center;
                }
                .pc-btn.edit:hover { border-color: var(--secondary); color: var(--secondary); background: rgba(0,200,83,0.1); }
                .pc-btn.delete:hover { border-color: #ff4444; color: #ff4444; background: rgba(255,68,68,0.1); }

                .pc-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.3);
                }

                /* ============ RESPONSIVE ============ */
                @media (max-width: 1100px) {
                    .registration-content-wrapper { grid-template-columns: 1fr !important; gap: 3rem !important; padding: 0 3rem !important; }
                    .reg-info-glass { text-align: center; display: flex; flex-direction: column; align-items: center; }
                    .event-desc-premium { margin: 0 auto 2rem; }
                    .deliverables-unique { justify-content: center; }
                    .back-link-unique { justify-content: center; margin-bottom: 2rem; }
                    .form-glass-card { padding: 3rem !important; }
                }
                @media (max-width: 768px) {
                    .registration-content-wrapper { padding: 0 2rem !important; gap: 2.5rem !important; }
                    .event-title-extreme { font-size: clamp(2rem, 8vw, 3.5rem) !important; margin-bottom: 2.5rem !important; line-height: 1.1; }
                    .form-glass-card { padding: 2.5rem 1.5rem !important; }
                    .form-header-premium h2 { font-size: 1.8rem; }
                    .form-grid-premium { gap: 1rem; }
                }
                @media (max-width: 600px) {
                    .registration-content-wrapper { padding: 0 1.2rem !important; gap: 2rem !important; }
                    .form-grid-premium, .cat-options-grid { grid-template-columns: 1fr !important; }
                    .form-glass-card { padding: 2rem 1.2rem !important; border-radius: 20px !important; }
                    .event-title-extreme { font-size: 2rem !important; margin-bottom: 2rem !important; }
                    .event-stats-glass-grid { grid-template-columns: 1fr !important; }
                    .stat-card-mini.full { grid-column: span 1 !important; }
                    .tc-value { font-size: 3rem; }
                    .tc-btn { width: 44px; height: 44px; font-size: 1.3rem; }
                    .pc-details { flex-direction: column; gap: 0.3rem; }
                    .btn-cancel-edit { margin-top: 1rem; padding: 1rem; }
                }
                @media (max-width: 480px) {
                    .registration-content-wrapper { padding: 0 1rem !important; gap: 1.5rem !important; }
                    .form-glass-card { padding: 1.5rem 1rem !important; border-radius: 16px !important; }
                    .event-title-extreme { font-size: 1.8rem !important; }
                    .form-header-premium h2 { font-size: 1.5rem; text-align: center; }
                    .form-header-premium .header-line { margin: 0 auto 2rem; }
                    .tc-selector { flex-wrap: wrap; }
                    .btn-submit-premium-mad { padding: 1rem; font-size: 0.8rem; }
                    .cat-card-option { padding: 0.8rem; }
                    .cat-card-option .cat-name { font-size: 0.75rem; }
                    .cat-card-option .cat-price { font-size: 0.9rem; }
                }
                @media (max-width: 360px) {
                    .registration-content-wrapper { padding: 0 0.8rem !important; }
                    .event-title-extreme { font-size: 1.5rem !important; }
                    .tc-value { font-size: 2.5rem; }
                    .stat-card-mini { padding: 1rem; }
                }
            `}</style>
        </div>
    );
}
