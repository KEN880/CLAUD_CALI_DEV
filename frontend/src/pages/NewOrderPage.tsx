import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clientsApi,
  manufacturersApi,
  productsApi,
  ordersApi,
  calculatorApi,
  type Client,
  type Manufacturer,
  type Product,
  type CalcResult,
} from '../api/client'

const STEPS = [
  { key: 'client', label: 'Заявитель' },
  { key: 'manufacturer', label: 'Изготовитель' },
  { key: 'products', label: 'Продукция' },
  { key: 'calc', label: 'Расчёт' },
  { key: 'confirm', label: 'Подтверждение' },
]

const inputClass =
  'w-full px-3.5 py-2.5 border border-[var(--color-angora-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-rose-300)] focus:border-transparent bg-[var(--color-surface)] text-[var(--color-coffee-700)] placeholder:text-[var(--color-coffee-500)]/50'

const labelClass = 'block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5'

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 1: Client
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClient, setNewClient] = useState({
    country_type: 'KR' as 'KR' | 'RF',
    company_type: 'ИП' as 'ИП' | 'ОсОО',
    company_name: '',
    fio: '',
    inn: '',
    okpo: '',
    legal_address: '',
    workshop_address: '',
    phone: '',
    email: '',
  })

  // Step 2: Manufacturer
  const [sameAsClient, setSameAsClient] = useState(true)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [mfSearch, setMfSearch] = useState('')
  const [selectedMf, setSelectedMf] = useState<Manufacturer | null>(null)
  const [showNewMf, setShowNewMf] = useState(false)
  const [newMf, setNewMf] = useState({
    company_type: 'ОсОО',
    company_name: '',
    inn: '',
    legal_address: '',
    production_address: '',
  })

  // Step 3: Products
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])

  // Step 4: Calc
  const [protocolCount, setProtocolCount] = useState(1)
  const [docType, setDocType] = useState<'CC' | 'DC'>('CC')
  const [docTypeOverridden, setDocTypeOverridden] = useState(false)
  const [durationYears, setDurationYears] = useState<1 | 3>(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [prepayment, setPrepayment] = useState(0)
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  // Step 5: Confirm
  const [notes, setNotes] = useState('')

  // Load clients
  useEffect(() => {
    clientsApi.list(clientSearch).then(setClients)
  }, [clientSearch])

  // Load manufacturers
  useEffect(() => {
    manufacturersApi.list(mfSearch).then(setManufacturers)
  }, [mfSearch])

  // Load products
  useEffect(() => {
    productsApi.list().then(setProducts)
  }, [])

  // Auto-determine doc_type and tr_ts from selected products
  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id))
  const autoDetermined = (() => {
    if (selectedProducts.length === 0) return { doc_type: 'CC' as const, tr_ts: '017/2011' }
    const hasChild = selectedProducts.some((p) => p.target_group === 'child')
    const tr_ts = hasChild ? '007/2011' : '017/2011'
    const hasDC = selectedProducts.some((p) => p.doc_type === 'DC')
    const doc_type = hasDC ? ('DC' as const) : ('CC' as const)
    return { doc_type, tr_ts }
  })()

  // Sync auto doc_type when not overridden
  useEffect(() => {
    if (!docTypeOverridden) {
      setDocType(autoDetermined.doc_type)
    }
  }, [autoDetermined.doc_type, docTypeOverridden])

  // Calculate price
  useEffect(() => {
    if (step === 3 && selectedClient) {
      calculatorApi
        .calculate({
          country_type: selectedClient.country_type,
          doc_type: docType,
          protocol_count: protocolCount,
          duration_years: durationYears,
        })
        .then(setCalcResult)
    }
  }, [step, selectedClient, docType, protocolCount, durationYears])

  const toggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const createClient = async () => {
    const created = await clientsApi.create(newClient)
    setSelectedClient(created)
    setShowNewClient(false)
    setClients((prev) => [...prev, created])
  }

  const createManufacturer = async () => {
    const created = await manufacturersApi.create(newMf)
    setSelectedMf(created)
    setShowNewMf(false)
    setManufacturers((prev) => [...prev, created])
  }

  const canNext = () => {
    switch (step) {
      case 0: return !!selectedClient
      case 1: return sameAsClient || !!selectedMf
      case 2: return selectedProductIds.length > 0
      case 3: return calcResult?.available !== false
      default: return true
    }
  }

  const handleSubmit = async () => {
    if (!selectedClient || !calcResult) return
    setSubmitting(true)
    setError('')
    try {
      await ordersApi.create({
        client_id: selectedClient.id,
        manufacturer_id: sameAsClient ? undefined : selectedMf?.id,
        doc_type: docType,
        tr_ts: autoDetermined.tr_ts,
        duration_years: durationYears,
        protocol_count: protocolCount,
        total_price: calcResult.total_price,
        prepayment: prepayment || undefined,
        payment_method: paymentMethod || undefined,
        notes: notes || undefined,
        product_ids: selectedProductIds,
      })
      navigate('/orders')
    } catch (e: any) {
      setError(e.message || 'Ошибка при создании заказа')
    } finally {
      setSubmitting(false)
    }
  }

  const debt = (calcResult?.total_price || 0) - (prepayment || 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">
          Новый заказ
        </h1>
        <p className="text-sm text-[var(--color-coffee-500)] mt-1">Пошаговое оформление</p>
      </div>

      {/* Step Progress */}
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                i === step
                  ? 'bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white shadow-sm'
                  : i < step
                    ? 'bg-[var(--color-sage-50)] text-[var(--color-sage-700)] cursor-pointer hover:bg-[var(--color-sage-100)]'
                    : 'text-[var(--color-coffee-500)]/50 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                i === step
                  ? 'bg-[var(--color-surface)]/25 text-white'
                  : i < step
                    ? 'bg-[var(--color-sage-200)] text-[var(--color-sage-700)]'
                    : 'bg-[var(--color-angora)] text-[var(--color-coffee-500)]/50'
              }`}>
                {i < step ? '\u2713' : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8">
        {/* Step 1: Client */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-coffee-800)] mb-5">Выбор заявителя</h2>

            {!showNewClient ? (
              <>
                <input
                  type="text"
                  placeholder="Поиск по названию или ИНН..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className={`${inputClass} mb-4`}
                />
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedClient?.id === c.id
                          ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)]'
                          : 'border-[var(--color-angora-dark)] hover:bg-[var(--color-angora)]'
                      }`}
                    >
                      <div className="font-semibold text-sm text-[var(--color-coffee-800)]">{c.company_name}</div>
                      <div className="text-xs text-[var(--color-coffee-500)]">{c.fio} | ИНН: {c.inn}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowNewClient(true)}
                  className="text-sm font-semibold text-[var(--color-marina-500)] hover:text-[var(--color-marina-700)] transition-colors"
                >
                  + Создать нового клиента
                </button>
              </>
            ) : (
              <div>
                <div className="mb-4">
                  <label className={labelClass}>Тип</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['KR', 'RF'] as const).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setNewClient({ ...newClient, country_type: ct })}
                        className={`py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          newClient.country_type === ct
                            ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)] text-[var(--color-rose-600)]'
                            : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
                        }`}
                      >
                        {ct === 'KR' ? 'ИП КР' : 'ИП РФ'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>Название компании</label>
                    <input
                      type="text"
                      required
                      value={newClient.company_name}
                      onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ФИО</label>
                    <input
                      type="text"
                      required
                      value={newClient.fio}
                      onChange={(e) => setNewClient({ ...newClient, fio: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>ИНН</label>
                    <input
                      type="text"
                      required
                      value={newClient.inn}
                      onChange={(e) => setNewClient({ ...newClient, inn: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Телефон</label>
                    <input
                      type="text"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={createClient}
                    disabled={!newClient.company_name || !newClient.fio || !newClient.inn}
                    className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 disabled:opacity-50"
                  >
                    Создать
                  </button>
                  <button
                    onClick={() => setShowNewClient(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            {selectedClient && !showNewClient && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--color-sage-50)] border border-[var(--color-sage-200)]">
                <div className="text-sm font-bold text-[var(--color-sage-700)] mb-1">Выбран:</div>
                <div className="text-sm text-[var(--color-coffee-700)]">{selectedClient.company_name}</div>
                <div className="text-xs text-[var(--color-coffee-500)]">
                  {selectedClient.fio} | ИНН: {selectedClient.inn}
                  {selectedClient.phone && ` | ${selectedClient.phone}`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Manufacturer */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-coffee-800)] mb-5">Изготовитель</h2>

            <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--color-angora-dark)] hover:bg-[var(--color-angora)] transition-colors cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={sameAsClient}
                onChange={(e) => setSameAsClient(e.target.checked)}
                className="w-5 h-5 rounded border-[var(--color-angora-dark)] text-[var(--color-rose-500)] focus:ring-[var(--color-rose-300)]"
              />
              <span className="text-sm font-semibold text-[var(--color-coffee-700)]">Совпадает с заявителем</span>
            </label>

            {!sameAsClient && (
              <>
                {!showNewMf ? (
                  <>
                    <input
                      type="text"
                      placeholder="Поиск изготовителя..."
                      value={mfSearch}
                      onChange={(e) => setMfSearch(e.target.value)}
                      className={`${inputClass} mb-4`}
                    />
                    <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                      {manufacturers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMf(m)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                            selectedMf?.id === m.id
                              ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)]'
                              : 'border-[var(--color-angora-dark)] hover:bg-[var(--color-angora)]'
                          }`}
                        >
                          <div className="font-semibold text-sm text-[var(--color-coffee-800)]">{m.company_name}</div>
                          <div className="text-xs text-[var(--color-coffee-500)]">
                            {m.inn && `ИНН: ${m.inn}`}
                            {m.production_address && ` | ${m.production_address}`}
                          </div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowNewMf(true)}
                      className="text-sm font-semibold text-[var(--color-marina-500)] hover:text-[var(--color-marina-700)] transition-colors"
                    >
                      + Создать нового изготовителя
                    </button>
                  </>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className={labelClass}>Название</label>
                        <input
                          type="text"
                          required
                          value={newMf.company_name}
                          onChange={(e) => setNewMf({ ...newMf, company_name: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>ИНН</label>
                        <input
                          type="text"
                          value={newMf.inn}
                          onChange={(e) => setNewMf({ ...newMf, inn: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Юр. адрес</label>
                        <input
                          type="text"
                          value={newMf.legal_address}
                          onChange={(e) => setNewMf({ ...newMf, legal_address: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Адрес производства</label>
                        <input
                          type="text"
                          value={newMf.production_address}
                          onChange={(e) => setNewMf({ ...newMf, production_address: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={createManufacturer}
                        disabled={!newMf.company_name}
                        className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 disabled:opacity-50"
                      >
                        Создать
                      </button>
                      <button
                        onClick={() => setShowNewMf(false)}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {selectedMf && !showNewMf && (
                  <div className="mt-5 p-4 rounded-xl bg-[var(--color-sage-50)] border border-[var(--color-sage-200)]">
                    <div className="text-sm font-bold text-[var(--color-sage-700)] mb-1">Выбран:</div>
                    <div className="text-sm text-[var(--color-coffee-700)]">{selectedMf.company_name}</div>
                    <div className="text-xs text-[var(--color-coffee-500)]">
                      {selectedMf.inn && `ИНН: ${selectedMf.inn}`}
                      {selectedMf.production_address && ` | ${selectedMf.production_address}`}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Products */}
        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-coffee-800)] mb-2">Выбор продукции</h2>
            <p className="text-sm text-[var(--color-coffee-500)] mb-5">
              Отметьте продукцию для включения в заказ
            </p>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {products.map((p) => {
                const checked = selectedProductIds.includes(p.id)
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      checked
                        ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)]'
                        : 'border-[var(--color-angora-dark)] hover:bg-[var(--color-angora)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduct(p.id)}
                      className="w-5 h-5 mt-0.5 rounded border-[var(--color-angora-dark)] text-[var(--color-rose-500)] focus:ring-[var(--color-rose-300)] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-[var(--color-coffee-800)]">{p.name}</div>
                      <div className="text-xs text-[var(--color-coffee-500)] mt-0.5">
                        Арт. {p.article} | {p.weaving_type} | {p.product_type}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          p.doc_type === 'CC'
                            ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]'
                            : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'
                        }`}>
                          {p.doc_type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-angora)] text-[var(--color-coffee-600)] font-medium">
                          {p.tr_ts}
                        </span>
                        {p.requires_sgr && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-lava-100)] text-[var(--color-lava-500)] font-semibold">
                            СГР
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            {selectedProducts.length > 0 && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--color-marina-50)] border border-[var(--color-marina-200)]">
                <div className="text-sm font-bold text-[var(--color-marina-700)] mb-1">
                  Выбрано: {selectedProducts.length} продукт(ов)
                </div>
                <div className="text-xs text-[var(--color-coffee-600)]">
                  Авто-определено: {autoDetermined.doc_type} | ТР ТС {autoDetermined.tr_ts}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Calculation */}
        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-coffee-800)] mb-5">Расчёт стоимости</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Protocol count */}
              <div>
                <label className={labelClass}>Количество протоколов</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setProtocolCount(Math.max(1, protocolCount - 1))}
                    className="w-10 h-10 rounded-xl border border-[var(--color-angora-dark)] text-[var(--color-coffee-700)] font-bold text-lg hover:bg-[var(--color-angora)] transition-colors flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-lg font-bold text-[var(--color-coffee-800)] min-w-[2rem] text-center">
                    {protocolCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProtocolCount(protocolCount + 1)}
                    className="w-10 h-10 rounded-xl border border-[var(--color-angora-dark)] text-[var(--color-coffee-700)] font-bold text-lg hover:bg-[var(--color-angora)] transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Doc type */}
              <div>
                <label className={labelClass}>
                  Тип документа
                  {!docTypeOverridden && (
                    <span className="text-xs font-normal text-[var(--color-coffee-500)] ml-1">(авто)</span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['CC', 'DC'] as const).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => { setDocType(dt); setDocTypeOverridden(true) }}
                      className={`py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        docType === dt
                          ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)] text-[var(--color-rose-600)]'
                          : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
                      }`}
                    >
                      {dt === 'CC' ? 'Сертификат (CC)' : 'Декларация (DC)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className={labelClass}>Срок действия</label>
                <div className="grid grid-cols-2 gap-3">
                  {([1, 3] as const).map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setDurationYears(y)}
                      className={`py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                        durationYears === y
                          ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)] text-[var(--color-rose-600)]'
                          : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
                      }`}
                    >
                      {y} {y === 1 ? 'год' : 'года'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className={labelClass}>Способ оплаты</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Не выбран</option>
                  <option value="наличные">Наличные</option>
                  <option value="перевод">Перевод</option>
                  <option value="карта">Карта</option>
                </select>
              </div>

              {/* Prepayment */}
              <div>
                <label className={labelClass}>Предоплата (сом)</label>
                <input
                  type="number"
                  min={0}
                  value={prepayment || ''}
                  onChange={(e) => setPrepayment(Number(e.target.value))}
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Calc result */}
            {calcResult && (
              <div className={`p-5 rounded-xl border ${
                calcResult.available
                  ? 'bg-[var(--color-sage-50)] border-[var(--color-sage-200)]'
                  : 'bg-[var(--color-lava-50)] border-[var(--color-lava-500)]/30'
              }`}>
                {calcResult.available ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[var(--color-coffee-500)]">Базовая цена:</span>{' '}
                        <span className="font-bold text-[var(--color-coffee-800)]">
                          {calcResult.base_price.toLocaleString('ru-RU')} сом
                        </span>
                      </div>
                      {calcResult.extra_protocols_price > 0 && (
                        <div>
                          <span className="text-[var(--color-coffee-500)]">Доп. протоколы:</span>{' '}
                          <span className="font-bold text-[var(--color-coffee-800)]">
                            +{calcResult.extra_protocols_price.toLocaleString('ru-RU')} сом
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--color-sage-200)] flex flex-col sm:flex-row justify-between gap-2">
                      <div className="text-lg font-bold text-[var(--color-sage-700)]">
                        Итого: {calcResult.total_price.toLocaleString('ru-RU')} сом
                      </div>
                      {debt > 0 && (
                        <div className="text-sm font-bold text-[var(--color-lava-500)]">
                          Долг: {debt.toLocaleString('ru-RU')} сом
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-sm font-semibold text-[var(--color-lava-500)]">{calcResult.message}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {step === 4 && (
          <div>
            <h2 className="text-lg font-bold text-[var(--color-coffee-800)] mb-5">Подтверждение заказа</h2>

            <div className="space-y-4 mb-6">
              {/* Client */}
              <div className="p-4 rounded-xl bg-[var(--color-onyx)] border border-[var(--color-angora-dark)]">
                <div className="text-xs font-semibold text-[var(--color-coffee-500)] uppercase tracking-wider mb-1">Заявитель</div>
                <div className="text-sm font-bold text-[var(--color-coffee-800)]">{selectedClient?.company_name}</div>
                <div className="text-xs text-[var(--color-coffee-500)]">{selectedClient?.fio} | ИНН: {selectedClient?.inn}</div>
              </div>

              {/* Manufacturer */}
              <div className="p-4 rounded-xl bg-[var(--color-onyx)] border border-[var(--color-angora-dark)]">
                <div className="text-xs font-semibold text-[var(--color-coffee-500)] uppercase tracking-wider mb-1">Изготовитель</div>
                {sameAsClient ? (
                  <div className="text-sm text-[var(--color-coffee-700)]">Совпадает с заявителем</div>
                ) : (
                  <>
                    <div className="text-sm font-bold text-[var(--color-coffee-800)]">{selectedMf?.company_name}</div>
                    <div className="text-xs text-[var(--color-coffee-500)]">
                      {selectedMf?.inn && `ИНН: ${selectedMf.inn}`}
                    </div>
                  </>
                )}
              </div>

              {/* Products */}
              <div className="p-4 rounded-xl bg-[var(--color-onyx)] border border-[var(--color-angora-dark)]">
                <div className="text-xs font-semibold text-[var(--color-coffee-500)] uppercase tracking-wider mb-2">
                  Продукция ({selectedProducts.length})
                </div>
                <div className="space-y-1.5">
                  {selectedProducts.map((p) => (
                    <div key={p.id} className="text-sm text-[var(--color-coffee-700)]">
                      {p.name} <span className="text-xs text-[var(--color-coffee-500)]">({p.article})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="p-4 rounded-xl bg-[var(--color-onyx)] border border-[var(--color-angora-dark)]">
                <div className="text-xs font-semibold text-[var(--color-coffee-500)] uppercase tracking-wider mb-2">Детали</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Тип: </span>
                    <span className="font-semibold text-[var(--color-coffee-800)]">{docType}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">ТР ТС: </span>
                    <span className="font-semibold text-[var(--color-coffee-800)]">{autoDetermined.tr_ts}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Срок: </span>
                    <span className="font-semibold text-[var(--color-coffee-800)]">{durationYears} {durationYears === 1 ? 'год' : 'года'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Протоколов: </span>
                    <span className="font-semibold text-[var(--color-coffee-800)]">{protocolCount}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Итого: </span>
                    <span className="font-bold text-[var(--color-sage-700)]">
                      {(calcResult?.total_price || 0).toLocaleString('ru-RU')} сом
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-coffee-500)]">Предоплата: </span>
                    <span className="font-semibold text-[var(--color-coffee-800)]">{(prepayment || 0).toLocaleString('ru-RU')} сом</span>
                  </div>
                  {debt > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-[var(--color-lava-500)] font-bold">
                        Долг: {debt.toLocaleString('ru-RU')} сом
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelClass}>Примечания</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Дополнительная информация..."
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--color-lava-50)] border border-[var(--color-lava-500)]/30 text-sm text-[var(--color-lava-500)] font-medium">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8 pt-5 border-t border-[var(--color-angora-dark)]">
          <button
            onClick={() => step === 0 ? navigate('/orders') : setStep(step - 1)}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors border border-[var(--color-angora-dark)]"
          >
            {step === 0 ? 'Отмена' : 'Назад'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-[var(--color-sage-500)] to-[var(--color-sage-600)] text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-sage-200)] transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? 'Создание...' : 'Создать заказ'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
