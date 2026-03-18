/**
 * localStorage helpers — Events, Participants, Coupons, Content, Leaderboard.
 * Includes 30-day Smart Auto-Archive logic.
 */

// ========================
// EVENTS
// ========================
export interface EventCategory {
  name: string;
  price: string;
  details: string[];
  prizes?: Record<string, string>;
}

export interface GagnerEvent {
  title: string;
  tag: string;
  date: string;
  time: string;
  venue: string;
  bgImg: string;
  desc: string;
  categories: EventCategory[];
  deliverables: string[];
  registrationOpen?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  rules?: string;
  prizes_desc?: string;
  contact_email?: string;
  contact_phone?: string;
  archived?: boolean;
  isDraft?: boolean;
  latLng?: { lat: number; lng: number };
  completedDate?: string;
  capacity?: number;
  createdAt: string;
}

const EVENTS_KEY = 'gagner_events';

const DEFAULT_EVENTS: Record<string, GagnerEvent> = {
  'womens-day-run': {
    title: "WORLD WOMEN'S DAY RUN 2026",
    tag: "MARATHON",
    date: "MARCH 08, 2026",
    time: "5:30 AM Onwards",
    venue: "Besant Nagar Beach, Chennai",
    bgImg: "/src/assets/images/womens_day_run.png",
    desc: "Celebrating strength and endurance. Join 5000+ women in this annual tribute to empowerment.",
    categories: [
      { name: "3K Fun Run", price: "₹699", details: ["Open to All", "No Cash Prizes"] },
      { name: "5K Timed Run", price: "₹899", details: ["Chip Timing", "Age Cats: 17-35, 35-50, 50+"], prizes: { "1st": "₹3,000", "2nd": "₹1,500", "3rd": "₹1,000" } },
      { name: "10K Timed Run", price: "₹1,049", details: ["Chip Timing", "Professional Category"], prizes: { "1st": "₹4,000", "2nd": "₹2,000", "3rd": "₹1,500" } }
    ],
    deliverables: ["Event T-Shirt", "Finisher Medal", "E-Certificate", "Breakfast Kit", "Goodie Bag", "Pro Photos"],
    registrationOpen: true,
    rules: "1. Participation is only for women. 2. Chest numbers must be visible. 3. Reach the venue 30 mins early.",
    prizes_desc: "Cash prizes for top 3 in 5K and 10K categories. Trophies for all age group winners.",
    contact_email: "events@gagnersports.com",
    contact_phone: "+91 98405 47782",
    completedDate: '',
    capacity: 5000,
    createdAt: '2026-03-01',
  },
  'health-day-run': {
    title: "WORLD HEALTH DAY RUN 2026",
    tag: "FITNESS",
    date: "APRIL 07, 2026",
    time: "5:00 AM – 8:00 AM",
    venue: "Decathlon, Kalamassery, Kochi",
    bgImg: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=1400&auto=format&fit=crop",
    desc: "Run for Fitness • Run for Wellness • Run for Life.",
    categories: [
      { name: "3K Fun Run", price: "₹699", details: ["Open to All"] },
      { name: "5K Timed Run", price: "₹899", details: ["Age Cats: 17-35, 35-50, 50+"], prizes: { "1st": "₹3,000", "2nd": "₹1,500", "3rd": "₹1,000" } },
      { name: "10K Timed Run", price: "₹1,049", details: ["Age Cats: 17-35, 35-50, 50+"], prizes: { "1st": "₹4,000", "2nd": "₹2,000", "3rd": "₹1,500" } }
    ],
    deliverables: ["Event T-Shirt", "Finisher Medal", "E-Certificate", "Refreshments", "Goodie Bag"],
    registrationOpen: true,
    completedDate: '',
    createdAt: '2026-03-05',
  },
  'fathers-day-marathon': {
    title: "FATHER'S DAY MARATHON 2026",
    tag: "FAMILY",
    date: "JUNE 21, 2026",
    time: "5:30 AM Onwards",
    venue: "Marina Beach, Chennai",
    bgImg: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=1400&auto=format&fit=crop",
    desc: "Bond through sweat. A unique family-centric marathon event for all age groups.",
    categories: [
      { name: "2K Father-Child Duo", price: "₹899", details: ["Non-timed", "Family Friendly"] },
      { name: "5K Timed Run", price: "₹899", details: ["Chip Timing"], prizes: { "1st": "₹2,500", "2nd": "₹1,500", "3rd": "₹1,000" } }
    ],
    deliverables: ["Duo T-Shirts", "Finisher Medals", "E-Certificate", "Breakfast"],
    registrationOpen: true,
    completedDate: '',
    createdAt: '2026-03-10',
  },
  'chennai-juniorthon': {
    title: "NAMMA CHENNAI JUNIORTHON — 4TH ED",
    tag: "KIDS",
    date: "COMING 2026",
    time: "6:00 AM Onwards",
    venue: "Jawaharlal Nehru Stadium, Chennai",
    bgImg: "/src/assets/images/chennai_juniorthon.png",
    desc: "The biggest kids-exclusive stadium run in Chennai returns for its 4th Edition!",
    categories: [
      { name: "1K Run (3-5 years)", price: "₹599", details: ["Parent Accompanied", "Fun Run"] },
      { name: "3K Run (6-10 years)", price: "₹699", details: ["Timed Run", "Stadium Track"] },
      { name: "5K Run (11-15 years)", price: "₹799", details: ["Timed Run", "Championship Cat"] }
    ],
    deliverables: ["Junior T-Shirt", "Champion Medal", "Certificate", "Goody Bag", "Snack Box"],
    registrationOpen: false,
    completedDate: '',
    capacity: 3000,
    createdAt: '2026-03-01',
  }
};

