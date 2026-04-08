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
  status: 'Новый' | 'Готов' | 'В работе' | 'Выпущен';
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

// --- Demo data (from Ares Consult Excel — March 2026) ---

const demoClients: Client[] = [
  { id: 1, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Назаралиева А.', fio: 'Назаралиева А.', inn: '00000000000001' },
  { id: 2, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Жаналиева Эльвира', fio: 'Жаналиева Эльвира', inn: '00000000000002' },
  { id: 3, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Аманбекова Чолпон', fio: 'Аманбекова Чолпон', inn: '00000000000003' },
  { id: 4, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Токтошакунов Ильяс', fio: 'Токтошакунов Ильяс', inn: '00000000000004' },
  { id: 5, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Нурланбекова Айдана', fio: 'Нурланбекова Айдана', inn: '00000000000005' },
  { id: 6, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Имамидинов', fio: 'Имамидинов', inn: '00000000000006' },
  { id: 7, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Окенов Бекмырза', fio: 'Окенов Бекмырза', inn: '00000000000007' },
  { id: 8, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Дуйшонов Омурбек', fio: 'Дуйшонов Омурбек', inn: '00000000000008' },
  { id: 9, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Нуруллаев Тилек', fio: 'Нуруллаев Тилек', inn: '00000000000009' },
  { id: 10, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Аскаров Яхёбек', fio: 'Аскаров Яхёбек', inn: '00000000000010' },
  { id: 11, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Ашимова Гулмира', fio: 'Ашимова Гулмира', inn: '00000000000011' },
  { id: 12, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Зикирова (sellerkg)', fio: 'Зикирова', inn: '00000000000012' },
  { id: 13, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Анна (Thenana)', fio: 'Анна', inn: '00000000000013' },
  { id: 14, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Вероника / Рахат', fio: 'Вероника', inn: '00000000000014' },
  { id: 15, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Жанара (J&S Brand)', fio: 'Жанара', inn: '00000000000015' },
  { id: 16, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Бааридинов Иляс', fio: 'Бааридинов Иляс', inn: '00000000000016' },
  { id: 17, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Эркебаева Нуржамал', fio: 'Эркебаева Нуржамал', inn: '00000000000017' },
  { id: 18, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Калбаева Аэлита', fio: 'Калбаева Аэлита', inn: '00000000000018' },
  { id: 19, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Табылганбекова Анар', fio: 'Табылганбекова Анар', inn: '00000000000019' },
  { id: 20, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Сагынбаева Динара', fio: 'Сагынбаева Динара', inn: '00000000000020' },
  { id: 21, country_type: 'KR', company_type: 'ИП', company_name: 'ИП Акбердиева Карина', fio: 'Акбердиева Карина', inn: '00000000000021' },
  { id: 22, country_type: 'KR', company_type: 'ОсОО', company_name: 'ОсОО "Экотекс Про"', fio: 'Экотекс Про', inn: '00000000000022' },
];

const demoManufacturers: Manufacturer[] = [
  { id: 1, company_type: 'ИП', company_name: 'ИП Назаралиева А.', inn: '00000000000001' },
];

const demoProducts: Product[] = [
  { id: 1, article: 'ART-FADAMOS-1', name: 'Изделие FADAMOS (трикотаж)', product_type: 'Платье', weaving_type: 'трикотаж', target_group: 'child', layer: 2, trademark: 'FADAMOS', compositions: [{ material_name: 'Хлопок', percentage: 100 }], tnved_code: '6104 42 000 0' },
  { id: 2, article: 'ART-FADAMOS-2', name: 'Изделие FADAMOS (швейка)', product_type: 'Платье', weaving_type: 'швейка', target_group: 'child', layer: 2, trademark: 'FADAMOS', compositions: [{ material_name: 'Хлопок', percentage: 100 }], tnved_code: '6204 42 000 0' },
  { id: 3, article: 'ART-FADAMOS-3', name: 'Изделие FADAMOS (швейка 3сл)', product_type: 'Платье', weaving_type: 'швейка', target_group: 'child', layer: 3, trademark: 'FADAMOS', compositions: [{ material_name: 'Хлопок', percentage: 100 }], tnved_code: '6204 42 000 0' },
  { id: 4, article: 'ART-GK', name: 'Изделие Genius Kids', product_type: 'Платье', weaving_type: 'швейка', target_group: 'child', layer: 2, trademark: 'Genius Kids', compositions: [{ material_name: 'Хлопок', percentage: 100 }] },
  { id: 5, article: 'ART-THEN', name: 'Изделие Thenana', product_type: 'Платье', weaving_type: 'швейка', target_group: 'child', layer: 1, trademark: 'Thenana', compositions: [{ material_name: 'Хлопок', percentage: 100 }] },
  { id: 6, article: 'ART-CHARM', name: 'Изделие CHARMUSE', product_type: 'Платье', weaving_type: 'швейка', target_group: 'child', layer: 1, trademark: 'CHARMUSE', compositions: [{ material_name: 'Хлопок', percentage: 100 }] },
  { id: 7, article: 'ART-JSB', name: 'Изделие J&S Brand', product_type: 'Платье', weaving_type: 'швейка', target_group: 'child', layer: 2, trademark: 'J&S Brand', compositions: [{ material_name: 'Хлопок', percentage: 100 }] },
  { id: 8, article: 'ART-ATR', name: 'Изделие Атыргуль', product_type: 'Платье', weaving_type: 'швейка', target_group: 'adult_female', layer: 2, trademark: 'Атыргуль', compositions: [{ material_name: 'Хлопок', percentage: 100 }] },
];

const c = (id: number) => demoClients.find((cl) => cl.id === id);

const demoOrders: Order[] = [
  // === Новый (1 очередь — from Excel) ===
  { id: 1, client_id: 1, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Готов', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'Наличный', payment_date: '2026-03-05', created_at: '2026-03-01T10:00:00', client: c(1), products: [demoProducts[0]] },
  { id: 2, client_id: 1, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Готов', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'Наличный', payment_date: '2026-03-05', created_at: '2026-03-01T10:10:00', client: c(1), products: [demoProducts[1]] },
  { id: 3, client_id: 1, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Готов', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, created_at: '2026-03-01T10:20:00', client: c(1), products: [demoProducts[2]] },
  { id: 4, client_id: 2, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'Тажиниса', original_status: 'Нет', pi_status: 'Нет', expected_date: '2026-03-25', total_price: 30000, client_debt: 30000, payment_method: 'ИП', payment_date: '2026-03-23', created_at: '2026-03-02T09:00:00', client: c(2) },
  { id: 5, client_id: 3, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Утвержден', sample_status: 'Нет', cert_body: 'Тажиниса', original_status: 'Нет', pi_status: 'Нет', expected_date: '2026-03-25', total_price: 30000, client_debt: 30000, payment_method: 'ИП', payment_date: '2026-03-23', created_at: '2026-03-02T09:30:00', client: c(3), products: [demoProducts[3]] },
  { id: 6, client_id: 4, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Получен', cert_body: 'Тажиниса', original_status: 'Нет', pi_status: 'Нет', expected_date: '2026-03-30', total_price: 30000, client_debt: 30000, payment_method: 'ИП', payment_date: '2026-03-23', created_at: '2026-03-03T10:00:00', client: c(4) },
  { id: 7, client_id: 5, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 25000, client_debt: 25000, payment_method: 'ИП', payment_date: '2026-03-23', created_at: '2026-03-04T08:00:00', client: c(5) },
  { id: 8, client_id: 6, doc_type: 'DC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 25000, client_debt: 25000, payment_date: '2026-03-23', created_at: '2026-03-04T09:00:00', client: c(6) },
  { id: 9, client_id: 7, doc_type: 'CC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'ИП', payment_date: '2026-03-24', created_at: '2026-03-05T10:00:00', client: c(7) },
  { id: 10, client_id: 8, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'ИП', payment_date: '2026-03-21', created_at: '2026-03-06T10:00:00', client: c(8) },
  // 2 очередь → also Новый
  { id: 11, client_id: 9, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Готов', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, created_at: '2026-03-07T10:00:00', client: c(9) },
  { id: 12, client_id: 10, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Готов', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'ИП', payment_date: '2026-03-17', created_at: '2026-03-08T10:00:00', client: c(10) },
  { id: 13, client_id: 11, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'В процессе', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 25000, client_debt: 25000, payment_method: 'ИП', created_at: '2026-03-09T10:00:00', client: c(11) },
  { id: 14, client_id: 11, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'В процессе', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 25000, client_debt: 25000, payment_method: 'ИП', created_at: '2026-03-09T10:30:00', client: c(11) },
  { id: 15, client_id: 12, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'ИП', created_at: '2026-03-10T10:00:00', client: c(12) },
  { id: 16, client_id: 13, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'Тажиниса', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'Физлицо', created_at: '2026-03-11T10:00:00', client: c(13), products: [demoProducts[4]] },
  { id: 17, client_id: 14, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'Тажиниса', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'Физлицо', created_at: '2026-03-12T10:00:00', client: c(14), products: [demoProducts[5]] },
  { id: 18, client_id: 15, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'Наличный', payment_date: '2026-02-20', created_at: '2026-03-13T10:00:00', client: c(15), products: [demoProducts[6]] },
  { id: 19, client_id: 15, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'Нет', sample_status: 'Нет', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, created_at: '2026-03-13T10:30:00', client: c(15), products: [demoProducts[6]] },
  { id: 20, client_id: 16, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Новый', layout_status: 'В процессе', sample_status: 'Получен', original_status: 'Нет', pi_status: 'Нет', total_price: 30000, client_debt: 30000, payment_method: 'Физлицо', payment_date: '2025-12-20', created_at: '2026-03-14T10:00:00', client: c(16) },

  // === Выпущен ===
  { id: 21, client_id: 17, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'КыргызСтандарт', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-18', total_price: 25000, client_debt: 0, payment_method: 'ИП', created_at: '2026-02-15T10:00:00', client: c(17), products: [demoProducts[7]] },
  { id: 22, client_id: 17, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'КыргызСтандарт', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-18', total_price: 25000, client_debt: 0, payment_method: 'ИП', created_at: '2026-02-15T10:30:00', client: c(17) },
  { id: 23, client_id: 18, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'КыргызСтандарт', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-18', total_price: 25000, client_debt: 0, payment_method: 'Наличный', created_at: '2026-02-16T10:00:00', client: c(18) },
  { id: 24, client_id: 19, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'КыргызСтандарт', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-17', total_price: 25000, client_debt: 0, payment_method: 'ИП', created_at: '2026-02-17T10:00:00', client: c(19) },
  { id: 25, client_id: 20, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'КыргызСтандарт', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-17', total_price: 25000, client_debt: 0, payment_method: 'ИП', created_at: '2026-02-18T10:00:00', client: c(20) },
  { id: 26, client_id: 21, doc_type: 'DC', tr_ts: '017/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'КыргызСтандарт', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-17', total_price: 25000, client_debt: 0, payment_method: 'ИП', created_at: '2026-02-19T10:00:00', client: c(21) },
  { id: 27, client_id: 22, doc_type: 'CC', tr_ts: '007/2011', duration_years: 1, protocol_count: 1, status: 'Выпущен', layout_status: 'Утвержден', sample_status: 'Получен', cert_body: 'Амирбек', original_status: 'Нет', pi_status: 'Нет', actual_date: '2026-03-16', total_price: 30000, client_debt: 0, payment_method: 'Физлицо', created_at: '2026-02-20T10:00:00', client: c(22) },
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
        status: 'Новый',
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
    return request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
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
