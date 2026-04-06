import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi, type Order } from '../api/client'

const STATUS_OPTIONS: Order['status'][] = ['1 очередь', '2 очередь', '3 очередь', 'Выпущен']
const LAYOUT_OPTIONS: Order['layout_status'][] = ['Нет', 'В процессе', 'Готов', 'Утвержден']
const SAMPLE_OPTIONS: Order['sample_status'][] = ['Нет', 'Получен']

const FILTER_TABS = [
  { label: 'Все', value: '' },
  { label: '1 очередь', value: '1 очередь' },
  { label: '2 очередь', value: '2 очередь' },
  { label: '3 очередь', value: '3 очередь' },
  { label: 'Выпущен', value: 'Выпущен' },
]

function statusColor(s: Order['status']) {
  switch (s) {
    case '1 очередь': return 'bg-[var(--color-melon-100)] text-[var(--color-melon-600)]'
    case '2 очередь': return 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]'
    case '3 очередь': return 'bg-[var(--color-amaranth-100)] text-[var(--color-amaranth-500)]'
    case 'Выпущен': return 'bg-[var(--color-sage-100)] text-[var(--color-sage-700)]'
  }
}

function layoutDot(s: Order['layout_status']) {
  switch (s) {
    case 'Нет': return 'bg-[var(--color-angora-dark)]'
    case 'В процессе': return 'bg-[var(--color-melon-500)]'
    case 'Готов': return 'bg-[var(--color-marina-500)]'
    case 'Утвержден': return 'bg-[var(--color-sage-600)]'
  }
}

function sampleDot(s: Order['sample_status']) {
  return s === 'Получен' ? 'bg-[var(--color-sage-600)]' : 'bg-[var(--color-angora-dark)]'
}