export function getEvents(): Record<string, GagnerEvent> {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Run auto-archive check on every read
      return runAutoArchive(parsed);
    }
  } catch { /* fall through */ }
  const seeded = { ...DEFAULT_EVENTS };
  localStorage.setItem(EVENTS_KEY, JSON.stringify(seeded));
  return seeded;
}

export function saveEvents(events: Record<string, GagnerEvent>): void {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

/**
 * ─── 30-DAY SMART AUTO-ARCHIVE ───
 * Scans every event. If `completedDate` is set and older than 30 days,
 * set `archived: true`. Persists the change.
 */
function runAutoArchive(events: Record<string, GagnerEvent>): Record<string, GagnerEvent> {
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  let changed = false;

  for (const slug of Object.keys(events)) {
    const ev = events[slug];
    if (ev.completedDate && !ev.archived) {
      const completed = new Date(ev.completedDate).getTime();
      if (!isNaN(completed) && now - completed >= THIRTY_DAYS_MS) {
        ev.archived = true;
        changed = true;
      }
    }
  }
  if (changed) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  }
  return events;
}

// ========================
// PARTICIPANTS (Mock Data)
// ========================
export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: 'Male' | 'Female' | 'Other';
  ageGroup: string;
  eventSlug: string;
  eventName: string;
  category: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  registeredAt: string;
}

