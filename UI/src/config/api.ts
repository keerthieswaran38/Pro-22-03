// Always use the production Render backend directly.
// Vite's proxy is NOT used for direct payment redirects.
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'https://gagnertest.onrender.com';

export default API_BASE_URL;
