import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

declare const gsap: any;

const CheckIcon = () => (
  <svg className="ed-detail-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default function EventDetailsPage({ events, coupons }: { events: any, coupons: any[] }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const isDataLoading = Object.keys(events).length === 0;
  const event = events[slug || ''] || Object.values(events)[0];

  useEffect(() => {
    window.scrollTo(0, 0);
    gsap.fromTo('.ed-title-wrapper', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power4.out", delay: 0.5 });
    gsap.fromTo('.ed-timer-wrapper', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 });
    gsap.fromTo('.ed-main', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 1.0 });
  }, [slug]);

  // Removed intelligent parser as we now render premium HTML directly.

  if (!event) {
    if (isDataLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
                <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,100,0,0.3)', borderTopColor: '#ff6400', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ marginTop: '1.5rem', letterSpacing: '2px', fontSize: '0.8rem', opacity: 0.5 }}>LOADING...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem', color: '#fff' }}>EVENT NOT FOUND</h2>
            <Link to="/" style={{ color: '#ff6400', fontWeight: 800, textDecoration: 'none', border: '1px solid #ff6400', padding: '1rem 2rem', borderRadius: '4px' }}>GO BACK HOME</Link>
        </div>
    );
  }

  return (
    <div className="event-detail-page-mad">
      <header className="ed-hero" id="ed-hero">
          <div className="ed-hero-bg">
              <img src={event.bgImg || event.imageUrl || `/images/${event.slug?.replace(/-/g, '_')}.png`} alt={event.title} id="ed-bg-img" />
          </div>
          <div className="ed-hero-overlay"></div>
          
          <div className="ed-hero-content">
              <div className="ed-title-wrapper">
                  <div className="ed-badge" id="ed-hero-tag">{event.tag || 'PREMIUM EVENT'}</div>
                  <h1 className="ed-title" id="ed-hero-title">{event.title}</h1>
              </div>
              
              <div className="ed-timer-wrapper">
                  <div className="ed-timer-header">REGISTRATION CLOSES IN</div>
                  <div className="ed-timer-blocks" id="countdown-timer">
                      <div className="ed-time-block"><div className="ed-time-value">25</div><div className="ed-time-label">DAYS</div></div>
                      <div className="ed-colon">:</div>
                      <div className="ed-time-block"><div className="ed-time-value">13</div><div className="ed-time-label">HOURS</div></div>
                      <div className="ed-colon">:</div>
                      <div className="ed-time-block"><div className="ed-time-value">59</div><div className="ed-time-label">MINS</div></div>
                      <div className="ed-colon">:</div>
                      <div className="ed-time-block"><div className="ed-time-value">42</div><div className="ed-time-label">SECS</div></div>
                  </div>
              </div>
          </div>
      </header>

      <main className="ed-main">
          <div className="ed-left-content">
              <div className="ed-meta-grid">
                  <div className="ed-meta-card hover-target"><div className="ed-meta-label">DATE</div><div className="ed-meta-value">{event.date}</div></div>
                  <div className="ed-meta-card hover-target"><div className="ed-meta-label">TIME</div><div className="ed-meta-value">{event.time || '5:30 AM Onwards'}</div></div>
                  <div className="ed-meta-card hover-target" style={{gridColumn: 'span 2'}}><div className="ed-meta-label">VENUE</div><div className="ed-meta-value">{event.venue || 'Chennai, India'}</div></div>
              </div>

              <div className="ed-section" style={{
                    background: 'linear-gradient(145deg, rgba(20,20,20,0.6) 0%, rgba(5,5,5,0.9) 100%)',
                    padding: '3rem',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}>
                  <h2 className="ed-section-title" style={{ marginBottom: '2rem' }}>ABOUT THE <span className="green" style={{marginLeft: '8px'}}>EVENT</span></h2>
                  <div 
                      className="ed-desc-text premium-rich-text" 
                      dangerouslySetInnerHTML={{ __html: event.description || event.desc || '<p>Join us for this amazing premium event!</p>' }}
                  />
              </div>

              <style>{`
                  .premium-rich-text {
                      color: rgba(255,255,255,0.85);
                      font-size: 1.15rem;
                      line-height: 2;
                      text-align: left;
                  }
                  .premium-rich-text p {
                      margin-bottom: 1.5rem;
                  }
                  .premium-rich-text h1, 
                  .premium-rich-text h2, 
                  .premium-rich-text h3 {
                      color: #fff;
                      font-weight: 800;
                      margin-top: 2rem;
                      margin-bottom: 1rem;
                      letter-spacing: -0.5px;
                  }
                  .premium-rich-text h2 {
                      font-size: 1.8rem;
                      border-bottom: 1px solid rgba(255,255,255,0.1);
                      padding-bottom: 0.5rem;
                  }
                  .premium-rich-text h3 {
                      font-size: 1.4rem;
                      color: var(--primary);
                  }
                  .premium-rich-text ul, 
                  .premium-rich-text ol {
                      margin: 1.5rem 0;
                      padding-left: 1.5rem;
                      background: rgba(255,255,255,0.02);
                      border-radius: 12px;
                      padding: 1.5rem 1.5rem 1.5rem 3rem;
                      border: 1px solid rgba(255,255,255,0.05);
                  }
                  .premium-rich-text li {
                      margin-bottom: 0.8rem;
                  }
                  .premium-rich-text a {
                      color: var(--secondary);
                      text-decoration: none;
                      border-bottom: 1px dashed var(--secondary);
                      transition: all 0.3s;
                  }
                  .premium-rich-text a:hover {
                      color: #fff;
                      border-bottom-color: #fff;
                  }
                  .premium-rich-text strong {
                      color: #fff;
                      font-weight: 800;
                  }
              `}</style>

              <div className="ed-section">
                  <h2 className="ed-section-title">CATEGORIES & <span className="green" style={{marginLeft: '8px'}}>PRIZES</span></h2>
                  <div className="ed-categories">
                      {(event?.categories || []).map((cat: any, idx: number) => (
                          <div key={idx} className="ed-category-card">
                              <div className="ed-cat-header">
                                  <div className="ed-cat-title">{cat.name}</div>
                                  <div className="ed-cat-price">{cat.price}</div>
                              </div>
                              <div className="ed-cat-details">
                                  {(cat.details || []).map((d: string, i: number) => (
                                      <div key={i} className="ed-detail-row"><CheckIcon /> {d}</div>
                                  ))}
                              </div>
                              {cat.prizes && (
                                  <div className="ed-prize-pool">
                                      <div style={{color:'var(--secondary)', fontSize:'0.8rem', letterSpacing:'2px', fontWeight:800, marginBottom:'1rem'}}>CASH PRIZES</div>
                                      {cat.prizes["1st"] && <div className="ed-prize-row"><span style={{color:'#FFD700'}}>🥇 1st Place</span> <span>{cat.prizes["1st"]}</span></div>}
                                      {cat.prizes["2nd"] && <div className="ed-prize-row"><span style={{color:'#C0C0C0'}}>🥈 2nd Place</span> <span>{cat.prizes["2nd"]}</span></div>}
                                      {cat.prizes["3rd"] && <div className="ed-prize-row"><span style={{color:'#CD7F32'}}>🥉 3rd Place</span> <span>{cat.prizes["3rd"]}</span></div>}
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
              
              <div className="ed-section">
                  <h2 className="ed-section-title">PARTICIPANT <span className="primary" style={{marginLeft: '8px'}}>DELIVERABLES</span></h2>
                  <div className="ed-deliverables-grid">
                      {(event.deliverables || ["Event T-Shirt", "Finisher Medal", "E-Certificate", "Breakfast"]).map((del: string, idx: number) => (
                          <div key={idx} className="ed-deliverable-item"><CheckIcon /> <span>{del}</span></div>
                      ))}
                  </div>
              </div>
          </div>

          <div className="ed-right-content">
              <div className="ed-form-panel">
                  <div className="ed-form-header">
                      <h2 className="ed-form-title">SECURE YOUR <span className="primary">SPOT</span></h2>
                      <p className="ed-form-subtitle">Join thousands of elite participants. Select your category and confirm your registration below.</p>
                  </div>
                  
                  <form onSubmit={(e) => { e.preventDefault(); navigate(`/register/${event.slug}`); }}>
                      <div className="ed-input-wrapper">
                          <input type="text" className="ed-input" placeholder=" " required />
                          <label className="ed-label">FULL NAME</label>
                      </div>
                      
                      <div className="ed-input-wrapper">
                          <input type="email" className="ed-input" placeholder=" " required />
                          <label className="ed-label">EMAIL ADDRESS</label>
                      </div>
                      
                      <div className="ed-input-wrapper">
                          <input type="tel" className="ed-input" placeholder=" " required />
                          <label className="ed-label">PHONE NUMBER</label>
                      </div>
                      
                      <div className="ed-input-wrapper">
                          <select className="ed-input" required defaultValue="">
                              <option value="" disabled></option>
                              {(event?.categories || []).map((cat: any, idx: number) => (
                                  <option key={idx} value={cat.name}>{cat.name} - {cat.price}</option>
                              ))}
                          </select>
                          <label className="ed-label">SELECT CATEGORY</label>
                      </div>
                      
                      <button type="submit" className="btn-gagner-plasma hover-target">
                          <span className="plasma-text">BOOK NOW</span>
                          <div className="plasma-border"></div>
                      </button>
                  </form>
              </div>
          </div>
      </main>
    </div>
  );
}