const PARTICIPANTS_KEY = 'gagner_participants';

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Priya Sharma', email: 'priya@email.com', phone: '+91 98765 43210', city: 'Chennai', gender: 'Female', ageGroup: '25-35', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '5K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-02-15' },
  { id: 'p2', name: 'Rahul Kumar', email: 'rahul@email.com', phone: '+91 87654 32109', city: 'Kochi', gender: 'Male', ageGroup: '25-35', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '10K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-02-20' },
  { id: 'p3', name: 'Anita Desai', email: 'anita@email.com', phone: '+91 76543 21098', city: 'Chennai', gender: 'Female', ageGroup: '35-50', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '10K Timed Run', paymentStatus: 'Pending', registeredAt: '2026-02-22' },
  { id: 'p4', name: 'David Smith', email: 'david@email.com', phone: '+91 65432 10987', city: 'Bangalore', gender: 'Male', ageGroup: '17-25', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '5K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-01' },
  { id: 'p5', name: 'Meera Nair', email: 'meera@email.com', phone: '+91 54321 09876', city: 'Chennai', gender: 'Female', ageGroup: '25-35', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '3K Fun Run', paymentStatus: 'Paid', registeredAt: '2026-03-02' },
  { id: 'p6', name: 'James Wilson', email: 'james@email.com', phone: '+91 43210 98765', city: 'Mumbai', gender: 'Male', ageGroup: '35-50', eventSlug: 'fathers-day-marathon', eventName: "Father's Day Marathon", category: '5K Timed Run', paymentStatus: 'Failed', registeredAt: '2026-03-05' },
  { id: 'p7', name: 'Lakshmi R.', email: 'lakshmi@email.com', phone: '+91 32109 87654', city: 'Chennai', gender: 'Female', ageGroup: '50+', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '3K Fun Run', paymentStatus: 'Paid', registeredAt: '2026-03-06' },
  { id: 'p8', name: 'Arjun Reddy', email: 'arjun@email.com', phone: '+91 21098 76543', city: 'Hyderabad', gender: 'Male', ageGroup: '25-35', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '10K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-07' },
  { id: 'p9', name: 'Sunita Patel', email: 'sunita@email.com', phone: '+91 10987 65432', city: 'Delhi', gender: 'Female', ageGroup: '17-25', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '5K Timed Run', paymentStatus: 'Pending', registeredAt: '2026-03-08' },
  { id: 'p10', name: 'Vikram Singh', email: 'vikram@email.com', phone: '+91 09876 54321', city: 'Chennai', gender: 'Male', ageGroup: '35-50', eventSlug: 'fathers-day-marathon', eventName: "Father's Day Marathon", category: '2K Father-Child Duo', paymentStatus: 'Paid', registeredAt: '2026-03-09' },
  { id: 'p11', name: 'Kavitha S.', email: 'kavitha@email.com', phone: '+91 98712 34567', city: 'Kochi', gender: 'Female', ageGroup: '25-35', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '3K Fun Run', paymentStatus: 'Paid', registeredAt: '2026-03-10' },
  { id: 'p12', name: 'Tommy Wilson', email: 'tommy@email.com', phone: '+91 87612 34567', city: 'Chennai', gender: 'Male', ageGroup: '6-10', eventSlug: 'chennai-juniorthon', eventName: 'Chennai Juniorthon', category: '3K Run (6-10 years)', paymentStatus: 'Paid', registeredAt: '2026-03-11' },
  // High volume test data for this week (Mar 12 - Mar 18)
  { id: 'p13', name: 'Aditi Rao', email: 'aditi@email.com', phone: '+91 99001 12233', city: 'Chennai', gender: 'Female', ageGroup: '25-35', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '10K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-12' },
  { id: 'p14', name: 'Karthik S.', email: 'karthik@email.com', phone: '+91 99001 12234', city: 'Chennai', gender: 'Male', ageGroup: '35-50', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '10K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-13' },
  { id: 'p15', name: 'Revathi M.', email: 'revathi@email.com', phone: '+91 99001 12235', city: 'Madurai', gender: 'Female', ageGroup: '17-25', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '5K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-14' },
  { id: 'p16', name: 'Srinivasan K.', email: 'srini@email.com', phone: '+91 99001 12236', city: 'Chennai', gender: 'Male', ageGroup: '50+', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '5K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-15' },
  { id: 'p17', name: 'Divya P.', email: 'divya@email.com', phone: '+91 99001 12237', city: 'Chennai', gender: 'Female', ageGroup: '25-35', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '3K Fun Run', paymentStatus: 'Paid', registeredAt: '2026-03-16' },
  { id: 'p18', name: 'Manish J.', email: 'manish@email.com', phone: '+91 99001 12238', city: 'Pune', gender: 'Male', ageGroup: '25-35', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '10K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-17' },
  { id: 'p19', name: 'Swati K.', email: 'swati@email.com', phone: '+91 99001 12239', city: 'Chennai', gender: 'Female', ageGroup: '35-50', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '5K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-18' },
  { id: 'p20', name: 'Balaji V.', email: 'balaji@email.com', phone: '+91 99001 12240', city: 'Chennai', gender: 'Male', ageGroup: '25-35', eventSlug: 'health-day-run', eventName: 'Health Day Run', category: '5K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-18' },
  { id: 'p21', name: 'Sneha L.', email: 'sneha@email.com', phone: '+91 99001 12241', city: 'Bangalore', gender: 'Female', ageGroup: '17-25', eventSlug: 'womens-day-run', eventName: "Women's Day Run", category: '10K Timed Run', paymentStatus: 'Paid', registeredAt: '2026-03-18' },
];

