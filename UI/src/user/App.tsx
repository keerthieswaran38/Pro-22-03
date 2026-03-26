import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEvents, useCoupons, useLeaderboard, useCMSContent } from '../shared/hooks/useSync';

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
function UserLayout({ children, loading, events, leaderboard, contentData }: { children: React.ReactNode, loading: boolean, events: any[], leaderboard: any, contentData: any[] }) {
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

  const [minSplashDone, setMinSplashDone] = useState(false);

  // --- SPLASH SCREEN TIMER ---
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // --- REPLICATION: PRELOADER EXIT & HERO ENTRANCE ---
  useEffect(() => {
    // Only proceed when data is loaded AND the 1.5s splash period has elapsed
    if (!loading && minSplashDone && !isIntroDone) {
        if (pathname !== '/') {
            setIsIntroDone(true);
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => setIsIntroDone(true)
        });

        // Hard-synced 300ms fade-out immediately after the 1.5s mark
        tl.to('.preloader', {
            opacity: 0,
            duration: 0.3,
            ease: "power2.inOut",
            onComplete: () => setHasInitiallyLoaded(true)
        })
        .to('.hero-title', {
            y: 0,
            duration: 1.2,
            stagger: 0.1,
            ease: "power4.out"
        }, "-=0.1") // Snappy overlap with fade
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
  }, [loading, minSplashDone, isIntroDone, pathname]);

  // --- SCROLL TO TOP / HASH ON PATH CHANGE ---
  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const performScroll = () => {
        const element = document.getElementById(id);
        if (element) {
          ScrollTrigger.refresh();
          const navbarHeight = 80;
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

      if (pathname === '/' && !isIntroDone) return; 
      const timer = setTimeout(performScroll, 500);
      return () => clearTimeout(timer);
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

  return (
    <div className="user-world-container" id="smooth-wrapper">
      {!hasInitiallyLoaded && pathname === '/' && <GlobalPreloader content={contentData} />}
      <LeaderboardOverlay 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        events={events}
        leaderboardData={leaderboard || {}}
      />
      
      <UserNavbar onOpenLeaderboard={() => setIsLeaderboardOpen(true)} content={contentData} />
      
      <div id="smooth-content">
        {children}
      </div>
      <UserFooter content={contentData} />
    </div>
  );
}

export default function UserApp() {
  const { data: events = {}, isLoading: evLoading } = useEvents();
  const { data: coupons = [], isLoading: cpLoading } = useCoupons();
  const { data: leaderboard = {}, isLoading: lbLoading } = useLeaderboard();
  const { data: rawContent = [], isLoading: contentLoading } = useCMSContent();
  const contentData = rawContent.filter((c: any) => c.active).sort((a: any, b: any) => a.order - b.order);

  // Show preloader while initial data is fetching
  const isInitialLoading = evLoading || cpLoading || lbLoading || contentLoading;

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
      <UserLayout loading={isInitialLoading} events={activeEventsList} leaderboard={leaderboard} contentData={contentData}>
        <Suspense fallback={<div className="suspense-loader" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030712', color: '#fff' }}>LOADING...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage events={activeEventsList} leaderboard={leaderboard} content={contentData} />} />
            <Route path="/events/:slug" element={<EventDetailsPage events={events} coupons={coupons} />} />
            <Route path="/register/:slug" element={<RegistrationPage events={events} />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/blog/:id" element={<BlogDetailsPage />} />
            <Route path="/terms-conditions" element={<TermsConditionsPage />} />
            <Route path="/refund-cancellation" element={<RefundCancellationPage />} />
            <Route path="*" element={<LandingPage events={activeEventsList} leaderboard={leaderboard} content={contentData} />} />
          </Routes>
        </Suspense>
      </UserLayout>
    </BrowserRouter>
  );
}
