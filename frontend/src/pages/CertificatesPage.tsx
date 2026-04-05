import { useState, useEffect } from 'react'
import { certificatesApi, clientsApi, productsApi, type Certificate, type Client, type Product } from '../api/client'
import { calculatorApi, type CalcResult } from '../api/client'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showForm, setShowForm] = useState(false)
  const [clientId, setClientId] = useState<number>(0)
  const [docType, setDocType] = useState<'CC' | 'DC'>('CC')
  const [trTs, setTrTs] = useState('017/2011')
  const [durationYears, setDurationYears] = useState(1)
  const [protocolCount, setProtocolCount] = useState(1)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [preview, setPreview] = useState<CalcResult | null>(null)
  const [error, setError] = useState('')

  const load = () => {
    certificatesApi.list().then(setCertificates)
    clientsApi.list().then(setClients)
    productsApi.list().then(setProducts)
  }
  useEffect(() => { load() }, [])

  const selectedClient = clients.find(c => c.id === clientId)

  useEffect(() => {
    if (!selectedClient) return
    calculatorApi.calculate({ country_type: selectedClient.country_type, doc_type: docType, protocol_count: protocolCount, duration_years: durationYears }).then(setPreview)
  }, [clientId, docType, protocolCount, durationYears, selectedClient])

  useEffect(() => { if (selectedClient?.country_type === 'RF') setDocType('CC') }, [selectedClient])
  useEffect(() => { if (docType === 'CC') setDurationYears(1) }, [docType])

  const toggleProduct = (id: number) => setSelectedProducts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    if (!clientId) { setError('Выберите клиента'); return }
    try {
      await certificatesApi.create({ client_id: clientId, doc_type: docType, tr_ts: trTs, duration_years: durationYears, protocol_count: protocolCount, product_ids: selectedProducts })
      setShowForm(false); load()
    } catch (err: any) { setError(err.message) }
  }

  const selectClass = "w-full px-4 py-2.5 border border-[var(--color-angora-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-rose-300)] bg-white text-[var(--color-coffee-700)]"

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">Сертификаты</h1>
          <p className="text-[var(--color-coffee-500)] mt-1">СС и ДС документы</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200">
          {showForm ? 'Закрыть' : '+ Создать'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-8 mb-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-2">Клиент</label>
            <select value={clientId} onChange={e => setClientId(Number(e.target.value))} className={selectClass}>
              <option value={0}>Выберите клиента...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.fio} (ИП {c.country_type === 'KR' ? 'КР' : 'РФ'}) — ИНН {c.inn}</option>)}
            </select>
          </div>

          {selectedClient && (
            <>
              <div className="flex gap-4">
                <button type="button" onClick={() => setDocType('CC')}
                  className={`flex-1 py-3 px-5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    docType === 'CC' ? 'border-[var(--color-marina-500)] bg-[var(--color-marina-50)] text-[var(--color-marina-700)]' : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)]'
                  }`}>Сертификат (СС)</button>
                <button type="button" onClick={() => setDocType('DC')} disabled={selectedClient.country_type === 'RF'}
                  className={`flex-1 py-3 px-5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    selectedClient.country_type === 'RF' ? 'border-[var(--color-angora)] text-[var(--color-coffee-500)]/40 cursor-not-allowed'
                    : docType === 'DC' ? 'border-[var(--color-lilac-400)] bg-[var(--color-lilac-50)] text-[var(--color-lilac-500)]' : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)]'
                  }`}>
                  Декларация (ДС)
                  {selectedClient.country_type === 'RF' && <span className="text-xs text-[var(--color-lava-500)] ml-1">(недоступно)</span>}
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-2">Тех. регламент</label>
                <select value={trTs} onChange={e => setTrTs(e.target.value)} className={selectClass}>
                  <option value="017/2011">ТР ТС 017/2011 (взрослая)</option>
                  <option value="007/2011">ТР ТС 007/2011 (детская)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-2">Срок</label>
                  <select value={durationYears} onChange={e => setDurationYears(Number(e.target.value))} className={selectClass}>
                    <option value={1}>1 год</option>
                    {docType === 'DC' && <option value={3}>3 года</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-2">Кол-во ПИ</label>
                  <input type="number" min={1} value={protocolCount} onChange={e => setProtocolCount(Number(e.target.value))} className={selectClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-3">Продукция</label>
                <div className="max-h-52 overflow-y-auto border border-[var(--color-angora-dark)] rounded-xl p-3 space-y-1">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--color-angora)]/50 rounded-lg cursor-pointer transition-colors">
                      <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)}
                        className="rounded border-[var(--color-angora-dark)] text-[var(--color-rose-500)] focus:ring-[var(--color-rose-300)]" />
                      <span className="text-sm text-[var(--color-coffee-700)]">{p.article} — {p.name}</span>
                      <span className="text-xs text-[var(--color-coffee-500)] ml-auto">{p.doc_type === 'CC' ? 'СС' : 'ДС'}</span>
                      {p.requires_sgr && <span className="text-xs text-[var(--color-melon-600)] font-semibold">СГР</span>}
                    </label>
                  ))}
                  {products.length === 0 && <div className="text-sm text-[var(--color-coffee-500)] text-center py-6">Сначала добавьте продукцию</div>}
                </div>
              </div>

              {preview && preview.available && (
                <div className="bg-gradient-to-br from-[var(--color-sage-50)] to-[var(--color-sage-100)] border border-[var(--color-sage-200)] rounded-xl p-6">
                  <div className="text-3xl font-bold text-[var(--color-sage-700)]">
                    {preview.total_price.toLocaleString('ru-RU')} <span className="text-lg font-medium">руб.</span>
                  </div>
                  <div className="text-sm text-[var(--color-sage-600)] mt-1">
                    Базовая: {preview.base_price.toLocaleString('ru-RU')}
                    {preview.extra_protocols_price > 0 && ` + ПИ: ${preview.extra_protocols_price.toLocaleString('ru-RU')}`}
                  </div>
                </div>
              )}
            </>
          )}

          {error && <div className="text-sm text-[var(--color-lava-500)] bg-[var(--color-lava-50)] px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit"
            className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200">
            Создать
          </button>
        </form>
      )}

      {/* List */}
      <div className="space-y-4">
        {certificates.map(cert => {
          const client = clients.find(c => c.id === cert.client_id)
          return (
            <div key={cert.id} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      cert.doc_type === 'CC' ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]' : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'
                    }`}>{cert.doc_type === 'CC' ? 'СС' : 'ДС'}</span>
                    <span className="text-xs text-[var(--color-coffee-500)]">ТР ТС {cert.tr_ts} | {cert.duration_years} г.</span>
                  </div>
                  <div className="text-sm font-semibold text-[var(--color-coffee-800)]">{client?.fio || `#${cert.client_id}`}</div>
                  <div className="text-sm text-[var(--color-coffee-500)] mt-1">
                    ПИ: {cert.protocol_count} | {cert.total_price.toLocaleString('ru-RU')} руб.
                  </div>
                  <div className="text-xs text-[var(--color-coffee-500)]/60 mt-1">{new Date(cert.created_at).toLocaleDateString('ru-RU')}</div>
                </div>
                <div className="flex gap-3">
                  <a href={certificatesApi.downloadUrl(cert.id, 'docx')}
                    className="text-xs font-semibold text-[var(--color-marina-500)] hover:text-[var(--color-marina-700)] px-3 py-1.5 rounded-lg bg-[var(--color-marina-50)] hover:bg-[var(--color-marina-100)] transition-colors">
                    DOCX
                  </a>
                  <a href={certificatesApi.downloadUrl(cert.id, 'pdf')}
                    className="text-xs font-semibold text-[var(--color-rose-500)] hover:text-[var(--color-rose-600)] px-3 py-1.5 rounded-lg bg-[var(--color-rose-50)] hover:bg-[var(--color-rose-100)] transition-colors">
                    PDF
                  </a>
                </div>
              </div>
            </div>
          )
        })}
        {certificates.length === 0 && (
          <div className="text-center text-[var(--color-coffee-500)] py-16 bg-white rounded-2xl border border-[var(--color-angora-dark)]">
            Нет сертификатов. Создайте первый!
          </div>
        )}
      </div>
    </div>
  )
}