export function getParticipants(): Participant[] {
  try {
    const raw = localStorage.getItem(PARTICIPANTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(MOCK_PARTICIPANTS));
  return [...MOCK_PARTICIPANTS];
}

export function saveParticipants(p: Participant[]): void {
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(p));
}

// ========================
// COUPONS
// ========================
export interface Coupon {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
  eventId: string;
}

const COUPONS_KEY = 'gagner_coupons';

const DEFAULT_COUPONS: Coupon[] = [
  { id: 'c1', code: 'EARLYBIRD20', discountPercent: 20, maxUses: 100, usedCount: 34, expiryDate: '2026-04-01', active: true, createdAt: '2026-01-15', eventId: 'ALL' },
  { id: 'c2', code: 'GAGNER10', discountPercent: 10, maxUses: 500, usedCount: 128, expiryDate: '2026-12-31', active: true, createdAt: '2026-01-01', eventId: 'ALL' },
  { id: 'c3', code: 'SPRINT15', discountPercent: 15, maxUses: 200, usedCount: 67, expiryDate: '2026-06-30', active: true, createdAt: '2026-02-01', eventId: 'ALL' },
];

export function getCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  localStorage.setItem(COUPONS_KEY, JSON.stringify(DEFAULT_COUPONS));
  return [...DEFAULT_COUPONS];
}

export function saveCoupons(coupons: Coupon[]): void {
  localStorage.setItem(COUPONS_KEY, JSON.stringify(coupons));
}

// ========================
// LEADERBOARD
// ========================
export interface LeaderboardEntry {
  name: string;
  time: string | null;
}

const LEADERBOARD_KEY = 'gagner_leaderboard';

const DEFAULT_LEADERBOARD: Record<string, LeaderboardEntry[]> = {
  'womens-day-run': [
    { name: "Sarah Johnson", time: "02:15:30" },
    { name: "Priya Sharma", time: "02:18:45" },
    { name: "Emily Chen", time: "02:20:10" },
  ],
  'health-day-run': [
    { name: "Rahul Kumar", time: "00:45:12" },
    { name: "David Smith", time: "00:46:30" },
    { name: "Arjun Reddy", time: "00:47:15" },
  ],
  'fathers-day-marathon': [
    { name: "James & Tommy", time: "01:10:45" },
    { name: "Raj & Aryan", time: "01:12:30" },
    { name: "Robert & Bobby", time: "01:15:00" },
  ],
};

export function getLeaderboard(): Record<string, LeaderboardEntry[]> {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
  return JSON.parse(JSON.stringify(DEFAULT_LEADERBOARD));
}

export function saveLeaderboard(data: Record<string, LeaderboardEntry[]>): void {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(data));
}

// ========================
// CONTENT CMS
// ========================
export interface ContentBlock {
  id: string;
  type: 'image' | 'logo' | 'sponsor' | 'content';
  title: string;
  imageUrl: string;
  description: string;
  order: number;
  active: boolean;
}

const CONTENT_KEY = 'gagner_content';

const DEFAULT_CONTENT: ContentBlock[] = [
  { id: 'cnt1', type: 'sponsor', title: 'Decathlon', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Logo_Decathlon_2022.svg/320px-Logo_Decathlon_2022.svg.png', description: 'Official Sports Partner', order: 1, active: true },
  { id: 'cnt2', type: 'sponsor', title: 'Puma', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Puma_logo.svg/320px-Puma_logo.svg.png', description: 'Apparel Partner', order: 2, active: true },
  { id: 'cnt3', type: 'image', title: 'Hero Banner', imageUrl: '/src/assets/images/hero_visual.png', description: 'Main hero section background', order: 1, active: true },
  { id: 'cnt4', type: 'logo', title: 'Gagner Sports Logo', imageUrl: '/src/assets/images/logo.png', description: 'Primary brand logo', order: 1, active: true },
];

export function getContent(): ContentBlock[] {
  try {
    const raw = localStorage.getItem(CONTENT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through */ }
  localStorage.setItem(CONTENT_KEY, JSON.stringify(DEFAULT_CONTENT));
  return [...DEFAULT_CONTENT];
}

export function saveContent(content: ContentBlock[]): void {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
}
