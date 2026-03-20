import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEvents, useCoupons, useParticipants, useLeaderboard } from '../shared/hooks/useSync';
import { getPalette } from '../shared/theme';

declare const gsap: any;

// --- COMPONENTS ---
import UserNavbar from './components/UserNavbar';
import UserFooter from './components/UserFooter';

// --- PAGES ---
import LandingPage from './pages/LandingPage';
import EventDetailsPage from './pages/EventDetailsPage';
import RegistrationPage from './pages/RegistrationPage';
import GlobalPreloader from './components/GlobalPreloader';

/* ─── USER LAYOUT ─── */
function UserLayout({ children, loading }: { children: React.ReactNode, loading: boolean }) {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);

    // --- GLOBAL KINETIC CURSOR LOGIC ---
    const cursor = document.querySelector('.cursor') as HTMLElement;
    const follower = document.querySelector('.cursor-follower') as HTMLElement;

    const moveCursor = (e: MouseEvent) => {
        if (!cursor || !follower) return;
        const { clientX: x, clientY: y } = e;
        
        gsap.to(cursor, { x, y, duration: 0.1, ease: "power2.out" });
        gsap.to(follower, { x, y, duration: 0.5, ease: "power3.out" });
    };

    const handleInteract = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isHoverable = target.closest('a, button, .hover-target');
        
        if (e.type === 'mouseover' && isHoverable) {
            cursor?.classList.add('hovering');
            follower?.classList.add('hovering');
        } else if (e.type === 'mouseout' && isHoverable) {
            cursor?.classList.remove('hovering');
            follower?.classList.remove('hovering');
        }
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleInteract);
    window.addEventListener('mouseout', handleInteract);

    return () => {
        window.removeEventListener('mousemove', moveCursor);
        window.removeEventListener('mouseover', handleInteract);
        window.removeEventListener('mouseout', handleInteract);
    };
  }, [pathname]);

  return (
    <div className="user-world-container" id="smooth-wrapper">
      {loading && <GlobalPreloader />}
      <div className="cursor"></div>
      <div className="cursor-follower"></div>
      <UserNavbar />
      <main id="smooth-content">
        {children}
      </main>
      <UserFooter />
    </div>
  );
}

export default function UserApp() {
  const { data: events = {}, isLoading: evLoading } = useEvents();
  const { data: coupons = [], isLoading: cpLoading } = useCoupons();
  const { data: leaderboard = {}, isLoading: lbLoading } = useLeaderboard();

  const isInitialLoading = evLoading || cpLoading || lbLoading;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UserLayout loading={isInitialLoading}>
        <Routes>
          <Route path="/" element={<LandingPage events={Object.values(events)} leaderboard={leaderboard} />} />
          <Route path="/events/:slug" element={<EventDetailsPage events={events} coupons={coupons} />} />
          <Route path="/register/:slug" element={<RegistrationPage events={events} />} />
          {/* Catch-all to Landing */}
          <Route path="*" element={<LandingPage events={Object.values(events)} leaderboard={leaderboard} />} />
        </Routes>
      </UserLayout>
    </BrowserRouter>
  );
}
