import React, { useEffect } from 'react';
// @ts-ignore
import logo from '../../assets/images/logo.png';

declare const gsap: any;

export default function GlobalPreloader({ content = [] }: { content?: any[] }) {
    const logoImg = content.find((c: any) => c.type === 'logo')?.imageUrl || logo;
    const mainTitle = "SPORTS & EVENT MANAGEMENT";
    const subtitle = "ENGINEERING ATHLETIC EXCELLENCE"; 

    useEffect(() => {
        const tl = gsap.timeline();

        // 1. Initial State
        gsap.set('.laser-scan-line', { top: '-10%', opacity: 0 });
        gsap.set('.logo-fragment', { 
            x: () => (Math.random() - 0.5) * 800, 
            y: () => (Math.random() - 0.5) * 800, 
            rotate: () => Math.random() * 360,
            opacity: 0,
            scale: 0.5 
        });
        gsap.set('.main-logo-solid', { opacity: 0, scale: 0.6 });
        gsap.set('.preloader-main-title span', { y: 20, opacity: 0, filter: 'blur(5px)' });
        gsap.set('.preloader-subtext span', { y: 30, opacity: 0, filter: 'blur(10px)' });

        // 2. Start
        tl.to('.preloader', {
            background: 'radial-gradient(circle at center, #0a1220 0%, #030712 100%)',
            duration: 0.8
        });

        // 3. Laser Sweep
        tl.to('.laser-scan-line', {
            opacity: 1,
            top: '110%',
            duration: 1.5,
            ease: "power2.inOut"
        });

        // 4. Fragment Assembly
        tl.to('.logo-fragment', {
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.05,
            duration: 1.2,
            ease: "expo.out"
        }, "-=1.8");

        // 5. Solid Real Logo Snap
        tl.to('.main-logo-solid', {
            opacity: 1,
            scale: 1.1, // Slight pulse
            duration: 0.6,
            ease: "back.out(1.7)",
            onStart: () => {
                gsap.to('.logo-fragment', { opacity: 0, duration: 0.3 });
            }
        }, "-=0.4");
        tl.to('.main-logo-solid', { scale: 1, duration: 0.4, ease: "power2.out" });

        // 6. Main Title Reveal
        tl.to('.preloader-main-title span', {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            stagger: 0.1,
            duration: 1,
            ease: "power4.out"
        }, "-=0.3");

        // 7. Subtext Reveal
        tl.to('.preloader-subtext span', {
            y: 0,
            opacity: 0.7, // Slightly dimmed to prioritize main title
            filter: 'blur(0px)',
            stagger: 0.08,
            duration: 1,
            ease: "power3.out"
        }, "-=0.5");

    }, []);

    return (
        <div className="preloader">
            <div className="preloader-content-new" style={{ perspective: '1500px' }}>
                
                <div className="logo-assembly-container" style={{ 
                    position: 'relative', 
                    width: '350px', 
                    height: '350px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'scale(var(--preloader-scale, 1))',
                    transformOrigin: 'center center',
                    marginBottom: '3rem'
                }}>
                    
                    {/* Glowing Laser */}
                    <div className="laser-scan-line" style={{ 
                        position: 'absolute',
                        left: '-10%',
                        width: '120%',
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent, #00C853, #FF5F00, #00C853, transparent)',
                        boxShadow: '0 0 30px #00C853, 0 0 50px #FF5F00',
                        zIndex: 100,
                        pointerEvents: 'none'
                    }}></div>

                    {/* Logo Fragments (Simplified for better alignment) */}
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="logo-fragment" style={{ 
                            position: 'absolute',
                            width: '116px',
                            height: '116px',
                            border: '0.5px solid rgba(255,255,255,0.1)',
                            backgroundImage: `url(${logoImg})`,
                            backgroundSize: '350px 350px',
                            backgroundPosition: `${-(i % 3) * 116}px ${-Math.floor(i / 3) * 116}px`,
                            zIndex: 10
                        }}></div>
                    ))}

                    <img 
                      src={logoImg} 
                      className="main-logo-solid" 
                      alt="Gagner Sports" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        position: 'absolute',
                        top: 0, left: 0,
                        zIndex: 20 
                      }} 
                    />
                </div>

                <style>{`
                  @media (max-width: 480px) {
                    .preloader-content-new { --preloader-scale: 0.65; }
                    .preloader-main-title span { font-size: 1rem !important; }
                  }
                  @media (max-width: 768px) and (min-width: 481px) {
                    .preloader-content-new { --preloader-scale: 0.85; }
                    .preloader-main-title span { font-size: 1.2rem !important; }
                  }
                  @media (max-width: 360px) {
                    .preloader-content-new { --preloader-scale: 0.55; }
                  }
                `}</style>

                <div className="preloader-main-title" style={{
                    marginBottom: '1rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '0.8rem'
                }}>
                    {mainTitle.split(" ").map((word, i) => (
                        <span key={i} style={{ 
                            display: 'inline-block',
                            fontSize: '1.4rem',
                            fontWeight: 900,
                            letterSpacing: '5px',
                            color: word === 'SPORTS' ? '#FF5F00' : (word === 'EVENT' ? '#00C853' : '#fff'),
                            textTransform: 'uppercase'
                        }}>{word}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}







