import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEvents, useCoupons, useLeaderboard, useCMSContent } from '../shared/hooks/useSync';

// --- GSAP GLOBAL DECLARATION ---
// This prevents ReferenceErrors when GSAP is loaded via CDN (as in index.html)
declare const gsap: any;
declare const ScrollTrigger: any;

// --- COMPONENTS ---
import UserNavbar from './components/UserNavbar';
import UserFooter from './components/UserFooter';
import GlobalPreloader from './components/GlobalPreloader';
import LeaderboardOverlay from './components/LeaderboardOverlay';

// --- PAGES LAZY LOADING ---
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const EventDetailsPage = React.lazy(() => import('./pages/EventDetailsPage'));
const RegistrationPage = React.lazy(() => import('./pages/RegistrationPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const BlogDetailsPage = React.lazy(() => import('./pages/BlogDetailsPage'));
const TermsConditionsPage = React.lazy(() => import('./pages/TermsConditionsPage'));
const RefundCancellationPage = React.lazy(() => import('./pages/RefundCancellationPage'));
const RegistrationSuccess = React.lazy(() => import('./pages/RegistrationSuccess'));

/* ─── USER LAYOUT ─── */
function UserLayout({ children, loading, events, leaderboard, contentData }: { children: React.ReactNode, loading: boolean, events: any[], leaderboard: any, contentData: any[] }) {
  const location = useLocation();
  const { pathname, hash } = location;
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [forceReady, setForceReady] = useState(false); // Safety override

  // --- REPLICATION: CURSOR & GSAP GLOBAL ---
  useLayoutEffect(() => {
    if (typeof gsap === 'undefined') return;
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
    const timer = setTimeout(() => setMinSplashDone(true), 2500); // Reduce splash wait to 2.5s

    // Safety Force-Ready Timeout: 4s max wait for data
    const safetyTimer = setTimeout(() => {
        console.warn("Preloader safety timeout triggered - forcing app to load");
        setForceReady(true);
    }, 4000);

    return () => {
        clearTimeout(timer);
        clearTimeout(safetyTimer);
    };
  }, []);

  // --- REPLICATION: PRELOADER EXIT & HERO ENTRANCE ---
  useEffect(() => {
    if ((!loading || forceReady) && !isIntroDone && pathname !== '/') {
        setIsIntroDone(true);
        setHasInitiallyLoaded(true);
        return;
    }

    if ((!loading || forceReady) && minSplashDone && !isIntroDone) {
        if (pathname !== '/') {
            setIsIntroDone(true);
            setHasInitiallyLoaded(true);
            return;
        }

        const tl = gsap.timeline();
        setHasInitiallyLoaded(true);

        tl.to('.preloader', {
            yPercent: -100,
            duration: 1.2,
            ease: "expo.inOut",
            onComplete: () => {
                setIsIntroDone(true);
            }
        });

        setTimeout(() => setIsIntroDone(true), 1500);
    }
}, [loading, minSplashDone, isIntroDone, pathname, forceReady]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname]);

  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  return (
    <div className="user-world-container" id="smooth-wrapper">
      {!hasInitiallyLoaded && <GlobalPreloader content={contentData} />}
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
  const [dataTimeout, setDataTimeout] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    // Show a "waking up" hint after 8s, and only show the fallback error banner after 65s.
    const wakeTimer  = setTimeout(() => setIsWakingUp(true),  8000);
    const hardTimer  = setTimeout(() => { setDataTimeout(true); setIsWakingUp(false); }, 65000);
    return () => { clearTimeout(wakeTimer); clearTimeout(hardTimer); };
  }, []);

  const { data: events = {}, isLoading: evLoading, error: evError } = useEvents();
  const { data: coupons = [], isLoading: cpLoading, error: cpError } = useCoupons();
  const { data: leaderboard = {}, isLoading: lbLoading, error: lbError } = useLeaderboard();
  const { data: rawContent = [], isLoading: contentLoading, error: contentError } = useCMSContent();

  const contentData = rawContent.filter((c: any) => c.active).sort((a: any, b: any) => a.order - b.order);

  const isStillLoading = evLoading || cpLoading || lbLoading || contentLoading;
  const isInitialLoading = !dataTimeout && isStillLoading;
  const hasError = dataTimeout && isStillLoading; 

  const activeEvents = Object.entries(events)
    .filter(([, ev]) => ev.registrationOpen !== false && !ev.isDraft)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, any>);
  const activeEventsList = Object.entries(activeEvents).map(([slug, ev]) => ({
    ...ev,
    slug: ev.slug || slug
  }));

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {isWakingUp && !dataTimeout && isStillLoading && (
          <div style={{ position:'fixed', top:0, left:0, right:0, background:'rgba(180,120,0,0.95)', color:'#fff', zIndex:99999, padding:'8px 16px', textAlign:'center', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' }}>
            <span style={{ display:'inline-block', width:'14px', height:'14px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}></span>
            ⏳ Waking up the server — this takes ~30 seconds on first load. Please wait...
          </div>
      )}
      {hasError && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'red', color: 'white', zIndex: 99999, padding: '10px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
              ⚠️ Unable to load live database. Showing local fallback data.
          </div>
      )}
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
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            <Route path="/payment-failed" element={<RegistrationSuccess />} />
            <Route path="/test-success" element={<RegistrationSuccess isTest={true} />} />
            <Route path="/test-failed" element={<RegistrationSuccess isTest={true} />} />
            <Route path="*" element={<LandingPage events={activeEventsList} leaderboard={leaderboard} content={contentData} />} />
          </Routes>
        </Suspense>
      </UserLayout>
    </BrowserRouter>
  );
}
