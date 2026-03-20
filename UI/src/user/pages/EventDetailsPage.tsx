import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { GagnerEvent, Coupon } from '../../shared/utils/storage';

export default function EventDetailsPage({ events, coupons }: { events: Record<string, GagnerEvent>, coupons: Coupon[] }) {
    const { slug } = useParams<{ slug: string }>();
    const event = slug ? events[slug] : null;

    if (!event) return <div className="loading-state">Event Not Found</div>;

    const applicableCoupons = coupons.filter(c => c.active && (c.eventId === event.slug || c.eventId === 'ALL'));

    return (
        <div className="event-details-wrap" style={{ padding: '12rem 4rem 8rem' }}>
            <div className="ed-header">
                <Link to="/" className="btn-neon-mini">← BACK TO HOME</Link>
                <h1 className="brutal-heading-large">{event.title}</h1>
                <div className="ed-meta">
                    <span className="ec-tag">{event.tag}</span>
                    <span className="ec-date">{event.date} • {event.venue}</span>
                </div>
            </div>

            <div className="ed-content-grid">
                <div className="ed-main">
                    <img className="ed-hero" src={event.bgImg} alt={event.title} />
                    <div className="ed-description">
                        <h2>ABOUT THE EVENT</h2>
                        <p>{event.desc}</p>
                    </div>
                </div>

                <div className="ed-side">
                    <div className="booking-card-premium">
                        <h3>REGISTRATION</h3>
                        <div className="pricing-grid">
                            {event.categories?.map((cat, i) => (
                                <div key={i} className="pricing-item">
                                    <span>{cat.name}</span>
                                    <span className="price">₹{cat.price}</span>
                                </div>
                            ))}
                        </div>
                        {event.status === 'Open' ? (
                            <Link to={`/register/${event.slug}`} className="btn-brand hover-kinetic full-width">REGISTER NOW →</Link>
                        ) : (
                            <button className="btn-brand full-width" disabled style={{ opacity: 0.5, filter: 'grayscale(1)' }}>
                                {event.status?.toUpperCase() || 'REGISTRATION CLOSED'}
                            </button>
                        )}
                        {event.capacity && (
                           <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-gray)', textAlign: 'center' }}>
                               {event.registeredCount || 0} / {event.capacity} Slots Filled
                           </div>
                        )}
                    </div>

                    <div className="coupons-card">
                        <h4>AVAILABLE OFFERS</h4>
                        {applicableCoupons.map(c => (
                            <div key={c.id} className="coupon-item">
                                <div className="coupon-code">{c.code}</div>
                                <div className="coupon-benefit">{c.discountPercent}% OFF</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
