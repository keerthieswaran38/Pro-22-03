import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function UserNavbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`nav-minimal ${scrolled ? 'nav-scrolled' : ''}`}>
            <Link to="/" className="nav-logo-container hover-target">
                <img 
                    src="/src/assets/images/logo.png" 
                    alt="Gagner Sports" 
                    className="nav-logo-dynamic"
                />
            </Link>
            
            <div className="nav-links">
                <a href="#about" className="hover-target">ABOUT</a>
                <a href="#services" className="hover-target">SERVICES</a>
                <a href="#events" className="hover-target">EVENTS</a>
                <a href="#contact" className="hover-target">CONTACT</a>
            </div>

            <a href="#register" className="btn-neon hover-target">JOIN THE ELITE</a>
        </nav>
    );
}
