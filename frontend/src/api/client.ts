const BASE = '/api';

// Detect if we're on GitHub Pages (no backend available)
const isDemo = window.location.hostname.includes('github.io');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  if (isDemo) {
    throw new Error('DEMO_MODE');
  }
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

// --- Demo data ---
const demoClients: Client[] = [
  { id: 1, country_type: 'KR', fio: 'Айдарова Нургуль Маратовна', inn: '21708199710234', okpo: '31926471', legal_address: 'г. Бишкек, ул. Токтогула 125', workshop_address: 'г. Бишкек, ул. Жибек Жолу 55', phone: '+996 555 123 456', email: 'nurgul@example.kg' },
  { id: 2, country_type: 'RF', fio: 'Петрова Елена Сергеевна', inn: '7707049388', okpo: '00032537', legal_address: 'г. Москва, ул. Тверская 15', workshop_address: 'г. Москва, ул. Промышленная 8', phone: '+7 999 888 77 66', email: 'petrova@example.ru' },
  { id: 3, country_type: 'KR', fio: 'Бакирова Жамиля Кенешовна', inn: '11504200110089', okpo: '29847165', legal_address: 'г. Ош, ул. Ленина 42', workshop_address: 'г. Ош, ул. Навои 10', phone: '+996 770 987 654', email: 'jamilya@example.kg' },
];

const demoProducts: Product[] = [
  { id: 1, article: 'PL-2024-001', name: 'Платье летнее "Акация"', product_type: 'платье', material_type: 'трикотаж', target_group: 'adult_female', layer: 1, compositions: [{ id: 1, material_name: 'хлопок', percentage: 80 }, { id: 2, material_name: 'эластан', percentage: 20 }], doc_type: 'CC', tr_ts: '017/2011', requires_sgr: false, tnved_code: '6104 42' },
  { id: 2, article: 'YB-2024-015', name: 'Юбка "Марина"', product_type: 'юбка', material_type: 'текстиль', target_group: 'adult_female', layer: 1, compositions: [{ id: 3, material_name: 'полиэстер', percentage: 65 }, { id: 4, material_name: 'вискоза', percentage: 35 }], doc_type: 'CC', tr_ts: '017/2011', requires_sgr: false, tnved_code: '6204 43' },
  { id: 3, article: 'BR-2024-022', name: 'Брюки мужские классические', product_type: 'брюки', material_type: 'текстиль', target_group: 'adult_male', layer: 2, compositions: [{ id: 5, material_name: 'шерсть', percentage: 55 }, { id: 6, material_name: 'полиэстер', percentage: 45 }], doc_type: 'DC', tr_ts: '017/2011', requires_sgr: false, tnved_code: '6203 41' },
  { id: 4, article: 'DT-2024-003', name: 'Боди детское "Малыш"', product_type: 'боди', material_type: 'трикотаж', target_group: 'child', age_group: 'до 3 лет', layer: 1, compositions: [{ id: 7, material_name: 'хлопок', percentage: 100 }], doc_type: 'CC', tr_ts: '007/2011', requires_sgr: true, tnved_code: '6114 20' },
  { id: 5, article: 'KR-2024-008', name: 'Кардиган женский оверсайз', product_type: 'кардиган', material_type: 'трикотаж', target_group: 'adult_female', layer: 2, compositions: [{ id: 8, material_name: 'акрил', percentage: 60 }, { id: 9, material_name: 'шерсть', percentage: 40 }], doc_type: 'DC', tr_ts: '017/2011', requires_sgr: false, tnved_code: '6110 30' },
];

const demoCertificates: Certificate[] = [
  { id: 1, client_id: 1, doc_type: 'CC', tr_ts: '017/2011', duration_years: 1, protocol_count: 2, total_price: 36000, status: 'completed', created_at: '2026-04-05T10:30:00', products: [demoProducts[0], demoProducts[1]] },
  { id: 2, client_id: 3, doc_type: 'DC', tr_ts: '017/2011', duration_years: 3, protocol_count: 1, total_price: 25000, status: 'draft', created_at: '2026-04-04T14:15:00', products: [demoProducts[2]] },
  { id: 3, client_id: 1, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, total_price: 30000, status: 'completed', created_at: '2026-04-03T09:00:00', products: [demoProducts[3]] },
];

// --- Interfaces ---
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

export interface CalcResult {
  base_price: number;
  extra_protocols_price: number;
  total_price: number;
  doc_type: string;
  duration_years: number;
  available: boolean;
  message?: string;
}

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

// --- API with demo fallbacks ---
export { isDemo };

