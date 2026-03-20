import React, { useLayoutEffect, useRef } from 'react';

declare const gsap: any;

export default function GlobalPreloader() {
    const preloaderRef = useRef<HTMLDivElement>(null);
    const archRef = useRef<SVGPathElement>(null);

    useLayoutEffect(() => {
        if (!preloaderRef.current || !archRef.current) return;

        const tl = gsap.timeline();

        // 1. FAST REV-UP ACCELERATION
        tl.to(archRef.current, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: "expo.in"
        })
        // 2. SMOOTH EXIT (ZOOM + FADE)
        .to(preloaderRef.current, {
            scale: 1.2,
            opacity: 0,
            duration: 0.6,
            ease: "power2.inOut"
        })
        .set(preloaderRef.current, { display: 'none' });

        return () => { tl.kill(); };
    }, []);

    return (
        <div className="preloader" ref={preloaderRef}>
            <div className="arch-preloader-container">
                {/* SVG SPEEDOMETER ARCH ONLY */}
                <svg className="speedometer-arch-svg" viewBox="0 0 200 200">
                    <path 
                        className="arch-track"
                        d="M 43.5,156.5 A 80,80 0 1,1 156.5,156.5"
                        fill="none" 
                        stroke="rgba(255, 255, 255, 0.05)" 
                        strokeWidth="4" 
                        strokeLinecap="round"
                    />
                    <path 
                        ref={archRef}
                        className="arch-progress"
                        d="M 43.5,156.5 A 80,80 0 1,1 156.5,156.5"
                        fill="none" 
                        stroke="url(#arch-gradient)" 
                        strokeWidth="6" 
                        strokeLinecap="round"
                        strokeDasharray="377"
                        strokeDashoffset="377"
                    />
                    <defs>
                        <linearGradient id="arch-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF5F00" />
                            <stop offset="100%" stopColor="#00C853" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* CENTERED LOGO (SYMBOL ONLY) */}
                <div className="logo-symbol-mask">
                    <img 
                        src="/src/assets/images/logo.png" 
                        alt="Gagner Symbol" 
                        className="logo-img-crop" 
                    />
                </div>
            </div>

            <style>{`
                .preloader {
                    position: fixed;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: #030712;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .arch-preloader-container {
                    position: relative;
                    width: min(320px, 80vw);
                    height: min(320px, 80vw);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .speedometer-arch-svg {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0; left: 0;
                }
                .arch-progress {
                    filter: drop-shadow(0 0 15px rgba(0, 200, 83, 0.3));
                }
                .logo-symbol-mask {
                    width: 45%;
                    height: 45%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .logo-img-crop {
                    height: 110%;
                    width: auto;
                    object-fit: contain;
                    object-position: top; /* Hide 'GAGNER' text usually at bottom */
                    transform: translateY(-5%);
                }
            `}</style>
        </div>
    );
}
