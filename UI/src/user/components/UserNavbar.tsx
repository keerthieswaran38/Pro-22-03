import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
// @ts-ignore
import logo from '../../assets/images/logo.png';

declare const gsap: any;
declare const ScrollTrigger: any;

interface UserNavbarProps {
  onOpenLeaderboard: () => void;
  content?: any[];
}

const UserNavbar: React.FC<UserNavbarProps> = ({ onOpenLeaderboard, content = [] }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className={`nav-minimal ${isScrolled ? 'nav-scrolled' : ''}`} id="main-nav">
        <Link to="/" className="nav-logo hover-target">
          <img src={content.find((c: any) => c.type === 'logo')?.imageUrl || logo} alt="Gagner Sports" style={{ height: '40px', objectFit: 'contain' }} />
        </Link>
        
        <div className="nav-links">
          <a href="/#about" className="hover-target">ABOUT</a>
          <a href="/#events" className="hover-target">EVENTS</a>
          <a href="/#blogs" className="hover-target">BLOGS</a>
          <a 
            href="#leaderboard" 
            className="hover-target" 
            id="nav-leaderboard"
            onClick={(e) => {
              e.preventDefault();
              onOpenLeaderboard();
            }}
          >
            LEADERBOARD
          </a>
          <a href="/#services" className="hover-target">SERVICES</a>
          <a href="/#contact" className="hover-target">CONTACT</a>
        </div>

        <a href="mailto:balaji@gagnersports.com" className="btn-neon hover-target nav-desktop-cta">GET IN TOUCH</a>

        {/* HAMBURGER BUTTON (Mobile Only) */}
        <button 
          className={`hamburger-btn ${isMobileMenuOpen ? 'active' : ''}`} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OUT MENU */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={closeMobileMenu}></div>
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <img src={content.find((c: any) => c.type === 'logo')?.imageUrl || logo} alt="Gagner Sports" style={{ height: '35px', objectFit: 'contain' }} />
          <button className="mobile-close-btn" onClick={closeMobileMenu} aria-label="Close menu">✕</button>
        </div>
        <div className="mobile-menu-links">
          <a href="/#about" className="mobile-link" onClick={closeMobileMenu}>ABOUT</a>
          <a href="/#events" className="mobile-link" onClick={closeMobileMenu}>EVENTS</a>
          <a href="/#blogs" className="mobile-link" onClick={closeMobileMenu}>BLOGS</a>
          <a 
            href="#leaderboard" 
            className="mobile-link" 
            onClick={(e) => {
              e.preventDefault();
              closeMobileMenu();
              onOpenLeaderboard();
            }}
          >
            LEADERBOARD
          </a>
          <a href="/#services" className="mobile-link" onClick={closeMobileMenu}>SERVICES</a>
          <a href="/#contact" className="mobile-link" onClick={closeMobileMenu}>CONTACT</a>
        </div>
        <div className="mobile-menu-footer">
          <a href="mailto:balaji@gagnersports.com" className="mobile-cta-btn" onClick={closeMobileMenu}>GET IN TOUCH</a>
        </div>
      </div>
    </>
  );
}

export default UserNavbar;
