import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi, type Order } from '../api/client';

/* ── Column definitions ───────────────────────────────── */

interface Column {
  key: string;
  label: string;
  statusValue: Order['status'];
  borderColor: string;   // CSS var token
  bgTint: string;        // subtle background for header
}

const COLUMNS: Column[] = [
  {
    key: 'new',
    label: 'Новый',
    statusValue: 'Новый',
    borderColor: 'var(--color-melon-500)',
    bgTint: 'var(--color-melon-50)',
  },
  {
    key: 'ready',
    label: 'Готов',
    statusValue: 'Готов',
    borderColor: 'var(--color-marina-500)',
    bgTint: 'var(--color-marina-50)',
  },
  {
    key: 'wip',
    label: 'В работе',
    statusValue: 'В работе',
    borderColor: 'var(--color-lilac-400)',
    bgTint: 'var(--color-lilac-50)',
  },
  {
    key: 'done',
    label: 'Выпущен',
    statusValue: 'Выпущен',
    borderColor: 'var(--color-sage-500)',
    bgTint: 'var(--color-sage-50)',
  },
];

const NEXT_STATUS: Record<string, Order['status'] | null> = {
  'Новый': 'Готов',
  'Готов': 'В работе',
  'В работе': 'Выпущен',
  'Выпущен': null,
};

const PREV_STATUS: Record<string, Order['status'] | null> = {
  'Новый': null,
  'Готов': 'Новый',
  'В работе': 'Готов',
  'Выпущен': 'В работе',
};

/* ── Helpers ──────────────────────────────────────────── */

function formatPrice(n: number): string {
  return n.toLocaleString('ru-RU').replace(/,/g, ' ');
}

type SubStatusColor = string;

function layoutDotColor(v: Order['layout_status']): SubStatusColor {
  switch (v) {
    case 'В процессе': return 'var(--color-melon-500)';
    case 'Готов': return 'var(--color-marina-500)';
    case 'Утвержден': return 'var(--color-sage-500)';
    default: return 'var(--color-coffee-500)';
  }
}

function binaryDotColor(v: 'Нет' | 'Получен'): SubStatusColor {
  return v === 'Получен' ? 'var(--color-sage-500)' : 'var(--color-coffee-500)';
}

/* ── Sub-status dot ───────────────────────────────────── */

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span
      title={label}
      className="inline-block w-2.5 h-2.5 rounded-full cursor-help transition-transform hover:scale-125"
      style={{ backgroundColor: color }}
    />
  );
}

/* ── Card component ───────────────────────────────────── */

function OrderCard({
  order,
  onMove,
}: {
  order: Order;
  onMove: (id: number, next: Order['status']) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const next = NEXT_STATUS[order.status];
  const prev = PREV_STATUS[order.status];
  const trademark = order.products?.[0]?.trademark;

  return (
    <div
      className="rounded-2xl p-4 mb-3 cursor-pointer transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-angora-dark)',
      }}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* --- Header row --- */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className="font-bold text-sm truncate"
            style={{ color: 'var(--color-coffee-800)' }}
          >
            {order.client?.company_name ?? `#${order.client_id}`}
          </p>
          {trademark && (
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: 'var(--color-coffee-500)' }}
            >
              {trademark}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* CC / DC badge */}
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
            style={{
              backgroundColor:
                order.doc_type === 'CC'
                  ? 'var(--color-marina-500)'
                  : 'var(--color-lilac-400)',
            }}
          >
            {order.doc_type}
          </span>

          {/* Move arrows */}
          {prev && (
            <button
              title={`← ${COLUMNS.find((c) => c.statusValue === prev)?.label}`}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: 'var(--color-angora)',
                color: 'var(--color-coffee-700)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-marina-500)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-angora)';
                e.currentTarget.style.color = 'var(--color-coffee-700)';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMove(order.id, prev);
              }}
            >
              &larr;
            </button>
          )}
          {next && (
            <button
              title={`→ ${COLUMNS.find((c) => c.statusValue === next)?.label}`}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold transition-colors"
              style={{
                backgroundColor: 'var(--color-angora)',
                color: 'var(--color-coffee-700)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-rose-400)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-angora)';
                e.currentTarget.style.color = 'var(--color-coffee-700)';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onMove(order.id, next);
              }}
            >
              &rarr;
            </button>
          )}
        </div>
      </div>

      {/* --- TR TS --- */}
      <p className="text-[11px] mt-1" style={{ color: 'var(--color-coffee-500)' }}>
        TP TC {order.tr_ts}
      </p>

      {/* --- Sub-status dots --- */}
      <div className="flex items-center gap-2 mt-2">
        <StatusDot color={layoutDotColor(order.layout_status)} label={`Макет: ${order.layout_status}`} />
        <StatusDot color={binaryDotColor(order.sample_status)} label={`Образец: ${order.sample_status}`} />
        <StatusDot color={binaryDotColor(order.pi_status)} label={`ПИ: ${order.pi_status}`} />
      </div>

      {/* --- Price row --- */}
      <div className="flex items-center justify-between mt-2">
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-coffee-800)' }}
        >
          {formatPrice(order.total_price)} сом
        </span>
        {(order.client_debt ?? 0) > 0 && (
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--color-lava-500)' }}
          >
            долг {formatPrice(order.client_debt!)} сом
          </span>
        )}
      </div>

      {/* --- Expanded details --- */}
      {expanded && (
        <div
          className="mt-3 pt-3 text-xs space-y-1.5"
          style={{
            borderTop: '1px solid var(--color-angora-dark)',
            color: 'var(--color-coffee-600)',
          }}
        >
          <Detail label="Орган" value={order.cert_body} />
          <Detail label="Оригинал" value={order.original_status} />
          <Detail label="Срок" value={`${order.duration_years} г.`} />
          <Detail label="Протоколов" value={String(order.protocol_count)} />
          <Detail label="Ожидаемая дата" value={order.expected_date} />
          <Detail label="Фактич. дата" value={order.actual_date} />
          <Detail label="Предоплата" value={order.prepayment != null ? `${formatPrice(order.prepayment)} сом` : undefined} />
          <Detail label="Оплата" value={order.payment_method} />
          <Detail label="Партнер" value={order.partner} />
          {order.notes && (
            <p
              className="italic pt-1"
              style={{ color: 'var(--color-coffee-500)' }}
            >
              {order.notes}
            </p>
          )}

          {/* Products */}
          {order.products && order.products.length > 0 && (
            <div className="pt-1">
              <p className="font-semibold mb-1" style={{ color: 'var(--color-coffee-700)' }}>
                Товары:
              </p>
              {order.products.map((p) => (
                <p key={p.id} className="pl-2">
                  {p.article} — {p.name}
                </p>
              ))}
            </div>
          )}

          {/* Download buttons */}
          <div className="flex gap-2 pt-2">
            <a
              href={ordersApi.downloadUrl(order.id, 'docx')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--color-marina-100)',
                color: 'var(--color-marina-700)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              DOCX
            </a>
            <a
              href={ordersApi.downloadUrl(order.id, 'pdf')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--color-lava-50)',
                color: 'var(--color-lava-500)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              PDF
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-semibold">{label}:</span> {value}
    </p>
  );
}

