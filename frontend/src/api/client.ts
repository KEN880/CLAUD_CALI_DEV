const BASE = '/api';

// Detect if we're on GitHub Pages (no backend available)
export const isDemo = window.location.hostname.includes('github.io');

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

// --- Interfaces ---

export interface Composition {
  id?: number;
  material_name: string;
  percentage: number;
}

export interface Client {
  id: number;
  country_type: 'KR' | 'RF';
  company_type: 'ИП' | 'ОсОО';
  company_name: string;
  fio: string;
  inn: string;
  okpo?: string;
  legal_address?: string;
  workshop_address?: string;
  phone?: string;
  email?: string;
  ip_certificate_path?: string;
}

export interface Manufacturer {
  id: number;
  company_type: string;
  company_name: string;
  inn?: string;
  legal_address?: string;
  production_address?: string;
}

export interface Product {
  id: number;
  article: string;
  name: string;
  product_type: string;
  weaving_type: 'трикотаж' | 'швейка';
  target_group: 'adult_male' | 'adult_female' | 'child';
  age_group?: string;
  layer: 1 | 2 | 3;
  trademark?: string;
  compositions: Composition[];
  doc_type?: string;
  tr_ts?: string;
  requires_sgr?: boolean;
  tnved_code?: string;
}

export interface Order {
  id: number;
  client_id: number;
  manufacturer_id?: number;
  doc_type: 'CC' | 'DC';
  tr_ts: string;
  duration_years: number;
  protocol_count: number;
  status: '1 очередь' | '2 очередь' | '3 очередь' | 'Выпущен';
  layout_status: 'Нет' | 'В процессе' | 'Готов' | 'Утвержден';
  sample_status: 'Нет' | 'Получен';
  cert_body?: string;
  original_status: 'Нет' | 'У нас' | 'Вручили' | 'Скан';
  pi_status: 'Нет' | 'Получен';
  expected_date?: string;
  actual_date?: string;
  prepayment?: number;
  payment_date?: string;
  payment_method?: string;
  total_price: number;
  client_debt?: number;
  partner?: string;
  notes?: string;
  created_at: string;
  client?: Client;
  manufacturer?: Manufacturer;
  products?: Product[];
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

// --- Demo data ---

const demoClients: Client[] = [
  {
    id: 1,
    country_type: 'KR',
    company_type: 'ИП',
    company_name: 'ИП Айдарова Н.М.',
    fio: 'Айдарова Нургуль Маратовна',
    inn: '21708199710234',
    okpo: '31926471',
    legal_address: 'г. Бишкек, ул. Токтогула 125, кв. 14',
    workshop_address: 'г. Бишкек, ул. Жибек Жолу 55',
    phone: '+996 555 123 456',
    email: 'nurgul@example.kg',
  },
  {
    id: 2,
    country_type: 'KR',
    company_type: 'ИП',
    company_name: 'ИП Эркебаева Н.К.',
    fio: 'Эркебаева Нуржамал Кубанычбековна',
    inn: '22501198800567',
    okpo: '40182735',
    legal_address: 'г. Бишкек, ул. Манаса 78, кв. 3',
    workshop_address: 'г. Бишкек, ул. Алма-Атинская 102',
    phone: '+996 700 456 789',
    email: 'nurzhamal@example.kg',
  },
  {
    id: 3,
    country_type: 'KR',
    company_type: 'ИП',
    company_name: 'ИП Бакирова Ж.К.',
    fio: 'Бакирова Жамиля Кенешовна',
    inn: '11504200110089',
    okpo: '29847165',
    legal_address: 'г. Бишкек, ул. Киевская 218, оф. 5',
    workshop_address: 'г. Бишкек, ул. Сухэ-Батора 33',
    phone: '+996 770 987 654',
    email: 'jamilya@example.kg',
  },
];

const demoManufacturers: Manufacturer[] = [
  {
    id: 1,
    company_type: 'ОсОО',
    company_name: 'ОсОО "Текстиль-Бишкек"',
    inn: '01208200910142',
    legal_address: 'г. Бишкек, ул. Промышленная 15',
    production_address: 'г. Бишкек, ул. Промышленная 15, цех 2',
  },
  {
    id: 2,
    company_type: 'ИП',
    company_name: 'ИП Султанова А.Б.',
    inn: '20905198500321',
    legal_address: 'г. Бишкек, ул. Ахунбаева 164',
    production_address: 'г. Бишкек, ул. Ахунбаева 164',
  },
];

const demoProducts: Product[] = [
  {
    id: 1,
    article: 'PL-2024-001',
    name: 'Платье летнее "Акация"',
    product_type: 'платье',
    weaving_type: 'трикотаж',
    target_group: 'adult_female',
    layer: 1,
    trademark: 'Akacia',
    compositions: [
      { id: 1, material_name: 'хлопок', percentage: 80 },
      { id: 2, material_name: 'эластан', percentage: 20 },
    ],
    doc_type: 'CC',
    tr_ts: '017/2011',
    requires_sgr: false,
    tnved_code: '6104 42 000 0',
  },
  {
    id: 2,
    article: 'YB-2024-015',
    name: 'Юбка "Марина"',
    product_type: 'юбка',
    weaving_type: 'швейка',
    target_group: 'adult_female',
    layer: 2,
    trademark: 'Marina Style',
    compositions: [
      { id: 3, material_name: 'полиэстер', percentage: 65 },
      { id: 4, material_name: 'вискоза', percentage: 35 },
    ],
    doc_type: 'DC',
    tr_ts: '017/2011',
    requires_sgr: false,
    tnved_code: '6204 43 000 0',
  },
  {
    id: 3,
    article: 'BR-2024-022',
    name: 'Брюки мужские классические',
    product_type: 'брюки',
    weaving_type: 'швейка',
    target_group: 'adult_male',
    layer: 2,
    compositions: [
      { id: 5, material_name: 'шерсть', percentage: 55 },
      { id: 6, material_name: 'полиэстер', percentage: 45 },
    ],
    doc_type: 'DC',
    tr_ts: '017/2011',
    requires_sgr: false,
    tnved_code: '6203 41 100 0',
  },
  {
    id: 4,
    article: 'DT-2024-003',
    name: 'Боди детское "Малыш"',
    product_type: 'боди',
    weaving_type: 'трикотаж',
    target_group: 'child',
    age_group: 'до 3 лет',
    layer: 1,
    trademark: 'Малыш',
    compositions: [{ id: 7, material_name: 'хлопок', percentage: 100 }],
    doc_type: 'CC',
    tr_ts: '007/2011',
    requires_sgr: true,
    tnved_code: '6114 20 000 0',
  },
  {
    id: 5,
    article: 'KR-2024-008',
    name: 'Кардиган женский оверсайз',
    product_type: 'кардиган',
    weaving_type: 'трикотаж',
    target_group: 'adult_female',
    layer: 2,
    trademark: 'Akacia',
    compositions: [
      { id: 8, material_name: 'акрил', percentage: 60 },
      { id: 9, material_name: 'шерсть', percentage: 40 },
    ],
    doc_type: 'DC',
    tr_ts: '017/2011',
    requires_sgr: false,
    tnved_code: '6110 30 100 0',
  },
];

const demoOrders: Order[] = [
  {
    id: 1,
    client_id: 1,
    manufacturer_id: 1,
    doc_type: 'CC',
    tr_ts: '017/2011',
    duration_years: 1,
    protocol_count: 2,
    status: 'Выпущен',
    layout_status: 'Утвержден',
    sample_status: 'Получен',
    cert_body: 'ОС "Тест-KG"',
    original_status: 'Вручили',
    pi_status: 'Получен',
    expected_date: '2026-03-20',
    actual_date: '2026-03-18',
    prepayment: 20000,
    payment_date: '2026-03-05',
    payment_method: 'перевод',
    total_price: 37000,
    client_debt: 0,
    notes: 'Платье + юбка, всё выдано',
    created_at: '2026-03-01T10:30:00',
    client: demoClients[0],
    manufacturer: demoManufacturers[0],
    products: [demoProducts[0], demoProducts[1]],
  },
  {
    id: 2,
    client_id: 2,
    manufacturer_id: 2,
    doc_type: 'CC',
    tr_ts: '007/2011',
    duration_years: 1,
    protocol_count: 1,
    status: '2 очередь',
    layout_status: 'Готов',
    sample_status: 'Получен',
    cert_body: 'ОС "Тест-KG"',
    original_status: 'Нет',
    pi_status: 'Нет',
    expected_date: '2026-04-15',
    prepayment: 15000,
    payment_date: '2026-03-28',
    payment_method: 'наличные',
    total_price: 30000,
    client_debt: 15000,
    partner: 'Алмаз',
    notes: 'Детское боди, ждём протокол',
    created_at: '2026-03-25T14:15:00',
    client: demoClients[1],
    manufacturer: demoManufacturers[1],
    products: [demoProducts[3]],
  },
  {
    id: 3,
    client_id: 3,
    manufacturer_id: 1,
    doc_type: 'DC',
    tr_ts: '017/2011',
    duration_years: 3,
    protocol_count: 1,
    status: '1 очередь',
    layout_status: 'В процессе',
    sample_status: 'Нет',
    original_status: 'Нет',
    pi_status: 'Нет',
    expected_date: '2026-04-25',
    prepayment: 10000,
    payment_date: '2026-04-02',
    payment_method: 'перевод',
    total_price: 25000,
    client_debt: 15000,
    notes: 'Брюки мужские, собираем документы',
    created_at: '2026-04-01T09:00:00',
    client: demoClients[2],
    manufacturer: demoManufacturers[0],
    products: [demoProducts[2]],
  },
  {
    id: 4,
    client_id: 1,
    manufacturer_id: 1,
    doc_type: 'DC',
    tr_ts: '017/2011',
    duration_years: 3,
    protocol_count: 1,
    status: '1 очередь',
    layout_status: 'Нет',
    sample_status: 'Нет',
    original_status: 'Нет',
    pi_status: 'Нет',
    expected_date: '2026-05-10',
    total_price: 25000,
    client_debt: 25000,
    notes: 'Кардиган, новая заявка',
    created_at: '2026-04-05T11:20:00',
    client: demoClients[0],
    manufacturer: demoManufacturers[0],
    products: [demoProducts[4]],
  },
  {
    id: 5,
    client_id: 2,
    manufacturer_id: 2,
    doc_type: 'CC',
    tr_ts: '017/2011',
    duration_years: 1,
    protocol_count: 1,
    status: 'Выпущен',
    layout_status: 'Утвержден',
    sample_status: 'Получен',
    cert_body: 'ОС "Тест-KG"',
    original_status: 'Скан',
    pi_status: 'Получен',
    expected_date: '2026-02-20',
    actual_date: '2026-02-22',
    prepayment: 30000,
    payment_date: '2026-02-10',
    payment_method: 'наличные',
    total_price: 30000,
    client_debt: 0,
    created_at: '2026-02-05T08:45:00',
    client: demoClients[1],
    manufacturer: demoManufacturers[1],
    products: [demoProducts[0]],
  },
];

// --- Helper for demo ID generation ---
let nextId = 100;
function demoId(): number {
  return ++nextId;
}

// --- API with demo fallbacks ---

export const clientsApi = {
  list: (q = ''): Promise<Client[]> => {
    if (isDemo) {
      const filtered = q
        ? demoClients.filter(
            (c) =>
              c.fio.toLowerCase().includes(q.toLowerCase()) ||
              c.company_name.toLowerCase().includes(q.toLowerCase()) ||
              c.inn.includes(q),
          )
        : demoClients;
      return Promise.resolve([...filtered]);
    }
    return request<Client[]>(`/clients/?q=${encodeURIComponent(q)}`);
  },

  get: (id: number): Promise<Client> => {
    if (isDemo) return Promise.resolve(demoClients.find((c) => c.id === id)!);
    return request<Client>(`/clients/${id}`);
  },

  create: (data: Omit<Client, 'id'>): Promise<Client> => {
    if (isDemo) {
      const c = { ...data, id: demoId() } as Client;
      demoClients.push(c);
      return Promise.resolve(c);
    }
    return request<Client>('/clients/', { method: 'POST', body: JSON.stringify(data) });
  },

  update: (id: number, data: Partial<Omit<Client, 'id'>>): Promise<Client> => {
    if (isDemo) {
      const idx = demoClients.findIndex((c) => c.id === id);
      if (idx >= 0) Object.assign(demoClients[idx], data);
      return Promise.resolve(demoClients[idx]);
    }
    return request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  uploadCertificate: async (id: number, file: File): Promise<{ path: string }> => {
    if (isDemo) return { path: `demo/ip_certificate_${id}.pdf` };
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/clients/${id}/upload-certificate`, {
      method: 'POST',
      body: form,
    });
    return res.json();
  },
};

export const manufacturersApi = {
  list: (q = ''): Promise<Manufacturer[]> => {
    if (isDemo) {
      const filtered = q
        ? demoManufacturers.filter(
            (m) =>
              m.company_name.toLowerCase().includes(q.toLowerCase()) ||
              (m.inn && m.inn.includes(q)),
          )
        : demoManufacturers;
      return Promise.resolve([...filtered]);
    }
    return request<Manufacturer[]>(`/manufacturers/?q=${encodeURIComponent(q)}`);
  },

  create: (data: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
    if (isDemo) {
      const m = { ...data, id: demoId() } as Manufacturer;
      demoManufacturers.push(m);
      return Promise.resolve(m);
    }
    return request<Manufacturer>('/manufacturers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: (id: number, data: Partial<Omit<Manufacturer, 'id'>>): Promise<Manufacturer> => {
    if (isDemo) {
      const idx = demoManufacturers.findIndex((m) => m.id === id);
      if (idx >= 0) Object.assign(demoManufacturers[idx], data);
      return Promise.resolve(demoManufacturers[idx]);
    }
    return request<Manufacturer>(`/manufacturers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

export const productsApi = {
  list: (): Promise<Product[]> => {
    if (isDemo) return Promise.resolve([...demoProducts]);
    return request<Product[]>('/products/');
  },

  create: (data: Omit<Product, 'id'>): Promise<Product> => {
    if (isDemo) {
      const p = { ...data, id: demoId() } as Product;
      demoProducts.push(p);
      return Promise.resolve(p);
    }
    return request<Product>('/products/', { method: 'POST', body: JSON.stringify(data) });
  },

  delete: (id: number): Promise<{ ok: boolean }> => {
    if (isDemo) {
      const idx = demoProducts.findIndex((p) => p.id === id);
      if (idx >= 0) demoProducts.splice(idx, 1);
      return Promise.resolve({ ok: true });
    }
    return request<{ ok: boolean }>(`/products/${id}`, { method: 'DELETE' });
  },

  batchUpload: async (file: File): Promise<Product[]> => {
    if (isDemo) return demoProducts.slice(0, 3);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${BASE}/products/batch-upload`, { method: 'POST', body: form });
    return res.json() as Promise<Product[]>;
  },
};

export const ordersApi = {
  list: (status?: string): Promise<Order[]> => {
    if (isDemo) {
      const filtered = status
        ? demoOrders.filter((o) => o.status === status)
        : demoOrders;
      return Promise.resolve([...filtered]);
    }
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<Order[]>(`/orders/${qs}`);
  },

  create: (
    data: Omit<
      Order,
      | 'id'
      | 'status'
      | 'layout_status'
      | 'sample_status'
      | 'original_status'
      | 'pi_status'
      | 'created_at'
      | 'client'
      | 'manufacturer'
      | 'products'
    > & { product_ids: number[] },
  ): Promise<Order> => {
    if (isDemo) {
      const products = data.product_ids
        ? demoProducts.filter((p) => data.product_ids.includes(p.id))
        : [];
      const order: Order = {
        id: demoId(),
        client_id: data.client_id,
        manufacturer_id: data.manufacturer_id,
        doc_type: data.doc_type,
        tr_ts: data.tr_ts,
        duration_years: data.duration_years,
        protocol_count: data.protocol_count,
        status: '1 очередь',
        layout_status: 'Нет',
        sample_status: 'Нет',
        original_status: 'Нет',
        pi_status: 'Нет',
        total_price: data.total_price,
        client_debt: data.total_price,
        created_at: new Date().toISOString(),
        client: demoClients.find((c) => c.id === data.client_id),
        manufacturer: data.manufacturer_id
          ? demoManufacturers.find((m) => m.id === data.manufacturer_id)
          : undefined,
        products,
      };
      demoOrders.push(order);
      return Promise.resolve(order);
    }
    return request<Order>('/orders/', { method: 'POST', body: JSON.stringify(data) });
  },

  update: (id: number, data: Partial<Order>): Promise<Order> => {
    if (isDemo) {
      const idx = demoOrders.findIndex((o) => o.id === id);
      if (idx >= 0) Object.assign(demoOrders[idx], data);
      return Promise.resolve(demoOrders[idx]);
    }
    return request<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  downloadUrl: (id: number, fmt: 'pdf' | 'docx'): string =>
    isDemo ? '#' : `${BASE}/orders/${id}/download/${fmt}`,
};

export const calculatorApi = {
  calculate: (data: {
    country_type: string;
    doc_type: string;
    protocol_count: number;
    duration_years: number;
  }): Promise<CalcResult> => {
    if (isDemo) {
      const prices: Record<string, Record<string, number | null>> = {
        KR: { CC: 30000, DC: 25000 },
        RF: { CC: 35000, DC: null },
      };
      const base = prices[data.country_type]?.[data.doc_type];
      if (base === null || base === undefined) {
        return Promise.resolve({
          base_price: 0,
          extra_protocols_price: 0,
          total_price: 0,
          doc_type: data.doc_type,
          duration_years: data.duration_years,
          available: false,
          message: 'Декларация о соответствии недоступна для заявителей из РФ',
        });
      }
      const extra = Math.max(0, data.protocol_count - 1) * 7000;
      return Promise.resolve({
        base_price: base,
        extra_protocols_price: extra,
        total_price: base + extra,
        doc_type: data.doc_type,
        duration_years: data.duration_years,
        available: true,
      });
    }
    return request<CalcResult>('/calculator/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const tnvedApi = {
  resolve: (data: {
    material_type: string;
    product_type: string;
    gender: string;
    main_material: string;
  }): Promise<{ code: string; description: string }> => {
    if (isDemo) {
      return Promise.resolve({
        code: '6104 42 000 0',
        description: 'Демо -- запустите бэкенд для точного результата',
      });
    }
    return request<{ code: string; description: string }>('/tnved/resolve', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
