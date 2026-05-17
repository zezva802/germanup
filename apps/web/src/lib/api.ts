import axios from 'axios';
import { getSession } from 'next-auth/react';
import { getAccessToken, setAccessToken } from '@/lib/session-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  let token = getAccessToken();
  if (!token) {
    // Race condition: SessionSync hasn't run yet — fetch once and seed the store
    const session = await getSession();
    token = (session?.accessToken as string) ?? null;
    if (token) setAccessToken(token);
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Something went wrong';
    return Promise.reject(new Error(message));
  },
);
