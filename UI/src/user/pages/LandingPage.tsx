import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GagnerEvent } from '../../shared/utils/storage';

declare const gsap: any;
declare const ScrollTrigger: any;

export default function LandingPage({ events, leaderboard }: { events: GagnerEvent[], leaderboard: any }) {
  const [activeIndex, setActiveIndex] = React.useState(1);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // --- PARALLAX TEXT ---
    gsap.utils.toArray('.massive-text').forEach((text: any) => {
        // Reveal
        gsap.fromTo(text, 
            { x: -100, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.5, ease: "power4.out", scrollTrigger: {
                trigger: text,
                start: "top 90%",
                toggleActions: "play none none none"
            }}
        );

        // Parallax
        gsap.to(text, {
            xPercent: -20 * parseFloat(text.dataset.speed || "1"),
            ease: "none",
            scrollTrigger: {
                trigger: '.about-massive',
                start: "top bottom",
                end: "bottom top",
                scrub: 1
            }
        });
    });

    // --- HORIZONTAL SERVICES ---
    const servicesSection = document.querySelector('.services-horizontal-unique') as HTMLElement;
    const servicesTrack = document.querySelector('.services-track-new') as HTMLElement;

    // Kill any leftover services ScrollTrigger from previous mount
    const existingST = ScrollTrigger.getById("servicesHorizontal");
    if (existingST) existingST.kill(true);

    if (servicesSection && servicesTrack) {
        // Reset any leftover transform from previous GSAP run
        gsap.set(servicesTrack, { x: 0, clearProps: "transform" });

        let mm = gsap.matchMedia();
        mm.add("(min-width: 769px)", () => {
            const getScrollAmount = () => {
                const trackWidth = servicesTrack.scrollWidth;
                const viewportWidth = document.documentElement.clientWidth;
                return Math.max(0, trackWidth - viewportWidth);
            };

            const horizontalST = gsap.to(servicesTrack, {
                x: () => -getScrollAmount(),
                ease: "none",
                scrollTrigger: {
                    id: "servicesHorizontal",
                    trigger: servicesSection,
                    pin: true,
                    pinSpacing: true,
                    anticipatePin: 1,
                    start: "top top",
                    end: () => `+=${getScrollAmount()}`,
                    scrub: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self: any) => {
                      const head = document.querySelector('#services .heading-unique');
                      if (head) {
                          gsap.set(head, { x: (self.progress * 100) - 20 });
                      }
                    }
                }
            });

            gsap.utils.toArray('.ss-img img').forEach((img: any) => {
                gsap.fromTo(img, 
                    { xPercent: -10 },
                    {
                        xPercent: 10,
                        ease: "none",
                        scrollTrigger: {
                            trigger: img.closest('.service-slide'),
                            containerAnimation: horizontalST,
                            start: "left right",
                            end: "right left",
                            scrub: true
                        }
                    }
                );
            });
            
            return () => {
                // Kill this specific trigger on matchMedia revert
                const st = ScrollTrigger.getById("servicesHorizontal");
                if (st) st.kill(true);
                gsap.set(servicesTrack, { clearProps: "all" });
            };
        });
    }

    // --- HEADING REVEAL ---
    gsap.utils.toArray('.heading-unique').forEach((heading: any) => {
        const filled = heading.querySelector('.filled');
        const outline = heading.querySelector('.outline');
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: heading,
                start: "top 90%",
                toggleActions: "play none none none"
            }
        });
        if (filled) {
            tl.fromTo(filled, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" });
        }
        if (outline) {
            tl.fromTo(outline, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, ease: "power4.out" }, "-=0.8");
        }
    });

    // --- STACKED EVENTS ---
    gsap.utils.toArray('.event-stack-item').forEach((item: any) => {
        const isEven = item.matches(':nth-child(even)');
        gsap.fromTo(item.querySelector('.esi-img'), 
            { x: isEven ? 100 : -100, opacity: 0 },
            { x: 0, opacity: 1, duration: 1.5, ease: "power4.out", scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none none"
            }}
        );
        gsap.fromTo(item.querySelector('.esi-content'), 
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2, delay: 0.2, ease: "power3.out", scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none none"
            }}
        );
    });

    // --- UNIQUE WAVE HERO TEXT ---
    const heroTl = gsap.timeline();
    
    // Fix for overlapping text on navigation back:
    // If intro is already done (from App.tsx), ensure titles are correctly positioned
    gsap.set('.hero-title', { y: 0 });

    heroTl.fromTo('.hero-title span', 
        { y: 80, opacity: 0, filter: 'blur(10px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.1, ease: "back.out(1.7)", delay: 1 }
    );

    // --- CINEMATIC HERO SLIDESHOW ---
    const slides = document.querySelectorAll('.hero-slide');
    let slideInterval: any;
    let floatingTl: any;

    if (slides.length > 0) {
        let currentSlide = 0;
        const totalSlides = slides.length;

        // Reset all slides
        gsap.set(slides, { display: 'none', opacity: 0, zIndex: 1, scale: 1, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
        gsap.set(slides[0], { display: 'block', opacity: 1, zIndex: 10 });

        // Floating Effect for Active Slide
        const startFloating = (el: Element) => {
            if (floatingTl) floatingTl.kill();
            floatingTl = gsap.timeline({ repeat: -1, yoyo: true });
            floatingTl.to(el, { 
                scale: 1.05, 
                duration: 8, 
                ease: "sine.inOut" 
            }).to(el, {
                x: 10,
                y: -10,
                duration: 6,
                ease: "sine.inOut"
            }, 0);
        };

        const nextSlide = () => {
            const next = (currentSlide + 1) % totalSlides;
            const prev = currentSlide;
            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.set(slides[prev], { display: 'none', zIndex: 1 });
                    startFloating(slides[next]);
                }
            });
            
            // 1. Position next slide BELOW the current one but ready
            tl.set(slides[next], { 
                display: 'block',
                opacity: 1,
                zIndex: 20,
                scale: 1.2,
                clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' // Start as a vertical line on the right
            })
            // 2. Diagonal Wipe Reveal
            .to(slides[next], { 
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                duration: 1.8, 
                ease: "expo.inOut" 
            })
            // 3. Zoom Out to settle
            .to(slides[next], { 
                scale: 1, 
                duration: 2, 
                ease: "power2.out" 
            }, "-=1.4")
            // 4. Subtle fade out of previous (safety)
            .to(slides[prev], {
                opacity: 0,
                duration: 1,
                ease: "power2.inOut"
            }, "-=1.8");

            currentSlide = next;
        };
        
        startFloating(slides[0]);
        slideInterval = setInterval(nextSlide, 6000);
    }

    // --- ABOUT REVEAL ---
    gsap.fromTo('.about-desc p', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 0.8, duration: 1.5, ease: "power4.out", scrollTrigger: {
            trigger: '.about-desc',
            start: "top 90%",
            toggleActions: "play none none none"
        }}
    );

    // --- STATS COUNTER ---
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((numEl: any) => {
        const target = parseInt((numEl as HTMLElement).dataset.target || "0");
        ScrollTrigger.create({
            trigger: numEl,
            start: "top 85%",
            once: true,
            onEnter: () => {
                gsap.to({ val: 0 }, {
                    val: target,
                    duration: 2,
                    ease: "power2.out",
                    onUpdate: function(this: any) {
                        (numEl as HTMLElement).textContent = Math.round(this.targets()[0].val).toString();
                    }
                });
            }
        });
    });

    const lbBtn = document.getElementById('nav-leaderboard');
    // Logic moved to App.tsx / LeaderboardOverlay

    return () => {
        if (slideInterval) clearInterval(slideInterval);
        heroTl.kill();
        // Kill ALL ScrollTriggers and reset pinned elements
        ScrollTrigger.getAll().forEach((t: any) => t.kill(true));
        // Reset services track transform to prevent stale state on re-mount
        const track = document.querySelector('.services-track-new') as HTMLElement;
        if (track) gsap.set(track, { clearProps: "all" });
    };
  }, [events]);

  const calculateTimeLeft = (deadline: string) => {
    if (!deadline) return null;
    const dateObj = new Date(deadline);
    if (isNaN(dateObj.getTime())) return null; // Handle Invalid Date
    
    const diff = dateObj.getTime() - Date.now();
    if (diff <= 0) return null;
    
    return {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / (1000 * 60)) % 60),
        s: Math.floor((diff / 1000) % 60)
    };
  };

  return (
    <div className="landing-page-mad">
      <section className="hero-brutal">
          <div className="hero-content">
              <h1 className="hero-title"><span>WE ENGINEER</span></h1>
              <h1 className="hero-title indent"><span className="secondary">ATHLETIC</span></h1>
              <h1 className="hero-title"><span>EXCELLENCE</span></h1>
              <div className="hero-footer">
                  <p>05 YEARS OF ELITE MARATHON MANAGEMENT</p>
                  <div className="scroll-indicator"><div className="line"></div><span>SCROLL</span></div>
              </div>
          </div>
          <div className="hero-visual">
              <img src="/images/hero_marathon_8k.png" alt="8K Marathon Runner" className="hero-slide active" />
              <img src="/images/hero_football.png" alt="Football Player" className="hero-slide" />
              <img src="/images/hero_cricket.png" alt="Cricket Player" className="hero-slide" />
              <img src="/images/hero_visual.png" alt="Athletes" className="hero-slide" />
          </div>
      </section>

      <section id="about" className="about-massive">
          <div className="massive-text-wrap">
            <h2 className="massive-text" data-speed="0.8">UNCOMPROMISING</h2>
            <h2 className="massive-text outline" data-speed="1.2">PRECISION.</h2>
          </div>
          <div className="about-desc">
              <p>GAGNER SPORTS is aimed at inculcating the value of sport in kids and adults. We offer the Best-in-Class Sports program for kids and adults. Every child can be successful at one sport or another. We help you find the hidden skill and employ techniques to develop fine and gross motor skills.</p>
          </div>
      </section>

      <section className="stats-section" id="stats">
          <div className="stats-grid">
              {[
                  { target: "5", label: "YEARS FOUNDED" },
                  { target: "50", label: "EVENTS ORGANIZED" },
                  { target: "10", label: "HAPPY PARTICIPANTS", plus: "K+" },
                  { target: "100", label: "CORPORATE PARTNERS" }
              ].map((s, idx) => (
                  <div key={idx} className="stat-item">
                      <span className="stat-number" data-target={s.target}>{s.target}</span>
                      <span className="stat-plus">{s.plus || "+"}</span>
                      <div className="stat-label">{s.label}</div>
                  </div>
              ))}
          </div>
      </section>

      <section id="services" className="services-horizontal-unique">
          <div className="services-pin-content">
              <div className="section-heading-wrap">
                <h2 className="heading-unique">
                    <span className="outline">OUR</span> <span className="filled">SERVICES</span>
                </h2>
              </div>
              <div className="services-track-new">
                {[
                  { title: 'CRICKET PROJECTS', desc: 'IPL-style league management.', img: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1400&auto=format&fit=crop', btn: 'EXPLORE' },
                  { title: 'FOOTBALL ACADEMY', desc: 'Elite academy training.', img: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1400&auto=format&fit=crop', btn: 'JOIN' },
                  { title: 'ATHLETICS TRAINING', desc: 'Comprehensive coaching.', img: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1400&auto=format&fit=crop', btn: 'TRAIN NOW' },
                  { title: 'SPORTS MANAGEMENT', desc: 'Professional event planning.', img: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=1400&auto=format&fit=crop', btn: 'CONSULT' }
                ].map((s, idx) => (
                    <div key={idx} className="service-slide hover-target">
                        <div className="sc-num">0{idx + 1}</div>
                        <div className="ss-img"><img src={s.img} alt={s.title} /></div>
                        <div className="ss-overlay"></div>
                        <div className="ss-info">
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                            <a href="#contact" className="btn-neon small hover-target">{s.btn}</a>
                        </div>
                    </div>
                ))}
              </div>
          </div>
      </section>

      <section id="events" className="events-vertical-unique">
          <div className="section-heading-wrap">
              <h2 className="heading-unique">
                  <span className="filled">UPCOMING</span>
                  <span className="outline">SERIES</span>
              </h2>
          </div>
          <div className="events-stack">
              {events.map((item, idx) => (
                  <div key={idx} className="event-stack-item hover-target">
                      <div className="esi-img">
                          <img src={item.bgImg || `/images/${item.slug.replace(/-/g, '_')}.png`} alt={item.title} />
                      </div>
                      <div className="esi-content">
                          <div className="esi-meta">
                              <span className="ec-tag">{item.tag}</span>
                              <span className="ec-year">2026</span>
                          </div>
                          <h3>{item.title}</h3>
                          
                          <div className="esi-bottom">
                              <div className="ec-countdown">
                                  {calculateTimeLeft(item.date) ? (
                                      <>
                                          <div className="cd-item"><span>{calculateTimeLeft(item.date)?.d}</span><small>D</small></div>
                                          <div className="cd-item"><span>{calculateTimeLeft(item.date)?.h}</span><small>H</small></div>
                                          <div className="cd-item"><span>{calculateTimeLeft(item.date)?.m}</span><small>M</small></div>
                                          <div className="cd-item accent"><span>{calculateTimeLeft(item.date)?.s}</span><small>S</small></div>
                                      </>
                                  ) : (
                                      <span className="event-started-badge">EVENT STARTED</span>
                                  )}
                              </div>
                              
                              <div className="esi-actions">
                                  <span className="btn-details-static">DETAILS</span>
                                  <Link to={`/register/${item.slug}`} className="btn-neon small hover-target solid">BOOK NOW</Link>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      <section id="gallery" className="gallery-clean-section" style={{ padding: '8rem 4rem', background: '#0a0a0a', position: 'relative' }}>
          <div className="gallery-bg-text" style={{ position: 'absolute', top: '5%', left: '0', fontSize: '15vw', color: 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap', fontWeight: 900, pointerEvents: 'none' }}>EVENT SHOWCASE</div>
          
          <div className="section-heading-wrap" style={{ marginBottom: '4rem', zIndex: 10, position: 'relative' }}>
              <h2 className="heading-unique">
                  <span className="outline">MOMENTS</span>
                  <span className="filled">OFFICIAL</span>
              </h2>
          </div>

          <div className="gallery-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem',
              position: 'relative',
              zIndex: 2
          }}>
              {[
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07340-1536x1153.jpg', title: 'Champions Spirit', tag: 'PODIUM' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-06-at-2.40.03-PM-scaled.jpeg', title: 'The Starting Line', tag: 'RACE DAY' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07367-1536x1153.jpg', title: 'Victory Trophies', tag: 'AWARDS' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07474-scaled.jpg', title: 'Junior Athletes', tag: 'KIDS RUN' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07943-1536x1153.jpg', title: 'Endurance Test', tag: 'MARATHON' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07719-scaled.jpg', title: 'Community Run', tag: 'FITNESS' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07254-scaled-720x541.jpg', title: 'The Pacer Group', tag: 'ELITE' },
                  { img: 'https://gagnersports.com/wp-content/uploads/2025/10/DSC07262-scaled-720x541.jpg', title: 'Energy Booster', tag: 'STADIUM' }
              ].map((item, idx) => (
                  <div key={idx} className="gallery-grid-item" style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '8px',
                      aspectRatio: '4/3',
                      cursor: 'pointer',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }} 
                  onMouseEnter={(e) => {
                      const img = e.currentTarget.querySelector('img');
                      const overlay = e.currentTarget.querySelector('.gg-overlay') as HTMLElement;
                      if (img) img.style.transform = 'scale(1.08)';
                      if (overlay) overlay.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                      const img = e.currentTarget.querySelector('img');
                      const overlay = e.currentTarget.querySelector('.gg-overlay') as HTMLElement;
                      if (img) img.style.transform = 'scale(1)';
                      if (overlay) overlay.style.opacity = '0';
                  }}>
                      <img src={item.img} alt={item.title} style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
                      }} />
                      <div className="gg-overlay" style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                          opacity: 0,
                          transition: 'opacity 0.4s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end',
                          padding: '2rem'
                      }}>
                          <span style={{
                              color: '#ff5f00',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              letterSpacing: '2px',
                              marginBottom: '0.5rem',
                              textTransform: 'uppercase'
                          }}>{item.tag}</span>
                          <h3 style={{
                              color: '#fff',
                              fontSize: '1.4rem',
                              fontWeight: 800,
                              margin: 0,
                              textTransform: 'uppercase'
                          }}>{item.title}</h3>
                      </div>
                  </div>
              ))}
          </div>
      </section>


      <section id="blogs" className="blogs-section-brutal">
          <div className="section-heading-wrap" style={{ marginBottom: '4rem' }}>
              <h2 className="heading-unique">
                  <span className="filled">LATEST</span>
                  <span className="outline">INSIGHTS</span>
              </h2>
          </div>
          <div className="blogs-grid">
              {[
                  { 
                      title: "The Ultimate Marathon Training Guide", 
                      desc: "From local runs to elite marathons, we break down the science of endurance and recovery.",
                      img: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1200&auto=format&fit=crop",
                      tag: "TRAINING"
                  },
                  { 
                      title: "Nutrition for Peak Performance", 
                      desc: "Fueling your body with the right balance of macro and micro-nutrients for match day success.",
                      img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200&auto=format&fit=crop",
                      tag: "NUTRITION"
                  },
                  { 
                      title: "Building a Sports Community", 
                      desc: "How Gagner Sports is transforming the local athletic landscape through community engagement.",
                      img: "/images/blog_community_sports.png",
                      tag: "COMMUNITY"
                  }
              ].map((blog, idx) => (
                  <div key={idx} className="blog-card-unique hover-target">
                      <div className="bc-img-wrap">
                          <img src={blog.img} alt={blog.title} />
                          <div className="bc-tag">{blog.tag}</div>
                      </div>
                      <div className="bc-content">
                          <div className="bc-date">MARCH 21, 2026</div>
                          <h3>{blog.title}</h3>
                          <p>{blog.desc}</p>
                          <Link to={`/blog/${blog.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="read-more-btn hover-target">READ ARTICLE <span className="arrow">→</span></Link>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      <section id="sponsors" style={{ padding: '6rem 0', background: '#111', overflow: 'hidden', borderTop: '1px solid #222' }}>
          <div className="section-heading-wrap" style={{ marginBottom: '3rem' }}>
              <h2 className="heading-unique" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
                  <span className="outline">OUR</span>
                  <span className="filled">PARTNERS</span>
              </h2>
          </div>
           <div style={{ display: 'flex', gap: '4rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ display: 'flex', gap: '5rem', animation: 'marquee 30s linear infinite', fontWeight: 800, fontSize: '2rem', color: '#555', alignItems: 'center' }}>
                  <span style={{ color: '#ff5f00', fontSize: '1.2rem', letterSpacing: '4px' }}>OFFICIAL PARTNERS</span>
                  {/* DECATHLON */}
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Decathlon_Logo.svg" alt="Decathlon" style={{ height: '25px', filter: 'brightness(0) invert(1)' }} />
                  {/* GEM HOSPITAL */}
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900 }}>GEM <span style={{ color: '#ff5f00' }}>HOSPITAL</span></span>
                  {/* CONTUS */}
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>CONTUS</span>
                  {/* UNIBIC */}
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, fontStyle: 'italic' }}>UNIBIC</span>
                  {/* JOSH */}
                  <span style={{ color: '#ea4c89', fontSize: '1.8rem', fontWeight: 900 }}>Josh</span>
                  {/* IOB */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', background: '#00529b', color: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>IOB</div>
                    <span style={{ color: '#fff', fontSize: '1.2rem' }}>Indian Overseas Bank</span>
                  </div>
              </div>
              {/* Duplicate for infinite effect */}
              <div style={{ display: 'flex', gap: '5rem', animation: 'marquee 30s linear infinite', fontWeight: 800, fontSize: '2rem', color: '#555', alignItems: 'center' }} aria-hidden="true">
                  <span style={{ color: '#ff5f00', fontSize: '1.2rem', letterSpacing: '4px' }}>OFFICIAL PARTNERS</span>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Decathlon_Logo.svg" alt="Decathlon" style={{ height: '25px', filter: 'brightness(0) invert(1)' }} />
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 900 }}>GEM <span style={{ color: '#ff5f00' }}>HOSPITAL</span></span>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>CONTUS</span>
                  <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, fontStyle: 'italic' }}>UNIBIC</span>
                  <span style={{ color: '#ea4c89', fontSize: '1.8rem', fontWeight: 900 }}>Josh</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '30px', height: '30px', background: '#00529b', color: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>IOB</div>
                    <span style={{ color: '#fff', fontSize: '1.2rem' }}>Indian Overseas Bank</span>
                  </div>
              </div>
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
      </section>

      <section id="contact" className="contact-section">
          <div className="contact-wrapper">
              <div className="contact-header">
                  <h2>GET IN <span className="green">TOUCH</span></h2>
                  <p>Have a question? Want to collaborate? Reach out to us.</p>
              </div>
              <form className="contact-form" style={{ marginTop: '3rem' }} onSubmit={(e) => e.preventDefault()}>
                  <div className="form-row">
                      <div className="form-group"><label>NAME</label><input type="text" placeholder="Your Name" /></div>
                      <div className="form-group"><label>EMAIL</label><input type="email" placeholder="email@example.com" /></div>
                  </div>
                  <div className="form-group full-width" style={{ marginTop: '1.5rem' }}>
                      <label>MESSAGE</label><textarea placeholder="How can we help?" rows={4}></textarea>
                  </div>
                  <div className="contact-actions" style={{ marginTop: '2rem', justifyContent: 'flex-start' }}>
                      <button type="submit" className="btn-contact-unique hover-target">GET IN TOUCH →</button>
                  </div>
              </form>
          </div>
      </section>
    </div>
  );
}