function InlineDropdown<T extends string>({
  value,
  options,
  onSelect,
  renderTrigger,
}: {
  value: T
  options: T[]
  onSelect: (v: T) => void
  renderTrigger: (v: T, onClick: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {renderTrigger(value, () => setOpen(!open))}
      {open && (
        <div className="absolute z-30 mt-1 left-0 min-w-[140px] bg-white rounded-xl shadow-lg border border-[var(--color-angora-dark)] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false) }}
              className={`block w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-angora)] transition-colors ${
                opt === value ? 'text-[var(--color-rose-600)] bg-[var(--color-rose-50)]' : 'text-[var(--color-coffee-700)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await ordersApi.list(filter || undefined)
      setOrders(data)
    } catch {
      // handle error silently
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const updateOrder = async (id: number, patch: Partial<Order>) => {
    await ordersApi.update(id, patch)
    load()
  }

  const totalPrice = orders.reduce((sum, o) => sum + (o.total_price || 0), 0)
  const totalDebt = orders.reduce((sum, o) => sum + (o.client_debt || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">
            Заказы
          </h1>
          <p className="text-sm text-[var(--color-coffee-500)] mt-1">
            {orders.length} заказ(ов) на сумму {totalPrice.toLocaleString('ru-RU')} сом
          </p>
        </div>
        <Link
          to="/orders/new"
          className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 w-full sm:w-auto text-center"
        >
          + Новый заказ
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              filter === tab.value
                ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)] shadow-sm border border-[var(--color-rose-200)]'
                : 'text-[var(--color-coffee-500)] hover:bg-[var(--color-angora)] border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--color-coffee-500)]">Загрузка...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-[var(--color-coffee-500)] py-12 sm:py-16 bg-white rounded-2xl border border-[var(--color-angora-dark)]">
          Нет заказов. Создайте первый!
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-angora-dark)] bg-[var(--color-angora)]/40">
                    {['Клиент', 'Тип', 'ТР ТС', 'Плетение', 'Статус', 'Макет', 'Образец', 'ОС', 'Дата', 'Оплата', 'Действия'].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-[var(--color-coffee-600)] uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-angora-dark)]/60">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--color-onyx)] transition-colors">
                      {/* Client */}
                      <td className="px-3 py-3 font-medium text-[var(--color-coffee-800)] max-w-[180px] truncate">
                        {order.client?.company_name || `#${order.client_id}`}
                      </td>
                      {/* Doc Type */}
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          order.doc_type === 'CC'
                            ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]'
                            : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'
                        }`}>
                          {order.doc_type}
                        </span>
                      </td>
                      {/* TR TS */}
                      <td className="px-3 py-3 text-[var(--color-coffee-600)] whitespace-nowrap text-xs font-mono">
                        {order.tr_ts}
                      </td>
                      {/* Weaving */}
                      <td className="px-3 py-3 text-xs text-[var(--color-coffee-600)]">
                        {order.products?.[0]?.weaving_type || '-'}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3">
                        <InlineDropdown
                          value={order.status}
                          options={STATUS_OPTIONS}
                          onSelect={(v) => updateOrder(order.id, { status: v })}
                          renderTrigger={(v, onClick) => (
                            <button onClick={onClick} className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer hover:opacity-80 transition-opacity ${statusColor(v)}`}>
                              {v}
                            </button>
                          )}
                        />
                      </td>
                      {/* Layout */}
                      <td className="px-3 py-3">
                        <InlineDropdown
                          value={order.layout_status}
                          options={LAYOUT_OPTIONS}
                          onSelect={(v) => updateOrder(order.id, { layout_status: v })}
                          renderTrigger={(v, onClick) => (
                            <button onClick={onClick} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                              <span className={`w-2.5 h-2.5 rounded-full ${layoutDot(v)}`} />
                              <span className="text-xs text-[var(--color-coffee-600)]">{v}</span>
                            </button>
                          )}
                        />
                      </td>
                      {/* Sample */}
                      <td className="px-3 py-3">
                        <InlineDropdown
                          value={order.sample_status}
                          options={SAMPLE_OPTIONS}
                          onSelect={(v) => updateOrder(order.id, { sample_status: v })}
                          renderTrigger={(v, onClick) => (
                            <button onClick={onClick} className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                              <span className={`w-2.5 h-2.5 rounded-full ${sampleDot(v)}`} />
                              <span className="text-xs text-[var(--color-coffee-600)]">{v}</span>
                            </button>
                          )}
                        />
                      </td>
                      {/* Cert body */}
                      <td className="px-3 py-3 text-xs text-[var(--color-coffee-600)] whitespace-nowrap">
                        {order.cert_body || '-'}
                      </td>
                      {/* Date */}
                      <td className="px-3 py-3 text-xs text-[var(--color-coffee-600)] whitespace-nowrap">
                        {order.actual_date || order.expected_date || '-'}
                      </td>
                      {/* Payment */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="text-xs text-[var(--color-coffee-600)]">
                          {(order.prepayment || 0).toLocaleString('ru-RU')} / {order.total_price.toLocaleString('ru-RU')}
                        </span>
                        {(order.client_debt || 0) > 0 && (
                          <div className="text-xs font-semibold text-[var(--color-lava-500)]">
                            Долг: {order.client_debt!.toLocaleString('ru-RU')}
                          </div>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <a
                            href={ordersApi.downloadUrl(order.id, 'docx')}
                            className="text-xs font-medium text-[var(--color-marina-500)] hover:text-[var(--color-marina-700)] transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            DOCX
                          </a>
                          <a
                            href={ordersApi.downloadUrl(order.id, 'pdf')}
                            className="text-xs font-medium text-[var(--color-rose-500)] hover:text-[var(--color-rose-600)] transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-4">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--color-coffee-800)] truncate">
                      {order.client?.company_name || `Клиент #${order.client_id}`}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        order.doc_type === 'CC'
                          ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]'
                          : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'
                      }`}>
                        {order.doc_type}
                      </span>
                      <span className="text-xs text-[var(--color-coffee-500)] font-mono">{order.tr_ts}</span>
                    </div>
                  </div>
                  <InlineDropdown
                    value={order.status}
                    options={STATUS_OPTIONS}
                    onSelect={(v) => updateOrder(order.id, { status: v })}
                    renderTrigger={(v, onClick) => (
                      <button onClick={onClick} className={`text-xs px-2.5 py-1 rounded-full font-semibold cursor-pointer shrink-0 ${statusColor(v)}`}>
                        {v}
                      </button>
                    )}
                  />
                </div>

                {/* Card body grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Макет: </span>
                    <InlineDropdown
                      value={order.layout_status}
                      options={LAYOUT_OPTIONS}
                      onSelect={(v) => updateOrder(order.id, { layout_status: v })}
                      renderTrigger={(v, onClick) => (
                        <button onClick={onClick} className="inline-flex items-center gap-1 cursor-pointer">
                          <span className={`w-2 h-2 rounded-full ${layoutDot(v)}`} />
                          <span className="font-medium text-[var(--color-coffee-700)]">{v}</span>
                        </button>
                      )}
                    />
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Образец: </span>
                    <InlineDropdown
                      value={order.sample_status}
                      options={SAMPLE_OPTIONS}
                      onSelect={(v) => updateOrder(order.id, { sample_status: v })}
                      renderTrigger={(v, onClick) => (
                        <button onClick={onClick} className="inline-flex items-center gap-1 cursor-pointer">
                          <span className={`w-2 h-2 rounded-full ${sampleDot(v)}`} />
                          <span className="font-medium text-[var(--color-coffee-700)]">{v}</span>
                        </button>
                      )}
                    />
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">ОС: </span>
                    <span className="font-medium text-[var(--color-coffee-700)]">{order.cert_body || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Дата: </span>
                    <span className="font-medium text-[var(--color-coffee-700)]">{order.actual_date || order.expected_date || '-'}</span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--color-angora-dark)]/60">
                  <div>
                    <span className="text-xs text-[var(--color-coffee-500)]">
                      {(order.prepayment || 0).toLocaleString('ru-RU')} / {order.total_price.toLocaleString('ru-RU')} сом
                    </span>
                    {(order.client_debt || 0) > 0 && (
                      <span className="text-xs font-semibold text-[var(--color-lava-500)] ml-2">
                        Долг: {order.client_debt!.toLocaleString('ru-RU')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={ordersApi.downloadUrl(order.id, 'docx')}
                      className="text-xs font-medium text-[var(--color-marina-500)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      DOCX
                    </a>
                    <a
                      href={ordersApi.downloadUrl(order.id, 'pdf')}
                      className="text-xs font-medium text-[var(--color-rose-500)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      PDF
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary footer */}
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-3">
            <div className="text-sm text-[var(--color-coffee-600)]">
              Всего: <span className="font-bold text-[var(--color-coffee-800)]">{orders.length}</span> заказ(ов)
            </div>
            <div className="flex gap-4 sm:gap-6 text-sm">
              <div className="text-[var(--color-coffee-600)]">
                Сумма: <span className="font-bold text-[var(--color-coffee-800)]">{totalPrice.toLocaleString('ru-RU')} сом</span>
              </div>
              {totalDebt > 0 && (
                <div className="text-[var(--color-lava-500)]">
                  Долг: <span className="font-bold">{totalDebt.toLocaleString('ru-RU')} сом</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
