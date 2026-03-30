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
  registrationStart?: string;
  registrationEnd?: string;
  rules?: string;
  prizes_desc?: string;
  contact_email?: string;
  contact_phone?: string;
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
  isPaid: boolean;
  orderId?: string;
  transactionId?: string;
  tracking_id?: string;
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
  type: 'image' | 'logo' | 'sponsor' | 'content' | 'gallery' | 'service' | 'contact';
  title: string;
  imageUrl: string;
  description: string;
  link?: string;
  buttonName?: string;
  metadata?: any;
  order: number;
  active: boolean;
}

// ========================
// API HELPERS (WITH DEBUGGING)
// ========================

// Handle API Base URL for local/production
export const API_BASE = (import.meta as any).env.VITE_API_URL || 
  (window.location.hostname !== 'localhost' ? 'https://gagnertest.onrender.com' : '');

if ((import.meta as any).env.PROD) {
  console.log('🔗 PROD API connected to:', API_BASE);
}

const api = {
  get: async (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(`GET ${fullUrl} failed`);
    return await res.json();
  },
  post: async (url: string, data: any) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${fullUrl} failed`);
    return await res.json();
  },
  del: async (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const res = await fetch(fullUrl, { method: 'DELETE' });
    if (!res.ok) throw new Error(`DELETE ${fullUrl} failed`);
    return await res.json();
  }
};

// ========================
// CLOUDINARY IMAGE UPLOAD
// ========================
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }
  const data = await res.json();
  return data.url;
}

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
  await api.post('/api/participants-batch', parts);
}

export async function sendBulkEmail(subject: string, body: string, recipients: string[]): Promise<any> {
  return await api.post('/api/bulk-email', { subject, body, recipients });
}


export interface LeaderboardEntry {
  name: string;
  time: string | null;
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

export async function deleteLeaderboard(eventSlug: string): Promise<void> {
  await api.del(`/api/leaderboard/${eventSlug}`);
}

// ========================
// DMS (Content & Asset) Helpers
// ========================

export async function getDMSItems(type: string): Promise<ContentBlock[]> {
  const data = await api.get(`/api/dms/${type}`);
  return Array.isArray(data) ? data : [];
}

export async function createDMSItem(type: string, item: Partial<ContentBlock>): Promise<ContentBlock> {
  return await api.post(`/api/dms/${type}`, item);
}

export async function updateDMSItem(type: string, id: string, item: Partial<ContentBlock>): Promise<ContentBlock> {
  const res = await fetch(`${API_BASE}/api/dms/${type}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error(`PUT /api/dms/${type}/${id} failed`);
  return await res.json();
}

export async function deleteDMSItem(type: string, id: string): Promise<void> {
  await api.del(`/api/dms/${type}/${id}`);
}

export async function upsertLogo(imageUrl: string, title: string = 'Brand Logo'): Promise<ContentBlock> {
  return await api.post('/api/dms/logo/upsert', { imageUrl, title });
}
