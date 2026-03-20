/**
 * MongoDB-backed storage helpers — Events, Participants, Coupons, Content, Leaderboard.
 * Communicates with the proxy /api endpoints.
 */

export interface EventCategory {
  name: string;
  price: string;
  details: string[];
  prizes?: Record<string, string>;
}

export interface GagnerEvent {
  _id?: string;
  slug: string;
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
  archived?: boolean;
  isDraft?: boolean;
  status?: 'Open' | 'Closed' | 'Sold Out' | 'Coming Soon';
  latLng?: { lat: number; lng: number };
  completedDate?: string;
  capacity?: number;
  registeredCount?: number;
  createdAt: string;
}

export interface Participant {
  _id?: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  ageGroup: string;
  eventSlug: string;
  eventName: string;
  category: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  registeredAt: string;
}

export interface Coupon {
  _id?: string;
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountPercent: number; // Keep for backward compatibility/logic
  maxUses: number;
  usedCount: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
  eventId: string;
}

export interface ContentBlock {
  _id?: string;
  id: string;
  type: 'image' | 'logo' | 'sponsor' | 'content';
  title: string;
  imageUrl: string;
  description: string;
  order: number;
  active: boolean;
}

// ========================
// API HELPERS (WITH DEBUGGING)
// ========================

const api = {
  get: async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GET ${url} failed`);
    return await res.json();
  },
  post: async (url: string, data: any) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${url} failed`);
    return await res.json();
  }
};

export async function getEvents(): Promise<Record<string, GagnerEvent>> {
  return await api.get('/api/events');
}

export async function saveEvents(events: Record<string, GagnerEvent>): Promise<void> {
  await api.post('/api/events-batch', events);
}

export async function getParticipants(): Promise<Participant[]> {
  const data = await api.get('/api/participants');
  return Array.isArray(data) ? data : [];
}

export async function saveParticipant(p: Participant): Promise<void> {
  await api.post('/api/participants', p);
}

export async function saveParticipants(parts: Participant[]): Promise<void> {
  // Simple bulk — can be expanded to proper batch route later
  for (const p of parts) {
    await saveParticipant(p);
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  const data = await api.get('/api/coupons');
  return Array.isArray(data) ? data : [];
}

export async function saveCoupons(coupons: Coupon[]): Promise<void> {
  await api.post('/api/coupons', coupons);
}

export async function getContent(): Promise<ContentBlock[]> {
  const data = await api.get('/api/content');
  return Array.isArray(data) ? data : [];
}

export async function saveContent(content: ContentBlock[]): Promise<void> {
  await api.post('/api/content', content);
}

export async function getLeaderboard(): Promise<Record<string, any>> {
  return await api.get('/api/leaderboard');
}

export async function saveLeaderboard(eventSlug: string, winners: any[]): Promise<void> {
  await api.post('/api/leaderboard', { eventSlug, winners });
}
