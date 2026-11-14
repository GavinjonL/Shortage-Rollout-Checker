const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
export async function getDemoPolicy() { const response = await fetch(`${API_URL}/policies/demo`); return response.json(); }
