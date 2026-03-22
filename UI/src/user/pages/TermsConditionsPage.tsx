import React, { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

declare const gsap: any;
declare const ScrollTrigger: any;

export default function TermsConditionsPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        window.scrollTo(0, 0);

        const ctx = gsap.context(() => {
            // 1. HERO - PINNED ZOOM EFFECT (scroll-driven only, NO load animation on title)
            const heroTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".tc-hero",
                    start: "top top",
                    end: "+=100%",
                    pin: true,
                    scrub: 0.5,
                }
            });

            heroTl.to(".tc-title-main", {
                scale: 15,
                opacity: 0,
                duration: 1,
                ease: "power2.in"
            }, 0)
            .to(".tc-scroll-cta", {
                opacity: 0,
                y: -20,
                duration: 0.3
            }, 0);

            // 2. HORIZONTAL SCROLL
            const hzContainer = document.querySelector('.tc-hz-container') as HTMLElement;
            const hzWrapper = document.querySelector('.tc-hz-wrapper') as HTMLElement;

            if (hzContainer && hzWrapper && window.innerWidth > 1024) {
                const getScrollAmount = () => -(hzContainer.scrollWidth - window.innerWidth);

                const tween = gsap.to(hzContainer, {
                    x: getScrollAmount,
                    ease: 'none'
                });

                ScrollTrigger.create({
                    trigger: hzWrapper,
                    start: 'top top',
                    end: () => `+=${Math.abs(getScrollAmount())}`,
                    pin: true,
                    animation: tween,
                    scrub: 1,
                    invalidateOnRefresh: true,
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const sections = [
        {
            num: '01',
            title: 'Eligibility',
            desc: 'Participants must register through the official registration platform. Age categories apply as per event rules.',
            detail: 'Proof of age may be required. Participants must be medically fit to take part in the event.'
        },
        {
            num: '02',
            title: 'Registration',
            desc: 'Registration is confirmed only after full payment. Registrations are non-transferable unless specifically permitted.',
            detail: 'The organizers reserve the right to refuse or cancel registrations at their discretion.'
        },
        {
            num: '03',
            title: 'Event Rules',
            desc: 'Participants must follow instructions from event officials, volunteers, and security staff at all times.',
            detail: 'Bibs/tags must be worn visibly during the event. Any misconduct, cheating, or unsafe behavior may lead to disqualification.'
        },
        {
            num: '04',
            title: 'Health & Safety',
            desc: 'Participants are responsible for their own health and fitness throughout the duration of the event.',
            detail: 'The organizers are not liable for injuries, illnesses, or accidents during or after the event.'
        },
        {
            num: '05',
            title: 'Rights & Media',
            desc: 'Organizers reserve the right to change the event date, route, or schedule due to unavoidable circumstances.',
            detail: 'Photos and videos taken during the event may be used for promotional purposes by the organizers.'
        }
    ];

    return (
        <div ref={containerRef} style={{ background: '#050505', color: '#fff' }}>
            
            {/* HERO - CLEAN BLACK + ZOOM EFFECT */}
            <section className="tc-hero" style={{ 
                height: '100vh', 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                overflow: 'hidden', 
                background: '#050505' 
            }}>
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 2rem' }}>
                    <h1 className="tc-title-main" style={{ 
                        fontSize: 'clamp(4rem, 12vw, 12rem)', 
                        fontWeight: 900, 
                        textTransform: 'uppercase', 
                        lineHeight: '0.85', 
                        margin: 0, 
                        letterSpacing: '-4px', 
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity',
                        color: '#fff'
                    }}>
                        Terms &<br/>
                        <span style={{ 
                            color: 'transparent', 
                            WebkitTextStroke: '2px rgba(255,255,255,0.6)', 
                            letterSpacing: '2px' 
                        }}>CONDITIONS</span>
                    </h1>

                    <div className="tc-scroll-cta" style={{ 
                        marginTop: '5rem', 
                        fontSize: '0.8rem', 
                        opacity: 0.5, 
                        letterSpacing: '4px', 
                        fontWeight: 600 
                    }}>
                        SCROLL TO EXPLORE <br/> 
                        <span style={{ fontSize: '1.5rem', display: 'inline-block', marginTop: '1rem' }}>↓</span>
                    </div>
                </div>
            </section>

            {/* HORIZONTAL SCROLL CONTENT */}
            <section className="tc-hz-wrapper" style={{ position: 'relative', background: '#050505', color: '#fff', minHeight: '100vh' }}>
                <div className="tc-hz-container" style={{ display: 'flex', width: 'fit-content', height: '100vh', alignItems: 'center' }}>
                    
                    {/* Intro title */}
                    <div style={{ width: '30vw', minWidth: '300px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5vw', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#ff5f00', lineHeight: '1.2', textTransform: 'uppercase', letterSpacing: '-1px' }}>
                            Legal<br/>Directives
                            <span style={{ display: 'block', height: '2px', width: '50px', background: '#fff', marginTop: '2rem' }}></span>
                        </h2>
                    </div>

                    {/* Content Slides */}
                    {sections.map((s, i) => (
                        <div key={i} className="tc-slide" style={{ 
                            width: '50vw', 
                            minWidth: '320px',
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '0 6vw',
                            position: 'relative',
                            borderRight: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div className="tc-slide-inner" style={{ 
                                width: '100%', 
                                maxWidth: '600px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '3.5rem',
                                borderRadius: '30px',
                                position: 'relative'
                            }}>
                                {/* Number badge */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '-1.5rem', 
                                    left: '3.5rem', 
                                    width: '50px', 
                                    height: '50px', 
                                    background: '#050505', 
                                    border: '2px solid #ff5f00', 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '1rem', 
                                    fontWeight: 800, 
                                    color: '#ff5f00',
                                    zIndex: 2,
                                    boxShadow: '0 10px 30px rgba(255,95,0,0.2)'
                                }}>{s.num}</div>

                                <h3 style={{ 
                                    fontSize: '1.8rem', 
                                    fontWeight: 800, 
                                    marginBottom: '1.5rem', 
                                    color: '#fff', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '1px',
                                    marginTop: '1.5rem'
                                }}>{s.title}</h3>
                                
                                <p style={{ 
                                    fontSize: '1rem', 
                                    lineHeight: '1.8', 
                                    color: '#ccc', 
                                    marginBottom: '1.5rem', 
                                    fontWeight: 400
                                }}>{s.desc}</p>
                                
                                <p style={{ 
                                    fontSize: '0.9rem', 
                                    lineHeight: '1.8', 
                                    color: '#777', 
                                    fontWeight: 300,
                                    paddingLeft: '1.5rem',
                                    borderLeft: '2px solid rgba(255,95,0,0.5)'
                                }}>{s.detail}</p>
                            </div>
                        </div>
                    ))}

                    {/* Outro */}
                    <div style={{ width: '40vw', minWidth: '350px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5vw', textAlign: 'center' }}>
                         <p style={{ color: '#222', letterSpacing: '4px', fontSize: '0.8rem', fontWeight: 900 }}>LEGAL FRAMEWORK / MARCH 2026</p>
                         <p style={{ fontSize: '1.4rem', marginTop: '2.5rem', fontWeight: 300, color: '#aaa', lineHeight: '1.6' }}>Formal inquiries: <br/><span style={{ color: '#ff5f00', fontWeight: 700 }}>legal@gagnersports.com</span></p>
                    </div>

                </div>
            </section>

            <style>{`
                @media (max-width: 1024px) {
                    .tc-hz-container {
                        flex-direction: column !important;
                        width: 100% !important;
                        height: auto !important;
                    }
                    .tc-slide {
                        width: 100% !important;
                        height: auto !important;
                        padding: 5rem 2rem !important;
                        border-right: none !important;
                        border-bottom: 1px solid rgba(255,255,255,0.05) !important;
                    }
                    .tc-hz-wrapper {
                        overflow: visible !important;
                    }
                }
            `}</style>
        </div>
    );
}
