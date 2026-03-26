import React, { useEffect } from 'react';
// @ts-ignore
import logo from '../../assets/images/logo.png';

declare const gsap: any;

export default function GlobalPreloader({ content = [] }: { content?: any[] }) {
    useEffect(() => {
        const tl = gsap.timeline();

        // 1. Three-Quarters Arch Animation - Strictly 1.5s, Linear Fill
        tl.to('#sweep-path', {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "none"
        });

        // 2. Enhanced Logo Monogram (Increased Size + Subtle Entrance)
        tl.to('.preloader-logo', {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, 0.2);

    }, []);

    return (
        <div className="preloader">
            <div className="preloader-content-new">
                <div className="logo-sweep-container">
                    <svg viewBox="0 0 100 100" className="logo-path-svg">
                        {/* Static Dim Background Arch (Static Path Matching the Filling One) */}
                        <path 
                          d="M27.5 89 A 45 45 0 1 1 89 72.5" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.05)" 
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        
                        {/* Dynamic Vibrant Three-Quarters Arch */}
                        <path 
                          id="sweep-path" 
                          d="M27.5 89 A 45 45 0 1 1 89 72.5" 
                          fill="none" 
                          stroke="url(#logo-grad-premium)" 
                          strokeWidth="6" 
                          strokeLinecap="round"
                          pathLength="1"
                          style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                        />
                        
                        <defs>
                            <linearGradient id="logo-grad-premium" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "#FF5F00" }} />
                                <stop offset="50%" style={{ stopColor: "#FFEA00" }} />
                                <stop offset="100%" style={{ stopColor: "#00C853" }} />
                            </linearGradient>
                        </defs>
                    </svg>

                    <img 
                      src={content.find((c: any) => c.type === 'logo')?.imageUrl || logo} 
                      className="preloader-logo" 
                      alt="Gagner Sports" 
                      style={{ 
                        position: 'absolute', 
                        width: '80%',  /* Increased by 25% from 65% */
                        height: '80%', 
                        objectFit: 'contain', 
                        opacity: 0, 
                        transform: 'scale(0.8)',
                        left: '50%',
                        top: '50%',
                        translate: '-50% -50%'
                      }} 
                    />
                </div>
            </div>
        </div>
    );
}