export const clientsApi = {
  list: (q = '') => {
    if (isDemo) {
      const filtered = q ? demoClients.filter(c => c.fio.toLowerCase().includes(q.toLowerCase()) || c.inn.includes(q)) : demoClients;
      return Promise.resolve(filtered);
    }
    return request<Client[]>(`/clients/?q=${encodeURIComponent(q)}`);
  },
  get: (id: number) => {
    if (isDemo) return Promise.resolve(demoClients.find(c => c.id === id)!);
    return request<Client>(`/clients/${id}`);
  },
  create: (data: Omit<Client, 'id'>) => {
    if (isDemo) { const c = { ...data, id: demoClients.length + 1 } as Client; demoClients.push(c); return Promise.resolve(c); }
    return request<Client>('/clients/', { method: 'POST', body: JSON.stringify(data) });
  },
  update: (id: number, data: Omit<Client, 'id'>) => {
    if (isDemo) { const idx = demoClients.findIndex(c => c.id === id); if (idx >= 0) Object.assign(demoClients[idx], data); return Promise.resolve(demoClients[idx]); }
    return request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  uploadCertificate: async (id: number, _file: File) => {
    if (isDemo) return { path: 'demo/certificate.pdf' };
    const form = new FormData(); form.append('file', _file);
    const res = await fetch(`${BASE}/clients/${id}/upload-certificate`, { method: 'POST', body: form });
    return res.json();
  },
};

export const productsApi = {
  list: () => {
    if (isDemo) return Promise.resolve([...demoProducts]);
    return request<Product[]>('/products/');
  },
  get: (id: number) => {
    if (isDemo) return Promise.resolve(demoProducts.find(p => p.id === id)!);
    return request<Product>(`/products/${id}`);
  },
  create: (data: Omit<Product, 'id' | 'doc_type' | 'tr_ts' | 'requires_sgr' | 'tnved_code'>) => {
    if (isDemo) {
      const p = { ...data, id: demoProducts.length + 1, doc_type: 'CC', tr_ts: '017/2011', requires_sgr: false, tnved_code: '6104 42' } as Product;
      demoProducts.push(p); return Promise.resolve(p);
    }
    return request<Product>('/products/', { method: 'POST', body: JSON.stringify(data) });
  },
  delete: (id: number) => {
    if (isDemo) { const idx = demoProducts.findIndex(p => p.id === id); if (idx >= 0) demoProducts.splice(idx, 1); return Promise.resolve({ ok: true }); }
    return request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' });
  },
  batchUpload: async (file: File) => {
    if (isDemo) return Promise.resolve(demoProducts.slice(0, 3));
    const form = new FormData(); form.append('file', file);
    const res = await fetch(`${BASE}/products/batch-upload`, { method: 'POST', body: form });
    return res.json() as Promise<Product[]>;
  },
};

export const calculatorApi = {
  calculate: (data: { country_type: string; doc_type: string; protocol_count: number; duration_years: number }) => {
    if (isDemo) {
      const prices: Record<string, Record<string, number | null>> = { KR: { CC: 30000, DC: 25000 }, RF: { CC: 35000, DC: null } };
      const base = prices[data.country_type]?.[data.doc_type];
      if (base === null || base === undefined) return Promise.resolve({ base_price: 0, extra_protocols_price: 0, total_price: 0, doc_type: data.doc_type, duration_years: data.duration_years, available: false, message: 'Декларация о соответствии недоступна для заявителей из РФ' } as CalcResult);
      const extra = Math.max(0, data.protocol_count - 1) * 6000;
      return Promise.resolve({ base_price: base, extra_protocols_price: extra, total_price: base + extra, doc_type: data.doc_type, duration_years: data.doc_type === 'CC' ? 1 : data.duration_years, available: true, message: undefined } as CalcResult);
    }
    return request<CalcResult>('/calculator/', { method: 'POST', body: JSON.stringify(data) });
  },
};

export const certificatesApi = {
  list: () => {
    if (isDemo) return Promise.resolve([...demoCertificates]);
    return request<Certificate[]>('/certificates/');
  },
  create: (data: { client_id: number; doc_type: string; tr_ts: string; duration_years: number; protocol_count: number; product_ids: number[] }) => {
    if (isDemo) {
      const c: Certificate = { id: demoCertificates.length + 1, ...data, total_price: 30000, status: 'draft', created_at: new Date().toISOString(), products: [] };
      demoCertificates.push(c); return Promise.resolve(c);
    }
    return request<Certificate>('/certificates/', { method: 'POST', body: JSON.stringify(data) });
  },
  downloadUrl: (id: number, fmt: 'pdf' | 'docx') => isDemo ? '#' : `${BASE}/certificates/${id}/download/${fmt}`,
};

export const tnvedApi = {
  resolve: (data: { material_type: string; product_type: string; gender: string; main_material: string }) => {
    if (isDemo) return Promise.resolve({ code: '6104 42', description: 'Демо — запустите бэкенд для точного результата' });
    return request<{ code: string; description: string }>('/tnved/resolve', { method: 'POST', body: JSON.stringify(data) });
  },
};
