import React, { useEffect } from 'react';
// @ts-ignore
import logo from '../../assets/images/logo.png';

declare const gsap: any;

export default function GlobalPreloader() {
    useEffect(() => {
        const tl = gsap.timeline();

        // 1. Path Sweep (Orange to Green)
        tl.to('#sweep-path', {
            strokeDashoffset: 0,
            duration: 1.5,
            ease: "power2.inOut"
        })
        // 2. Logo Reveal (Original Colorful Logo)
        .to('.preloader-logo', {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            ease: "back.out(2)"
        }, "-=0.5")
        // 3. Text Reveal
        .to('.loader-text span', {
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.3");

    }, []);

    return (
        <div className="preloader">
            <div className="preloader-content-new">
                <div className="logo-sweep-container">
                    <svg viewBox="0 0 100 100" className="logo-path-svg">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/>
                        <path 
                          id="sweep-path" 
                          d="M50 5 A45 45 0 0 1 95 50" 
                          fill="none" 
                          stroke="url(#logo-grad)" 
                          strokeWidth="6" 
                          strokeLinecap="round" 
                          style={{ strokeDasharray: 283, strokeDashoffset: 283 }}
                        />
                        <defs>
                            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style={{ stopColor: "#FF5F00" }} />
                                <stop offset="100%" style={{ stopColor: "#00C853" }} />
                            </linearGradient>
                        </defs>
                    </svg>
                    <img 
                      src={logo} 
                      className="preloader-logo" 
                      alt="Gagner Sports" 
                      style={{ 
                        position: 'absolute', 
                        width: '60%', 
                        height: '60%', 
                        objectFit: 'contain', 
                        opacity: 0, 
                        transform: 'scale(0.5)' 
                      }} 
                    />
                </div>
                <div className="loader-text">
                    <span className="l-g">GAGNER</span>
                    <span className="l-s">SPORTS</span>
                </div>
            </div>
        </div>
    );
}
