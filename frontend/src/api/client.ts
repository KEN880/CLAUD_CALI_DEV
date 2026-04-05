const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Clients
export interface Client {
  id: number;
  country_type: string;
  fio: string;
  inn: string;
  okpo?: string;
  legal_address?: string;
  workshop_address?: string;
  phone?: string;
  email?: string;
  ip_certificate_path?: string;
}

export const clientsApi = {
  list: (q = '') => request<Client[]>(`/clients/?q=${encodeURIComponent(q)}`),
  get: (id: number) => request<Client>(`/clients/${id}`),
  create: (data: Omit<Client, 'id'>) => request<Client>('/clients/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Omit<Client, 'id'>) => request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadCertificate: async (id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/clients/${id}/upload-certificate`, { method: 'POST', body: form });
    return res.json();
  },
};

// Products
export interface Composition {
  id?: number;
  material_name: string;
  percentage: number;
}

export interface Product {
  id: number;
  article: string;
  name: string;
  product_type: string;
  material_type: string;
  target_group: string;
  age_group?: string;
  layer: number;
  compositions: Composition[];
  doc_type?: string;
  tr_ts?: string;
  requires_sgr?: boolean;
  tnved_code?: string;
}

export const productsApi = {
  list: () => request<Product[]>('/products/'),
  get: (id: number) => request<Product>(`/products/${id}`),
  create: (data: Omit<Product, 'id' | 'doc_type' | 'tr_ts' | 'requires_sgr' | 'tnved_code'>) =>
    request<Product>('/products/', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  batchUpload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/products/batch-upload`, { method: 'POST', body: form });
    return res.json() as Promise<Product[]>;
  },
};

// Calculator
export interface CalcResult {
  base_price: number;
  extra_protocols_price: number;
  total_price: number;
  doc_type: string;
  duration_years: number;
  available: boolean;
  message?: string;
}

export const calculatorApi = {
  calculate: (data: { country_type: string; doc_type: string; protocol_count: number; duration_years: number }) =>
    request<CalcResult>('/calculator/', { method: 'POST', body: JSON.stringify(data) }),
};

// Certificates
export interface Certificate {
  id: number;
  client_id: number;
  doc_type: string;
  tr_ts: string;
  duration_years: number;
  protocol_count: number;
  total_price: number;
  status: string;
  created_at: string;
  products: Product[];
}

export const certificatesApi = {
  list: () => request<Certificate[]>('/certificates/'),
  create: (data: {
    client_id: number;
    doc_type: string;
    tr_ts: string;
    duration_years: number;
    protocol_count: number;
    product_ids: number[];
  }) => request<Certificate>('/certificates/', { method: 'POST', body: JSON.stringify(data) }),
  downloadUrl: (id: number, fmt: 'pdf' | 'docx') => `${BASE}/certificates/${id}/download/${fmt}`,
};

// TN VED
export const tnvedApi = {
  resolve: (data: { material_type: string; product_type: string; gender: string; main_material: string }) =>
    request<{ code: string; description: string }>('/tnved/resolve', { method: 'POST', body: JSON.stringify(data) }),
};
