import type { GraphQLRequestOptions, GraphQLResponse } from '../../types';
import { BACKEND_URL } from '../../config/constants';

const isDev = import.meta.env.DEV;

let csrfEnsured = false;

// Helper to get CSRF token for authenticated requests (only when missing)
export async function ensureCsrfCookie(): Promise<void> {
  if (csrfEnsured) return;
  const hasToken = document.cookie.split('; ').some(c => c.startsWith('XSRF-TOKEN='));
  if (hasToken) {
    csrfEnsured = true;
    return;
  }
  const base = (import.meta.env.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
  const csrfUrl = isDev ? '/sanctum/csrf-cookie' : `${base}/sanctum/csrf-cookie`;
  await fetch(csrfUrl, { credentials: 'include' });
  csrfEnsured = true;
}

// Reset CSRF flag so next authenticated request re-fetches the cookie
function resetCsrfFlag(): void {
  csrfEnsured = false;
}

// Generate deterministic cache key for query and variables
function getGqlCacheKey(schema: string, query: string, variables: Record<string, any>): string {
  const normalized = `${schema}|${query.replace(/\s+/g, ' ').trim()}|${JSON.stringify(variables)}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `lp_gql_${schema}_${Math.abs(hash).toString(36)}`;
}

let lastCacheToastTime = 0;
function notifyServedFromCache(schema: string) {
  const now = Date.now();
  if (now - lastCacheToastTime > 6000) {
    lastCacheToastTime = now;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('graphql:served-from-cache', {
          detail: { schema, timestamp: now },
        })
      );
    }
  }
}

function getFromCache<T>(cacheKey: string): T | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.data !== undefined) {
      return parsed.data as T;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function saveToCache(cacheKey: string, data: any): void {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

export async function graphqlRequest<T = any>({ 
  query, 
  variables = {}, 
  schema = 'public', 
  authenticated = false 
}: GraphQLRequestOptions): Promise<T> {
  const isMutation = query.trim().startsWith('mutation');
  const cacheKey = !isMutation ? getGqlCacheKey(schema, query, variables) : null;

  // Determine path fragment según el schema
  let path: string;
  if (schema === 'default') {
    path = '/graphql';
  } else if (schema === 'public') {
    path = '/graphql/public';
  } else {
    path = `/graphql/${schema}`;
  }
  const base = (import.meta.env.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
  const url = isDev ? path : `${base}${path}`;
  
  if (isDev) {
    console.log('🔵 GraphQL Request:', {
      url,
      schema,
      authenticated,
      variables,
      queryPreview: query.substring(0, 100) + '...'
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Get CSRF token for authenticated requests
  if (authenticated || schema === 'default') {
    await ensureCsrfCookie();
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    if (token) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
  }

  const options: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    credentials: 'include',
  };

  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (networkErr: any) {
    // Fallback to cache on complete network / server drop
    if (cacheKey) {
      const cached = getFromCache<T>(cacheKey);
      if (cached) {
        if (isDev) console.warn('⚡ Network failed. Served from local cache:', cacheKey);
        notifyServedFromCache(schema);
        return cached;
      }
    }
    throw networkErr;
  }

  if (isDev) {
    console.log('🟢 GraphQL Response Status:', {
      status: res.status,
      ok: res.ok,
      url
    });
  }

  // 419: CSRF expired — reset flag so next request re-fetches the token
  if (res.status === 419) {
    resetCsrfFlag();
  }

  // Serve from cache for server errors (5xx) or auth-related errors (4xx) on queries
  if (!res.ok && cacheKey) {
    const shouldFallback = res.status >= 500 || res.status === 401 || res.status === 403 || res.status === 419;
    if (shouldFallback) {
      const cached = getFromCache<T>(cacheKey);
      if (cached) {
        if (isDev) console.warn(`⚡ HTTP ${res.status}. Served from local cache:`, cacheKey);
        notifyServedFromCache(schema);
        return cached;
      }
    }
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (isDev) console.error('❌ HTTP Error Response:', data);
      if (data?.message) message = data.message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {}
    }
    throw new Error(message);
  }

  const json: GraphQLResponse<T> = await res.json();
  
  if (isDev) {
    console.log('📦 GraphQL Response Data:', {
      hasErrors: !!json.errors,
      errors: json.errors,
      dataKeys: json.data ? Object.keys(json.data) : null
    });
  }
  
  if (json.errors) {
    const isDbOrServerError = json.errors.some((err: any) => {
      const msg = (err.message || '').toLowerCase();
      return (
        msg.includes('sqlstate') ||
        msg.includes('operation not permitted') ||
        msg.includes('server error') ||
        msg.includes('connection refused') ||
        msg.includes('connection timed out') ||
        msg.includes('base table or view not found')
      );
    });

    if (cacheKey && isDbOrServerError) {
      const cached = getFromCache<T>(cacheKey);
      if (cached) {
        if (isDev) console.warn('⚡ Database error. Fallback to local cache:', cacheKey);
        notifyServedFromCache(schema);
        return cached;
      }
    }

    const msg = json.errors.map((e) => e.message).join('; ');
    if (isDev) {
      console.error('❌ GraphQL Errors:', JSON.stringify(json.errors, null, 2));
    }
    const error = new Error(msg || 'GraphQL error');
    (error as any).response = { errors: json.errors };
    throw error;
  }
  
  if (cacheKey && json.data) {
    saveToCache(cacheKey, json.data);
  }
  return json.data as T;
}
