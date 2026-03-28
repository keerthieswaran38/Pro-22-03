import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GagnerEvent } from '../../shared/utils/storage';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

declare const gsap: any;
declare const ScrollTrigger: any;

export default function LandingPage({ events, leaderboard, content = [] }: { events: GagnerEvent[], leaderboard: any, content?: any[] }) {
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

        // Parallax (reduced movement to prevent clipping)
        gsap.to(text, {
            xPercent: -5 * parseFloat(text.dataset.speed || "1"),
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
        
        // Horizontal scroll ONLY on screens > 480px
        mm.add("(min-width: 481px)", () => {
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

        // On mobile (≤480px): ensure no horizontal scrolling, stack cards vertically
        mm.add("(max-width: 480px)", () => {
            gsap.set(servicesTrack, { clearProps: "all", x: 0 });
            return () => {};
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

    // --- EVENT CARD GLOW EFFECT ---
    const cards = document.querySelectorAll('.event-stack-item');
    cards.forEach((card: any) => {
        const glow = card.querySelector('.event-card-glow');
        if (!glow) return;

        const onMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            gsap.to(glow, { 
                x: x - 150, 
                y: y - 150, 
                opacity: 0.6, 
                duration: 0.6, 
                ease: "power2.out" 
            });
        };

        const onBack = () => {
            gsap.to(glow, { opacity: 0, duration: 1 });
        };

        card.addEventListener('mousemove', onMouseMove);
        card.addEventListener('mouseleave', onBack);
    });

    // --- HERO ENTRANCE (Precision Scanner Reveal) ---
    const hasPreloader = document.querySelector('.preloader');
    const heroTl = gsap.timeline({ delay: hasPreloader ? 2.2 : 0.4 }); 
    
    // Initial: Thin, Outlined, and Scattered
    gsap.set('.hero-title span', { 
        y: 40, 
        opacity: 0, 
        fontWeight: 100,
        filter: 'blur(10px) brightness(0)',
        scale: 0.95
    });
    
    heroTl.to('.hero-title span', {
        y: 0, 
        opacity: 1, 
        fontWeight: 900,
        filter: 'blur(0px) brightness(1)',
        scale: 1,
        duration: 1.5, 
        stagger: 0.1, 
        ease: "expo.out"
    });

    // Interactive Hover Glow
    const heroWrap = document.querySelector('.hero-title');
    if (heroWrap) {
        heroWrap.addEventListener('mousemove', (e: any) => {
            const rect = heroWrap.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            gsap.to('.hero-title span', {
                x: x * 15, y: y * 15, duration: 0.6, ease: "power2.out", stagger: 0.02
            });
            // Update individual word tilts
            gsap.to('.hero-title span:hover', { 
                scale: 1.05, 
                textShadow: "0 0 20px rgba(0,255,130,0.5)",
                duration: 0.3 
            });
        });
        heroWrap.addEventListener('mouseleave', () => {
             gsap.to('.hero-title span', { x: 0, y: 0, scale: 1, textShadow: "none", duration: 1, ease: "power2.out" });
        });
    }

    // --- CINEMATIC HERO SLIDESHOW ---
    const slides = document.querySelectorAll('.hero-visual .hero-slide');
    let slideInterval: any;
    let floatingTl: any;

    if (slides.length > 0) {
        let currentSlide = 0;
        const totalSlides = slides.length;
        gsap.set(slides, { opacity: 0, zIndex: 1, scale: 1.1 });
        gsap.set(slides[0], { opacity: 1, zIndex: 10, scale: 1 });

        const startFloating = (el: Element) => {
            if (floatingTl) floatingTl.kill();
            floatingTl = gsap.timeline({ repeat: -1, yoyo: true });
            floatingTl.to(el, { scale: 1.05, duration: 8, ease: "sine.inOut" })
                      .to(el, { x: 10, y: -10, duration: 6, ease: "sine.inOut" }, 0);
        };
        startFloating(slides[0]);

        const nextSlide = () => {
            const next = (currentSlide + 1) % totalSlides;
            const prev = currentSlide;
            const tl = gsap.timeline({
                onComplete: () => {
                    gsap.set(slides[prev], { zIndex: 1 });
                    startFloating(slides[next]);
                }
            });
            tl.set(slides[next], { opacity: 1, zIndex: 20, scale: 1.2, clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)' })
              .to(slides[next], { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 1.8, ease: "expo.inOut" })
              .to(slides[next], { scale: 1, duration: 2, ease: "power2.out" }, "-=1.4")
              .to(slides[prev], { opacity: 0, duration: 1, ease: "power2.inOut" }, "-=1.8");
            currentSlide = next;
        };
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
        // Clear event card listeners
        cards.forEach((card: any) => {
            card.removeEventListener('mousemove', () => {});
            card.removeEventListener('mouseleave', () => {});
        });
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
              <h1 className="hero-title"><span>WE</span> <span className="orange">ENGINEER</span></h1>
              <h1 className="hero-title indent"><span className="white">ATHLETIC</span></h1>
              <h1 className="hero-title"><span className="green">EXCELLENCE</span></h1>
              <div className="hero-footer">
                  <p>05+ YEARS OF ELITE MARATHON MANAGEMENT</p>
                  <div className="scroll-indicator"><div className="line"></div><span>SCROLL</span></div>
              </div>
          </div>
          <div className="hero-visual">
              {/* SLIDE 1 */}
              <div className="hero-slide active">
                  <div className="hero-slide-blur-bg" style={{ backgroundImage: "url('/images/hero_marathon_8k.png')" }}></div>
                  <img src="/images/hero_marathon_8k.png" alt="8K Marathon Runner" className="hero-slide-img" />
              </div>
              
              {/* SLIDE 2 */}
              <div className="hero-slide">
                  <div className="hero-slide-blur-bg" style={{ backgroundImage: "url('/images/hero_football.png')" }}></div>
                  <img src="/images/hero_football.png" alt="Football Player" className="hero-slide-img" />
              </div>
              
              {/* SLIDE 3 */}
              <div className="hero-slide">
                  <div className="hero-slide-blur-bg" style={{ backgroundImage: "url('/images/hero_cricket.png')" }}></div>
                  <img src="/images/hero_cricket.png" alt="Cricket Player" className="hero-slide-img" />
              </div>
              
              {/* SLIDE 4 */}
              <div className="hero-slide">
                  <div className="hero-slide-blur-bg" style={{ backgroundImage: "url('/images/hero_visual.png')" }}></div>
                  <img src="/images/hero_visual.png" alt="Athletes" className="hero-slide-img" />
              </div>
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
                            <a href="#contact" className="btn-services-unique hover-target" style={{ marginTop: '1.5rem' }}>
                                <div className="wireframe"></div>
                                <div className="wire-corner tc-tl"></div>
                                <div className="wire-corner tc-br"></div>
                                <div className="scanner-line"></div>
                                <span>{s.btn}</span>
                            </a>
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
              {(events || []).map((item, idx) => (
                  <div key={idx} className="event-stack-item hover-target">
                      <div className="esi-img" style={{ height: '500px', border: 'none', boxShadow: 'none', background: 'transparent' }}>
                          <img src={item.bgImg || `/images/${item.slug.replace(/-/g, '_')}.png`} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '15px' }} />
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
                              
                              <div className="esi-actions" style={{ width: '100%', marginTop: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
                                  <Link to={`/register/${item.slug}`} className="btn-gagner-unique hover-target">
                                      <div className="fragment f1"></div>
                                      <div className="fragment f2"></div>
                                      <div className="fragment f3"></div>
                                      <div className="fragment f4"></div>
                                      <div className="tech-bar t-left"></div>
                                      <div className="tech-bar t-right"></div>
                                      <span>BOOK NOW</span>
                                  </Link>
                                  <div className="event-card-glow"></div>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      </section>

      <section id="gallery" className="gallery-clean-section" style={{ padding: '8rem 4rem', background: '#0a0a0a', position: 'relative', overflow: 'visible' }}>
          <div className="gallery-bg-text" style={{ 
              position: 'absolute', 
              top: '5%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              fontSize: '15vw', 
              color: 'transparent', 
              WebkitTextStroke: '1.5px rgba(255,255,255,0.1)', 
              whiteSpace: 'nowrap', 
              fontWeight: 900, 
              pointerEvents: 'none',
              zIndex: 0
          }}>SHOWCASE</div>
                    <div className="section-heading-wrap" style={{ marginBottom: '4rem', zIndex: 10, position: 'relative', textAlign: 'center', width: '100%' }}>
              <h2 className="heading-unique">
                  <span className="filled">MOMENTS</span> <span className="outline">OFFICIAL</span>
              </h2>
          </div>

          <div className="gallery-container">
              {/* Desktop/Tablet Grid */}
              <div className="gallery-grid">
                  {((): { img: string; title: string; tag: string }[] => {
                    const cmsGallery = (content || []).filter((c: any) => c.type === 'gallery' && c.active);
                    if (cmsGallery.length > 0) {
                      return cmsGallery.map((c: any) => ({ img: c.imageUrl, title: c.title, tag: c.description || '' }));
                    }
                    return [];
                  })().map((item, idx) => (
                      <div key={idx} className="gallery-grid-item animate" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="gg-overlay">
                              <h3 className="gg-caption outline-font">{item.title}</h3>
                          </div>
                          <img src={item.img} alt={item.title} loading="lazy" style={{ maxWidth: '100%', height: 'auto' }} />
                      </div>
                  ))}
              </div>

              {/* Mobile Carousel (Swiper) */}
              <div className="gallery-carousel">
                  <Swiper
                      modules={[Autoplay]}
                      spaceBetween={16}
                      slidesPerView={1.15}
                      centeredSlides={true}
                      loop={true}
                      autoplay={{ delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true }}
                      speed={800}
                  >
                      {((): { img: string; title: string }[] => {
                        const cmsGallery = (content || []).filter((c: any) => c.type === 'gallery' && c.active);
                        if (cmsGallery.length > 0) {
                          return cmsGallery.map((c: any) => ({ img: c.imageUrl, title: c.title }));
                        }
                        return [];
                      })().map((item, idx) => (
                          <SwiperSlide key={idx}>
                              <div className="gallery-grid-item" style={{ height: '400px' }}>
                                  <div className="gg-overlay" style={{ opacity: 1 }}>
                                      <h3 className="gg-caption outline-font">{item.title}</h3>
                                  </div>
                                  <img src={item.img} alt={item.title} loading="lazy" style={{ maxWidth: '100%', height: 'auto' }} />
                              </div>
                          </SwiperSlide>
                      ))}
                  </Swiper>
              </div>
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

      <section id="sponsors" className="sponsors-section">
          <div className="section-heading-wrap" style={{ marginBottom: '3rem' }}>
              <h2 className="heading-unique" style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)' }}>
                  <span className="outline">OUR</span>
                  <span className="filled">PARTNERS</span>
              </h2>
          </div>
          <div className="sponsors-marquee-container">
              {(() => {
                const cmsSponsors = (content || []).filter((c: any) => c.type === 'sponsor' && c.active);
                const sponsorList = cmsSponsors.length > 0
                  ? cmsSponsors.map((s: any) => ({ name: s.title, img: s.imageUrl, link: s.link }))
                  : [];
                // Duplicate for seamless marquee
                const doubled = [...sponsorList, ...sponsorList];
                return (
                  <>
                    <div className="sponsors-marquee-track">
                      {doubled.map((s: any, idx: number) => (
                        <div key={idx} className="partner-logo-box hover-target">
                          {s.img ? <img src={s.img} alt={s.name} style={{ height: 40, maxWidth: 120, objectFit: 'contain' }} /> : <span>{s.name}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="sponsors-marquee-track" aria-hidden="true">
                      {doubled.map((s: any, idx: number) => (
                        <div key={`dup-${idx}`} className="partner-logo-box hover-target">
                          {s.img ? <img src={s.img} alt={s.name} style={{ height: 40, maxWidth: 120, objectFit: 'contain' }} /> : <span>{s.name}</span>}
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
          </div>
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
