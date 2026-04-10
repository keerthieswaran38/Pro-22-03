// Force strictly https://gagnersports.com to avoid /api/api double paths
let baseUrl = import.meta.env.VITE_API_URL || 'https://gagnersports.com';
if (baseUrl.endsWith('/api')) baseUrl = baseUrl.slice(0, -4);
const API_BASE_URL = baseUrl;

export default API_BASE_URL;
