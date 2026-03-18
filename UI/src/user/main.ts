declare const gsap: any;
declare const ScrollTrigger: any;

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {

// ============================
// CUSTOM CURSOR
// ============================
const cursor = document.querySelector('.cursor') as HTMLElement;
const follower = document.querySelector('.cursor-follower') as HTMLElement;
const hoverTargets = document.querySelectorAll('.hover-target');

let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
let followerX = window.innerWidth / 2, followerY = window.innerHeight / 2;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    gsap.to(cursor, {
        x: mouseX,
        y: mouseY,
        duration: 0.1
    });
});

gsap.ticker.add(() => {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    gsap.set(follower, { x: followerX, y: followerY });
});

hoverTargets.forEach((target: any) => {
    target.addEventListener('mouseenter', () => {
        cursor.classList.add('hovering');
        follower.classList.add('hovering');
    });
    target.addEventListener('mouseleave', () => {
        cursor.classList.remove('hovering');
        follower.classList.remove('hovering');
    });
});

// ============================
// NAVBAR SCROLL - adds solid bg
// ============================
const nav = document.getElementById('main-nav');
ScrollTrigger.create({
    start: 100,
    onUpdate: (self: any) => {
        if (self.scroll() > 100) {
            nav?.classList.add('nav-scrolled');
        } else {
            nav?.classList.remove('nav-scrolled');
        }
    }
});

// ============================
// PRELOADER + HERO INTRO
// ============================
const tl = gsap.timeline();

tl.to('#sweep-path', {
    strokeDashoffset: 0,
    duration: 1.5,
    ease: "power2.inOut"
})
.to('.logo-initials', {
    scale: 1,
    opacity: 1,
    duration: 0.8,
    ease: "back.out(2)"
}, "-=0.5")
.to('.loader-text span', {
    y: 0,
    stagger: 0.1,
    duration: 0.8,
    ease: "power3.out"
}, "-=0.3")
.to('.preloader', {
    yPercent: -100,
    duration: 1.2,
    ease: "power4.inOut",
    delay: 0.8
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
// Animate the hero visual
.from('.hero-visual', {
    opacity: 0,
    x: 80,
    duration: 1.5,
    ease: "power4.out"
}, "-=1.2");

// ============================
// ABOUT PARALLAX TEXT
// ============================
gsap.utils.toArray('.massive-text').forEach((text: any) => {
    gsap.to(text, {
        xPercent: -20 * parseFloat(text.dataset.speed || "1"),
        ease: "none",
        scrollTrigger: {
            trigger: '.about-massive',
            start: "top bottom",
            end: "bottom top",
            scrub: 1
        }
    });
});

// ============================
// STATS COUNTER ANIMATION
// ============================
const statNumbers = document.querySelectorAll('.stat-number');
statNumbers.forEach((numEl: any) => {
    const target = parseInt((numEl as HTMLElement).dataset.target || "0");
    
    ScrollTrigger.create({
        trigger: numEl,
        start: "top 85%",
        once: true,
        onEnter: () => {
            gsap.to({ val: 0 }, {
                val: target,
                duration: 2,
                ease: "power2.out",
                onUpdate: function(this: any) {
                    (numEl as HTMLElement).textContent = Math.round(this.targets()[0].val).toString();
                }
            });
        }
    });
});

// ============================
// HORIZONTAL SIDE-SCROLL: SERVICES
// ============================
const servicesSection = document.querySelector('.services-horizontal-unique') as HTMLElement;
const servicesTrack = document.querySelector('.services-track-new') as HTMLElement;

if (servicesSection && servicesTrack) {
    const getScrollAmount = () => {
        const trackWidth = servicesTrack.scrollWidth;
        const viewportWidth = document.documentElement.clientWidth;
        return Math.max(0, trackWidth - viewportWidth);
    };

    gsap.to(servicesTrack, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
            id: "servicesHorizontal",
            trigger: servicesSection,
            pin: true,
            start: "top top",
            end: () => `+=${getScrollAmount()}`,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self: any) => {
                const head = document.querySelector('#services .heading-unique');
                if (head) {
                    gsap.set(head, { x: self.progress * 300 - 150 });
                }
            }
        }
    });

    // Parallax Effect for Slide Images
    gsap.utils.toArray('.ss-img img').forEach((img: any) => {
        gsap.to(img, {
            xPercent: 20,
            ease: "none",
            scrollTrigger: {
                trigger: img.closest('.service-slide'),
                containerAnimation: gsap.getById('servicesHorizontal'),
                start: "left right",
                end: "right left",
                scrub: true
            }
        });
    });
}

// Animate Headings
gsap.utils.toArray('.heading-unique').forEach((heading: any) => {
    const filled = heading.querySelector('.filled');
    const outline = heading.querySelector('.outline');
    const accent = heading.querySelector('.accent-text');

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: heading,
            start: "top 90%",
            toggleActions: "play none none none"
        }
    });

    tl.from(accent, { x: -20, opacity: 0, duration: 1, ease: "power2.out" })
      .from(filled, { y: 50, opacity: 0, duration: 1.2, ease: "power4.out" }, "-=0.8")
      .from(outline, { y: 30, opacity: 0, duration: 1.2, ease: "power4.out" }, "-=1");
});