/* ── Kanban column ────────────────────────────────────── */

function KanbanColumn({
  column,
  orders,
  onMove,
  collapsed,
  onToggle,
}: {
  column: Column;
  orders: Order[];
  onMove: (id: number, next: Order['status']) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col min-h-[300px] md:min-h-[70vh] md:flex-1">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-t-2xl md:cursor-default"
        style={{
          borderTop: `3px solid ${column.borderColor}`,
          backgroundColor: column.bgTint,
        }}
      >
        <span
          className="font-bold text-sm"
          style={{ color: 'var(--color-coffee-800)' }}
        >
          {column.label}
        </span>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: column.borderColor,
            color: '#fff',
          }}
        >
          {orders.length}
        </span>
      </button>

      {/* Cards container — collapsible on mobile */}
      <div
        className={`
          flex-1 overflow-y-auto px-2 py-2 rounded-b-2xl transition-all duration-300
          ${collapsed ? 'max-h-0 overflow-hidden md:max-h-none md:overflow-y-auto' : 'max-h-[2000px] md:max-h-none'}
        `}
        style={{ backgroundColor: 'var(--color-angora)' }}
      >
        {orders.length === 0 && (
          <p
            className="text-center text-xs py-8 italic"
            style={{ color: 'var(--color-coffee-500)' }}
          >
            Пусто
          </p>
        )}
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} onMove={onMove} />
        ))}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */

export default function KanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCols, setCollapsedCols] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch {
      /* demo mode or network error — keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMove = async (id: number, next: Order['status']) => {
    try {
      await ordersApi.update(id, { status: next });
      await load();
    } catch {
      /* silent */
    }
  };

  const toggleCol = (key: string) =>
    setCollapsedCols((prev) => ({ ...prev, [key]: !prev[key] }));

  /* Bucket orders by column */
  const buckets: Record<string, Order[]> = {};
  for (const col of COLUMNS) buckets[col.key] = [];
  for (const o of orders) {
    const col = COLUMNS.find((c) => c.statusValue === o.status);
    if (col) buckets[col.key].push(o);
  }

  const totalSum = orders.reduce((s, o) => s + o.total_price, 0);

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-coffee-800)' }}
          >
            Доска заказов
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-coffee-500)' }}>
            {orders.length} заказов &middot; {formatPrice(totalSum)} сом
          </p>
        </div>

        <Link
          to="/new"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          style={{
            background:
              'linear-gradient(135deg, var(--color-rose-400), var(--color-rose-600))',
          }}
        >
          + Новый заказ
        </Link>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 border-3 rounded-full animate-spin"
            style={{
              borderColor: 'var(--color-angora-dark)',
              borderTopColor: 'var(--color-rose-400)',
            }}
          />
        </div>
      )}

      {/* ── Columns grid ── */}
      {!loading && (
        <div className="flex flex-col md:flex-row gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              column={col}
              orders={buckets[col.key]}
              onMove={handleMove}
              collapsed={!!collapsedCols[col.key]}
              onToggle={() => toggleCol(col.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
