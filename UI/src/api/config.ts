/**
 * Central API Configuration for Gagner Sports
 * 
 * In PRODUCTION (Vercel): Uses relative URLs like /api/events
 *   → Vercel rewrites proxy these to https://gagnertest.onrender.com/api/events
 *   → Zero CORS issues!
 * 
 * In LOCAL DEV: Vite proxy forwards /api to localhost:5000
 *   → Also zero CORS issues!
 */

export const API_BASE = (import.meta as any).env.VITE_API_URL || '';

console.log(`🚀 [API CONFIG] Mode: ${API_BASE ? 'Direct (' + API_BASE + ')' : 'Proxy (Vercel/Vite)'}`);
