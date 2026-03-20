import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { GagnerEvent, Participant, saveParticipant } from '../../shared/utils/storage';

export default function RegistrationPage({ events }: { events: Record<string, GagnerEvent> }) {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const event = slug ? events[slug] : null;

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        gender: 'Male',
        ageGroup: '18-35',
        category: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!event) return <div className="event-details-wrap"><h1 className="brutal-heading-large">Event Not Found</h1></div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const p: Participant = {
                id: `P-${Date.now()}`,
                ...form,
                eventSlug: event.slug,
                eventName: event.title,
                registeredAt: new Date().toISOString(),
                paymentStatus: 'Pending'
            };
            await saveParticipant(p);
            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            alert('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="registration-success-wrap">
                <div className="success-content">
                    <div className="success-icon">✓</div>
                    <h2>REGISTRATION SECURE</h2>
                    <p>Welcome to the Elite, <strong>{form.name}</strong>.</p>
                    <p>You are now logged for <strong>{event.title}</strong>.</p>
                    <Link to="/" className="btn-brand">BACK TO HOME</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="registration-wrap" style={{ padding: '10rem 4rem 6rem' }}>
            <div className="reg-container-glass">
                <div className="reg-header">
                    <span className="ec-tag">{event.tag}</span>
                    <h1>EVENT REGISTRATION</h1>
                    <p>{event.title} • {event.venue}</p>
                </div>

                <form className="registration-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>FULL NAME</label>
                            <input 
                                type="text" required 
                                value={form.name} 
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="e.g. Rahul Subramanian"
                            />
                        </div>
                        <div className="form-group">
                            <label>EMAIL ADDRESS</label>
                            <input 
                                type="email" required 
                                value={form.email} 
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="name@example.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>PHONE NUMBER</label>
                            <input 
                                type="tel" required 
                                value={form.phone} 
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="+91 98XXX XXXXX"
                            />
                        </div>
                        <div className="form-group">
                            <label>CITY</label>
                            <input 
                                type="text" required 
                                value={form.city} 
                                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                                placeholder="Chennai"
                            />
                        </div>
                        <div className="form-group">
                            <label>GENDER</label>
                            <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                                <option>Male</option>
                                <option>Female</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>AGE GROUP</label>
                            <select value={form.ageGroup} onChange={e => setForm(f => ({ ...f, ageGroup: e.target.value }))}>
                                <option>Under 18</option>
                                <option>18-35</option>
                                <option>35-50</option>
                                <option>50+</option>
                            </select>
                        </div>
                        <div className="form-group full-width">
                            <label>SELECT CATEGORY</label>
                            <select 
                                required 
                                value={form.category} 
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            >
                                <option value="">Select a category...</option>
                                {event.categories?.map((cat, i) => (
                                    <option key={i} value={cat.name}>{cat.name} (₹{cat.price})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="btn-brand full-width" disabled={loading}>
                        {loading ? 'SECURING DATA...' : 'CONFIRM REGISTRATION →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
