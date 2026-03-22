import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEvents, useCoupons, useLeaderboard } from '../shared/hooks/useSync';

declare const gsap: any;
declare const ScrollTrigger: any;

// --- COMPONENTS ---
import UserNavbar from './components/UserNavbar';
import UserFooter from './components/UserFooter';
import GlobalPreloader from './components/GlobalPreloader';
import LeaderboardOverlay from './components/LeaderboardOverlay';

// --- PAGES LAZY LOADING ---
const LandingPage = lazy(() => import('./pages/LandingPage'));
const EventDetailsPage = lazy(() => import('./pages/EventDetailsPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const BlogDetailsPage = lazy(() => import('./pages/BlogDetailsPage'));
const TermsConditionsPage = lazy(() => import('./pages/TermsConditionsPage'));
const RefundCancellationPage = lazy(() => import('./pages/RefundCancellationPage'));

/* ─── USER LAYOUT ─── */
function UserLayout({ children, loading, events, leaderboard }: { children: React.ReactNode, loading: boolean, events: any[], leaderboard: any }) {
  const location = useLocation();
  const { pathname, hash } = location;
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);

  // --- REPLICATION: CURSOR & GSAP GLOBAL ---
  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const cursor = document.querySelector('.cursor') as HTMLElement;
    const follower = document.querySelector('.cursor-follower') as HTMLElement;

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let followerX = window.innerWidth / 2, followerY = window.innerHeight / 2;

    const moveCursor = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        gsap.to(cursor, { x: mouseX, y: mouseY, duration: 0.1 });
    };

    const tickerUpdate = () => {
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;
        gsap.set(follower, { x: followerX, y: followerY });
    };

    window.addEventListener('mousemove', moveCursor);
    gsap.ticker.add(tickerUpdate);

    // Global Hover Delegate
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
    window.addEventListener('mouseover', handleInteract);
    window.addEventListener('mouseout', handleInteract);

    return () => {
        window.removeEventListener('mousemove', moveCursor);
        gsap.ticker.remove(tickerUpdate);
        window.removeEventListener('mouseover', handleInteract);
        window.removeEventListener('mouseout', handleInteract);
    };
  }, []);

  // --- REPLICATION: PRELOADER EXIT & HERO ENTRANCE ---
  useEffect(() => {
    if (!loading && !isIntroDone) {
        // Skip complex landing animation if we are not on the home page
        if (pathname !== '/') {
            setIsIntroDone(true);
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => setIsIntroDone(true)
        });

        tl.to('.preloader', {
            yPercent: -100,
            duration: 1.2,
            ease: "power4.inOut",
            delay: 1.0 // Extra beat for logo reveal
        })
        .to('.hero-title', {
            y: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: "power4.out"
        }, "-=0.6")
        .to('.hero-footer', {
            opacity: 1,
            duration: 1,
            ease: "power2.out"
        }, "-=0.5")
        .from('.hero-visual', {
            opacity: 0,
            x: 80,
            duration: 1.5,
            ease: "power4.out"
        }, "-=1.2");
    }
  }, [loading, isIntroDone, pathname]);

  // Handle path changes (Scroll to top or specific hash)
  useEffect(() => {
    // If there is a hash, we need to wait for the page to be "ready"
    // especially on the landing page where pinning changes offsets.
    if (hash) {
      const id = hash.replace('#', '');
      
      const performScroll = () => {
        const element = document.getElementById(id);
        if (element) {
          // Refresh triggers so heights are accurate before measuring
          ScrollTrigger.refresh();
          
          const navbarHeight = 80; // Estimated height of fixed navbar
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      };

      if (pathname === '/' && !isIntroDone) {
        // Wait for intro to finish if we are on landing page
        return; 
      } else {
        // Run with a slight delay to ensure dynamic content is rendered
        const timer = setTimeout(performScroll, 500);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, isIntroDone]);

  // Separate effect for ScrollTrigger refresh on mount/path change
  useEffect(() => {
    const timer = setTimeout(() => {
        ScrollTrigger.refresh();
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Mark as initially loaded when data is ready or intro completes
  useEffect(() => {
    if (!loading && isIntroDone) {
      setHasInitiallyLoaded(true);
    }
  }, [loading, isIntroDone]);

  return (
    <div className="user-world-container" id="smooth-wrapper">
      {!hasInitiallyLoaded && pathname === '/' && <GlobalPreloader />}
      <LeaderboardOverlay 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        events={events}
        leaderboardData={leaderboard || {}}
      />
      
      <UserNavbar onOpenLeaderboard={() => setIsLeaderboardOpen(true)} />
      
      <div id="smooth-content">
        {children}
      </div>
      <UserFooter />
    </div>
  );
}

export default function UserApp() {
  const { data: events = {}, isLoading: evLoading } = useEvents();
  const { data: coupons = [], isLoading: cpLoading } = useCoupons();
  const { data: leaderboard = {}, isLoading: lbLoading } = useLeaderboard();

  // Show preloader while initial data is fetching
  const isInitialLoading = evLoading || cpLoading || lbLoading;

  // Filter events: only show events that are Open (registrationOpen) and not drafts
  const activeEvents = Object.entries(events)
    .filter(([, ev]) => ev.registrationOpen !== false && !ev.isDraft)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>);
  const activeEventsList = Object.entries(activeEvents).map(([slug, ev]) => ({
    ...ev,
    slug: ev.slug || slug
  }));

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <UserLayout loading={isInitialLoading} events={activeEventsList} leaderboard={leaderboard}>
        <Suspense fallback={<div className="suspense-loader" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712', color: '#fff' }}>LOADING...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage events={activeEventsList} leaderboard={leaderboard} />} />
            <Route path="/events/:slug" element={<EventDetailsPage events={events} coupons={coupons} />} />
            <Route path="/register/:slug" element={<RegistrationPage events={events} />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/blog/:id" element={<BlogDetailsPage />} />
            <Route path="/terms-conditions" element={<TermsConditionsPage />} />
            <Route path="/refund-cancellation" element={<RefundCancellationPage />} />
            <Route path="*" element={<LandingPage events={activeEventsList} leaderboard={leaderboard} />} />
          </Routes>
        </Suspense>
      </UserLayout>
    </BrowserRouter>
  );
}
