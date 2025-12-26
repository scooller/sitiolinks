import type { GraphQLRequestOptions, GraphQLResponse } from '../../types';
import { BACKEND_URL } from '../../config/constants';

let csrfEnsured = false;

// Helper to get CSRF token for authenticated requests (only when missing)
export async function ensureCsrfCookie(): Promise<void> {
  if (csrfEnsured) return;
  const hasToken = document.cookie.split('; ').some(c => c.startsWith('XSRF-TOKEN='));
  if (hasToken) {
    csrfEnsured = true;
    return;
  }
  const isDev = import.meta.env.DEV;
  const base = (import.meta.env.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
  const csrfUrl = isDev ? '/sanctum/csrf-cookie' : `${base}/sanctum/csrf-cookie`;
  await fetch(csrfUrl, { credentials: 'include' });
  csrfEnsured = true;
}

export async function graphqlRequest<T = any>({ 
  query, 
  variables = {}, 
  schema = 'public', 
  authenticated = false 
}: GraphQLRequestOptions): Promise<T> {
  // Determine path fragment según el schema
  let path: string;
  if (schema === 'default') {
    path = '/graphql';
  } else if (schema === 'public') {
    path = '/graphql/public';
  } else {
    path = `/graphql/${schema}`;
  }
  const isDev = import.meta.env.DEV;
  const base = (import.meta.env.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
  const url = isDev ? path : `${base}${path}`;
  
  console.log('🔵 GraphQL Request:', {
    url,
    schema,
    authenticated,
    isDev,
    variables,
    queryPreview: query.substring(0, 100) + '...'
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Get CSRF token for authenticated requests
  if (authenticated || schema === 'default') {
    await ensureCsrfCookie(); // Asegurarse de que la cookie existe
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
    credentials: 'include', // Always include credentials for session persistence
  };

  const res = await fetch(url, options);
  
  console.log('🟢 GraphQL Response Status:', {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
    url
  });

  // Handle HTTP-level errors (e.g., 401 from middleware)
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      console.error('❌ HTTP Error Response:', data);
      // Laravel typically returns { message: 'Unauthenticated.' }
      if (data?.message) message = data.message;
    } catch {
      try {
        const text = await res.text();
        console.error('❌ HTTP Error Text:', text);
        if (text) message = text;
      } catch {}
    }
    console.error('❌ Throwing HTTP Error:', message);
    throw new Error(message);
  }

  const json: GraphQLResponse<T> = await res.json();
  
  console.log('📦 GraphQL Response Data:', {
    hasErrors: !!json.errors,
    errors: json.errors,
    dataKeys: json.data ? Object.keys(json.data) : null
  });
  
  if (json.errors) {
    const msg = json.errors.map((e) => e.message).join('; ');
    console.error('❌ GraphQL Errors COMPLETO:', JSON.stringify(json.errors, null, 2));
    console.error('❌ Mensaje de error:', msg);
    
    // Log cada error individualmente para mejor visibilidad
    json.errors.forEach((err, index) => {
      console.error(`❌ Error ${index + 1}:`, {
        message: err.message,
        extensions: err.extensions,
        path: err.path,
        locations: err.locations
      });
    });
    
    const error = new Error(msg || 'GraphQL error');
    (error as any).response = { errors: json.errors };
    throw error;
  }
  
  console.log('✅ GraphQL Request Success');
  return json.data as T;
}
