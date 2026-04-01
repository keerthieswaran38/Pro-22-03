import React, { useState, useLayoutEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GagnerEvent } from '../../shared/utils/storage';
import gsap from 'gsap';

// PAYMENT: Always use the absolute Render backend URL — never a proxy or relative path.
const BACKEND_URL = 'https://gagnertest.onrender.com';

interface ParticipantForm {
    name: string;
    email: string;
    phone: string;
    gender: string;
    age: string;
    tshirtSize: string;
    category: string;
}

const emptyForm: ParticipantForm = {
    name: '', email: '', phone: '', gender: '', age: '', tshirtSize: '', category: ''
};

export default function RegistrationPage({ events }: { events: Record<string, GagnerEvent> }) {
    const { slug } = useParams<{ slug: string }>();

    // Check if we are still waiting for events to load (object is empty)
    const isDataLoading = Object.keys(events).length === 0;
    const event = slug ? events[slug] : null;

    // Multi-participant state
    const [ticketCount, setTicketCount] = useState(1);
    const [participants, setParticipants] = useState<ParticipantForm[]>([]);
    const [currentForm, setCurrentForm] = useState<ParticipantForm>({ ...emptyForm });
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'count' | 'fill'>('count');
    const formRef = useRef<HTMLDivElement>(null);

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

            gsap.fromTo('.bg-glow-orb',
                { opacity: 0, scale: 0.5 },
                { opacity: 1, scale: 1, duration: 3, stagger: 0.5, ease: 'sine.inOut' }
            );
        });

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
                <Link to="/" style={{ color: '#fff', background: '#ff5f00', fontWeight: 800, textDecoration: 'none', padding: '1.2rem 2.5rem', borderRadius: '12px', boxShadow: '0 20px 40px rgba(255,95,0,0.2)' }}>BACK TO HOME</Link>
            </div>
        );
    }

    const handleAddParticipant = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingIndex !== null) {
            const updated = [...participants];
            updated[editingIndex] = { ...currentForm };
            setParticipants(updated);
            setEditingIndex(null);
        } else {
            setParticipants(prev => [...prev, { ...currentForm }]);
        }
        setCurrentForm({ ...emptyForm });
        setTimeout(() => {
            const cards = document.querySelector('.filled-participants-list');
            if (cards) cards.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    };

    const handleEditParticipant = (idx: number) => {
        setCurrentForm({ ...participants[idx] });
        setEditingIndex(idx);
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
            const totalAmount = participants.reduce((sum, p) => {
                const cat = event.categories.find(c => c.name === p.category);
                return sum + (cat ? Number(cat.price) : 0);
            }, 0);

            const orderId = `GS${Date.now()}`;
            const checkoutData = JSON.stringify({
                eventID: event.slug,
                participants: participants.map((p) => ({
                    ...p,
                    ticketCategory: p.category,
                    eventName: event.title,
                }))
            });

            const encodedData = encodeURIComponent(checkoutData);

            // 1. Fetch JSON Handshake from Render
            const response = await fetch(`${BACKEND_URL}/api/payment/initiate?amount=${totalAmount}&orderId=${orderId}&data=${encodedData}`);
            const result = await response.json();

            if (!result.success) throw new Error(result.error || 'Failed to initialize payment');

            const { encRequest, access_code, merchant_id, gateway_url } = result;

            // 2. Programmatically submit hidden form to CCAvenue
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = gateway_url;
            form.target = '_top'; // Force top-level navigation to ensure clean header passing
            form.enctype = 'application/x-www-form-urlencoded'; // Ensure standard form-data format

            // Ensure the Referrer Policy is set explicitly for this cross-origin POST
            const meta = document.createElement('meta');
            meta.name = "referrer";
            meta.content = "no-referrer-when-downgrade";
            document.head.appendChild(meta);

            const fields = [
                { name: 'encRequest', value: String(encRequest) },
                { name: 'access_code', value: String(access_code) },
                { name: 'merchant_id', value: String(merchant_id) }
            ];

            fields.forEach(f => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = f.name;
                input.value = f.value;
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();

        } catch (err: any) {
            console.error('Payment Error:', err);
            alert(`Payment setup failed: ${err.message || 'Unknown error'}`);
            setLoading(false);
        }
    };

    return (
        <div className="registration-mad-container" style={{ minHeight: '100vh', background: '#020408', color: '#fff', paddingTop: '100px', paddingBottom: '80px', position: 'relative', overflowX: 'hidden' }}>

            {/* REDIRECTION OVERLAY */}
            {loading && (
                <div className="payment-handshake-overlay">
                    <div className="ph-content">
                        <div className="ph-spinner"></div>
                        <h3>SECURE PAYMENT HANDSHAKE</h3>
                        <p>Redirecting to CCAvenue Payment Gateway...</p>
                        <span className="ph-note">Please do not refresh or close this window</span>
                    </div>
                </div>
            )}

            <div className="bg-glow-orb" style={{ position: 'absolute', top: '10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(255, 95, 0, 0.08) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }}></div>
            <div className="bg-glow-orb" style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0, 200, 83, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', zIndex: 0 }}></div>

            <div className="registration-content-wrapper" style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '0 4rem', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '6rem' }}>

                <div className="reg-info-glass">
                    <Link to="/" className="back-link-unique">
                        <span className="arrow">←</span> <span className="text">BACK TO EXPLORE</span>
                    </Link>
                    <div className="event-badge-unique">
                        <span className="dot"></span> {event.tag || 'ELITE EVENT'}
                    </div>
                    <h1 className="event-title-extreme">{event.title}</h1>
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
                    <div className="event-desc-premium">
                        <p>{event.desc || 'Join us for athletic excellence.'}</p>
                    </div>
                </div>

                <div className="reg-form-glass-wrap" ref={formRef}>
                    <div className="form-glass-card">
                        <div className="form-header-premium">
                            <h2>SECURE YOUR <span className="highlight">SLOT</span></h2>
                            <div className="header-line"></div>
                        </div>

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

                        {step === 'fill' && (
                            <>
                                <div className="reg-progress-bar">
                                    <div className="rpb-text">
                                        <span>{editingIndex !== null ? `EDITING PARTICIPANT ${editingIndex + 1}` : `PARTICIPANT ${participants.length + 1} OF ${ticketCount}`}</span>
                                        <span className="rpb-count">{participants.length}/{ticketCount} FILLED</span>
                                    </div>
                                    <div className="rpb-track">
                                        <div className="rpb-fill" style={{ width: `${(participants.length / ticketCount) * 100}%` }}></div>
                                    </div>
                                </div>

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
                                                <input type="text" required value={currentForm.phone} onChange={e => setCurrentForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} placeholder="00000 00000" />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>GENDER</label>
                                                <div className="custom-select-wrap">
                                                    <div className={`cs-current ${currentForm.gender ? 'active' : ''}`} onClick={() => document.getElementById('gender-dropdown')?.classList.toggle('show')}>
                                                        {currentForm.gender || "Select Gender"} <span className="cs-arrow">▼</span>
                                                    </div>
                                                    <div id="gender-dropdown" className="cs-options">
                                                        {["Male", "Female", "Other"].map(opt => (
                                                            <div key={opt} className="cs-option" onClick={() => { setCurrentForm(f => ({ ...f, gender: opt })); document.getElementById('gender-dropdown')?.classList.remove('show'); }}>{opt}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-group-premium">
                                                <label>AGE</label>
                                                <input type="text" required value={currentForm.age} onChange={e => setCurrentForm(f => ({ ...f, age: e.target.value.replace(/\D/g, '') }))} placeholder="Years" />
                                            </div>
                                            <div className="form-group-premium">
                                                <label>T-SHIRT SIZE</label>
                                                <div className="custom-select-wrap">
                                                    <div className={`cs-current ${currentForm.tshirtSize ? 'active' : ''}`} onClick={() => document.getElementById('size-dropdown')?.classList.toggle('show')}>
                                                        {currentForm.tshirtSize || "Select Size"} <span className="cs-arrow">▼</span>
                                                    </div>
                                                    <div id="size-dropdown" className="cs-options">
                                                        {['22', '24', '26', '28', '30', '32', '34', '36'].map(opt => (
                                                            <div key={opt} className="cs-option" onClick={() => { setCurrentForm(f => ({ ...f, tshirtSize: opt })); document.getElementById('size-dropdown')?.classList.remove('show'); }}>{opt}</div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="category-select-premium">
                                            <label>CHOOSE CATEGORY</label>
                                            <div className="cat-options-grid">
                                                {(event?.categories || []).map((cat, i) => (
                                                    <div key={i} className={`cat-card-option ${currentForm.category === cat.name ? 'selected' : ''}`} onClick={() => setCurrentForm(f => ({ ...f, category: cat.name }))}>
                                                        <div className="cat-info">
                                                            <span className="cat-name">{cat.name}</span>
                                                            <span className="cat-price">₹{cat.price}</span>
                                                        </div>
                                                        <div className="cat-check"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <button type="submit" className="btn-submit-premium-mad" style={{ background: editingIndex !== null ? '#00C853' : undefined }}>
                                            {editingIndex !== null ? 'UPDATE PARTICIPANT ✓' : `ADD PARTICIPANT ${participants.length + 1} →`}
                                        </button>
                                    </form>
                                )}

                                {participants.length > 0 && (
                                    <div className="filled-participants-list">
                                        <h4 className="fpl-title">REGISTERED PARTICIPANTS ({participants.length})</h4>
                                        {(participants || []).map((p, idx) => (
                                            <div key={idx} className={`participant-card ${editingIndex === idx ? 'editing' : ''}`}>
                                                <div className="pc-header">
                                                    <div className="pc-num">{idx + 1}</div>
                                                    <div className="pc-info">
                                                        <span className="pc-name">{p.name}</span>
                                                        <span className="pc-meta">{p.category} • Age {p.age}</span>
                                                    </div>
                                                    <div className="pc-actions">
                                                        <button type="button" className="pc-btn edit" onClick={() => handleEditParticipant(idx)}>✎</button>
                                                        <button type="button" className="pc-btn delete" onClick={() => handleDeleteParticipant(idx)}>✕</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {allFilled && editingIndex === null && (
                                    <button type="button" disabled={loading} className="btn-submit-premium-mad btn-final-submit" onClick={handleFinalSubmit}>
                                        {loading ? 'SUBMITTING...' : `COMPLETE REGISTRATION (${ticketCount} PARTICIPANTS) →`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .registration-mad-container { font-family: 'Outfit', sans-serif; }
                .payment-handshake-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(2, 4, 8, 0.98); backdrop-filter: blur(10px); z-index: 9999; display: flex; align-items: center; justify-content: center; }
                .ph-spinner { width: 60px; height: 60px; border: 3px solid rgba(255, 95, 0, 0.2); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 2rem; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .ph-content { text-align: center; }
                .ph-content h3 { letter-spacing: 4px; font-weight: 900; margin-bottom: 0.5rem; }
                .ph-note { font-size: 0.7rem; color: var(--primary); font-weight: 800; letter-spacing: 2px; }
                
                .reg-info-glass { padding-top: 2rem; }
                .event-title-extreme { font-size: clamp(2rem, 6vw, 5rem); font-weight: 900; line-height: 0.95; letter-spacing: -2px; margin-bottom: 3rem; text-transform: uppercase; background: linear-gradient(to bottom, #fff 0%, #eee 40%, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .event-stats-glass-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.2rem; margin-bottom: 2.5rem; }
                .stat-card-mini { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 18px; transition: all 0.3s; }
                .stat-card-mini.full { grid-column: span 2; }
                .form-glass-card { background: rgba(20, 20, 20, 0.85); backdrop-filter: blur(40px); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; padding: 4rem; box-shadow: 0 50px 120px rgba(0,0,0,0.6); }
                .form-grid-premium { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .form-group-premium input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.9rem 1rem; border-radius: 12px; color: #fff; width: 100%; outline: none; }
                .custom-select-wrap { position: relative; }
                .cs-current { background: #111; border: 1px solid rgba(255,255,255,0.1); padding: 0.9rem 1rem; border-radius: 12px; cursor: pointer; display: flex; justify-content: space-between; }
                .cs-options { position: absolute; top: 105%; left: 0; width: 100%; background: #000; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; display: none; z-index: 100; flex-direction: column; overflow: hidden; }
                .cs-options.show { display: flex; }
                .cs-option { padding: 1rem; cursor: pointer; transition: 0.2s; }
                .cs-option:hover { background: var(--primary); color: #000; }
                .cat-options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-bottom: 2rem; }
                .cat-card-option { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 1rem; border-radius: 14px; cursor: pointer; display: flex; justify-content: space-between; }
                .cat-card-option.selected { border-color: var(--primary); background: rgba(255,95,0,0.1); }
                .btn-submit-premium-mad { width: 100%; padding: 1.2rem; background: var(--primary); color: #000; font-weight: 900; border-radius: 14px; cursor: pointer; transition: 0.4s; }
                .btn-final-submit { background: linear-gradient(135deg, var(--primary), var(--secondary)); font-size: 1.1rem; }
                @media (max-width: 600px) { .form-grid-premium, .cat-options-grid { grid-template-columns: 1fr !important; } .form-glass-card { padding: 2rem 1.2rem !important; } }
            `}</style>
        </div>
    );
}
