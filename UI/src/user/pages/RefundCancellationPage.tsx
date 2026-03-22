import React, { useLayoutEffect, useRef } from 'react';

declare const gsap: any;
declare const ScrollTrigger: any;

export default function RefundCancellationPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        gsap.registerPlugin(ScrollTrigger);
        window.scrollTo(0, 0);

        const ctx = gsap.context(() => {
            // 1. Hero Reveal with Glitch Effect
            const tl = gsap.timeline();
            tl.fromTo('.refund-hero-title', 
                { y: 150, opacity: 0, skewY: 10 },
                { y: 0, opacity: 1, skewY: 0, duration: 1.5, ease: "expo.out" }
            )
            .fromTo('.bg-blob', 
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 0.6, duration: 2, stagger: 0.5, ease: "power2.out" },
                0
            );

            // Subtle Glitch Loop for Hero Title
            gsap.to('.hero-glitch-layer', {
                x: "random(-5, 5)",
                y: "random(-2, 2)",
                opacity: "random(0, 0.3)",
                duration: 0.1,
                repeat: -1,
                repeatRefresh: true,
                ease: "none"
            });

            // 2. Continuous floating for blobs
            gsap.to('.bg-blob', {
                x: "random(-100, 100)",
                y: "random(-100, 100)",
                duration: "random(10, 20)",
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            // 3. Scroll Driven Cards
            const cards = gsap.utils.toArray('.refund-stack-card');
            cards.forEach((card: any, i: number) => {
                const title = card.querySelector('.premium-title');
                
                gsap.fromTo(card, 
                    { 
                        x: i % 2 === 0 ? -100 : 100, 
                        opacity: 0,
                        rotateY: i % 2 === 0 ? 30 : -30,
                        scale: 0.8
                    },
                    {
                        x: 0,
                        opacity: 1,
                        rotateY: 0,
                        scale: 1,
                        duration: 1.2,
                        ease: "power4.out",
                        scrollTrigger: {
                            trigger: card,
                            start: "top 85%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );

                // Reveal title with a "typing/scan" shimmer
                gsap.fromTo(title, {
                    backgroundPosition: '200% 0'
                }, {
                    backgroundPosition: '-200% 0',
                    duration: 3,
                    repeat: -1,
                    ease: "none",
                    scrollTrigger: {
                        trigger: title,
                        start: "top 90%"
                    }
                });

                // 3D Tilt on Hover
                card.addEventListener('mousemove', (e: MouseEvent) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = (y - centerY) / 15;
                    const rotateY = (centerX - x) / 15;

                    gsap.to(card, {
                        rotateX: rotateX,
                        rotateY: rotateY,
                        scale: 1.02,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                });

                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        rotateX: 0,
                        rotateY: 0,
                        scale: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                });
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    const policies = [
        {
            id: '01',
            title: 'Registration Fees',
            points: [
                'Registration fees are non-refundable once paid.',
                'No refund will be provided for no-shows or failure to participate.'
            ]
        },
        {
            id: '02',
            title: 'Event Postponement',
            points: [
                'If the event is postponed due to weather, safety, or government restrictions, registrations will be automatically transferred to the new date.'
            ]
        },
        {
            id: '03',
            title: 'Event Cancellation',
            points: [
                'If the event is canceled permanently, participants may receive a partial refund or a credit for a future event, as decided by the organizers.'
            ]
        }
    ];

    return (
        <div ref={containerRef} className="refund-page-3d" style={{ 
            background: '#02040a', 
            minHeight: '100vh', 
            padding: '120px 0 100px',
            color: '#fff',
            fontFamily: "'Outfit', sans-serif",
            overflow: 'hidden',
            perspective: '1200px'
        }}>
            {/* AMBIENT BACKGROUND BLOBS */}
            <div className="bg-blob" style={{ position: 'absolute', top: '5%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255, 95, 0, 0.1) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }}></div>
            <div className="bg-blob" style={{ position: 'absolute', bottom: '5%', left: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0, 200, 83, 0.08) 0%, transparent 70%)', filter: 'blur(120px)', pointerEvents: 'none' }}></div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
                
                {/* HERO SECTION */}
                <header style={{ textAlign: 'center', marginBottom: '10rem', position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <h1 className="refund-hero-title" style={{ 
                            fontSize: 'clamp(4rem, 15vw, 10rem)', 
                            fontWeight: 900, 
                            lineHeight: 0.8, 
                            letterSpacing: '-5px',
                            textTransform: 'uppercase',
                            margin: 0,
                            position: 'relative',
                            zIndex: 2
                        }}>
                            REFUND<br/>
                            <span style={{ color: 'transparent', WebkitTextStroke: '2px rgba(255,255,255,0.15)' }}>CLAUSE</span>
                        </h1>
                        <h1 className="hero-glitch-layer" style={{ 
                             fontSize: 'clamp(4rem, 15vw, 10rem)', 
                             fontWeight: 900, 
                             lineHeight: 0.8, 
                             letterSpacing: '-5px',
                             textTransform: 'uppercase',
                             margin: 0,
                             position: 'absolute',
                             top: 0, left: 0,
                             color: '#FF5F00',
                             opacity: 0,
                             zIndex: 1,
                             pointerEvents: 'none'
                        }}>
                             REFUND<br/>CLAUSE
                        </h1>
                    </div>
                </header>

                {/* CONTENT STACK */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8rem' }}>
                    {policies.map((p, i) => (
                        <div key={p.id} className="refund-stack-card" style={{ 
                            width: '100%',
                            maxWidth: '900px',
                            marginLeft: i % 2 === 0 ? '0' : 'auto',
                            background: 'rgba(255, 255, 255, 0.02)',
                            backdropFilter: 'blur(30px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '4rem 5rem',
                            borderRadius: '50px',
                            position: 'relative',
                            transition: 'border-color 0.4s',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
                            cursor: 'pointer'
                        }}>
                            {/* Decorative ID Pillar */}
                            <div style={{ 
                                position: 'absolute', 
                                left: i % 2 === 0 ? '-20px' : 'auto', 
                                right: i % 2 === 0 ? 'auto' : '-20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                height: '60%',
                                width: '4px',
                                background: i % 2 === 0 ? '#FF5F00' : '#00C853',
                                borderRadius: '10px',
                                boxShadow: `0 0 20px ${i % 2 === 0 ? '#FF5F00' : '#00C853'}66`
                            }}></div>

                            <div style={{ flex: 1 }}>
                                <h3 className="premium-title" style={{ 
                                    fontSize: '3rem', 
                                    fontWeight: 900, 
                                    marginBottom: '2rem', 
                                    letterSpacing: '-2px',
                                    background: 'linear-gradient(90deg, #fff 0%, #fff 45%, #FF5F00 50%, #fff 55%, #fff 100%)',
                                    backgroundSize: '200% 100%',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    display: 'inline-block'
                                }}>
                                    {p.title}
                                </h3>
                                
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {p.points.map((point, idx) => (
                                        <li key={idx} style={{ 
                                            fontSize: '1.25rem', 
                                            lineHeight: 1.8, 
                                            color: '#cbd5e1', 
                                            marginBottom: '1.8rem',
                                            paddingLeft: '2rem',
                                            position: 'relative',
                                            fontWeight: 300
                                        }}>
                                            <span style={{ 
                                                position: 'absolute', 
                                                left: 0, top: '15px', 
                                                width: '10px', height: '10px', 
                                                borderRadius: '50%', 
                                                background: '#00C853',
                                                boxShadow: '0 0 10px #00C853'
                                            }}></span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Large Background ID */}
                            <div style={{ 
                                position: 'absolute', 
                                bottom: '2rem', right: '4rem', 
                                fontSize: '10rem', 
                                fontWeight: 900, 
                                opacity: 0.02,
                                pointerEvents: 'none',
                                filter: 'blur(2px)'
                             }}>{p.id}</div>
                        </div>
                    ))}
                </div>

                {/* FINAL SECTION */}
                <div style={{ marginTop: '15rem', textAlign: 'center', opacity: 0.5 }}>
                     <p style={{ letterSpacing: '10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>End of Document</p>
                </div>
            </div>

            <style>{`
                .refund-stack-card:hover {
                    border-color: rgba(255, 95, 0, 0.4) !important;
                }
                @media (max-width: 768px) {
                    .refund-stack-card {
                        padding: 3rem 2rem !important;
                        margin-left: 0 !important;
                        borderRadius: 30px !important;
                    }
                    .premium-title {
                        font-size: 2rem !important;
                    }
                    .refund-hero-title {
                        font-size: 3.8rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