// ============================
// STACKED ENTRANCE: EVENTS
// ============================
gsap.utils.toArray('.event-stack-item').forEach((item: any) => {
    const isEven = item.matches(':nth-child(even)');
    
    gsap.from(item.querySelector('.esi-img'), {
        x: isEven ? 100 : -100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none none"
        }
    });

    gsap.from(item.querySelector('.esi-content'), {
        y: 60,
        opacity: 0,
        duration: 1.2,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none none"
        }
    });
});

// ============================
// FOOTER REVEAL
// ============================
gsap.from('.footer-full', {
    opacity: 0,
    y: 40,
    duration: 1,
    scrollTrigger: {
        trigger: '.footer-full',
        start: "top 90%",
        toggleActions: "play none none none"
    }
});

// ============================
// LEADERBOARD OVERLAY LOGIC
// ============================
const navLeaderboard = document.getElementById('nav-leaderboard');
const lbOverlay = document.getElementById('leaderboard-overlay');
const lbClose = document.getElementById('lb-close');
const lbEventsGrid = document.getElementById('lb-events-grid');
const lbStandingsView = document.getElementById('lb-standings-view');
const lbWinnersList = document.getElementById('lb-winners-list');
const lbEventName = document.getElementById('lb-event-name');
const lbBackBtn = document.getElementById('lb-back-btn');
const eventCards = document.querySelectorAll('.lb-event-card');

const leaderboardData: Record<string, {name: string, time: string}[]> = {
    'womens-day': [
        {name: "Sarah Johnson", time: "02:15:30"},
        {name: "Priya Sharma", time: "02:18:45"},
        {name: "Emily Chen", time: "02:20:10"},
        {name: "Anita Desai", time: "02:22:55"},
        {name: "Maria Garcia", time: "02:25:00"}
    ],
    'health-day': [
        {name: "Rahul Kumar", time: "00:45:12"},
        {name: "David Smith", time: "00:46:30"},
        {name: "Arjun Reddy", time: "00:47:15"},
        {name: "Michael Chang", time: "00:48:05"},
        {name: "Karthik N.", time: "00:49:20"}
    ],
    'fathers-day': [
        {name: "James & Tommy", time: "01:10:45"},
        {name: "Raj & Aryan", time: "01:12:30"},
        {name: "Robert & Bobby", time: "01:15:00"},
        {name: "Vikram & Dev", time: "01:16:20"},
        {name: "Ali & Hassan", time: "01:18:10"}
    ]
};

if (navLeaderboard && lbOverlay && lbClose && lbBackBtn) {
    // Open Leaderboard overlay
    navLeaderboard.addEventListener('click', (e) => {
        e.preventDefault();
        lbOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        gsap.fromTo(lbOverlay, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
        
        // Reset to grid view
        lbStandingsView!.style.display = 'none';
        lbEventsGrid!.style.display = 'grid';
        
        gsap.fromTo('.lb-event-card', 
            { opacity: 0, y: 40 }, 
            { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, delay: 0.2, ease: "power4.out" }
        );
    });

    // Close Leaderboard overlay
    lbClose.addEventListener('click', () => {
        gsap.to(lbOverlay, { 
            opacity: 0, 
            y: 50, 
            duration: 0.4, 
            ease: "power2.in",
            onComplete: () => {
                lbOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Switch to Event Standings
    eventCards.forEach(card => {
        card.addEventListener('click', () => {
            const eventId = (card as HTMLElement).dataset.event;
            const eventTitle = card.querySelector('h3')?.textContent || "EVENT";
            
            if (eventId && leaderboardData[eventId]) {
                const winners = leaderboardData[eventId];
                
                // Animate out grid
                gsap.to(lbEventsGrid, {
                    opacity: 0, y: -20, duration: 0.3, onComplete: () => {
                        lbEventsGrid!.style.display = 'none';
                        lbStandingsView!.style.display = 'block';
                        lbEventName!.textContent = eventTitle;
                        
                        // Populate list
                        lbWinnersList!.innerHTML = '';
                        winners.forEach((w, index) => {
                            const rank = index + 1;
                            const row = document.createElement('div');
                            row.className = `lb-winner-row rank-${Math.min(rank, 4)}`; // Apply rank 1,2,3 logic
                            row.innerHTML = `
                                <div class="lb-rank">0${rank}</div>
                                <div class="lb-winner-info">
                                    <div class="lb-winner-name">${w.name}</div>
                                </div>
                                <div class="lb-winner-time">${w.time}</div>
                            `;
                            lbWinnersList!.appendChild(row);
                        });
                        
                        // Animate in standings
                        gsap.fromTo(lbStandingsView, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.5 });
                        gsap.fromTo('.lb-winner-row', 
                            { opacity: 0, x: 20 }, 
                            { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, delay: 0.1 }
                        );
                    }
                });
            }
        });
    });

    // Back button
    lbBackBtn.addEventListener('click', () => {
        gsap.to(lbStandingsView, {
            opacity: 0, x: 50, duration: 0.3, onComplete: () => {
                lbStandingsView!.style.display = 'none';
                lbEventsGrid!.style.display = 'grid';
                gsap.fromTo(lbEventsGrid, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.5 });
            }
        });
    });
}

});
