/**
 * Central API Configuration for Gagner Sports
 * Handles switching between local development and production (Render).
 */

const IS_PROD = window.location.hostname !== 'localhost';
const RENDER_URL = 'https://gagnertest.onrender.com'; // Use your confirmed backend URL

export const API_BASE = (import.meta as any).env.VITE_API_URL || 
    (IS_PROD ? RENDER_URL : '');

console.log(`🚀 [API CONFIG] Targeting Backend: ${API_BASE || 'Local Proxy'}`);
