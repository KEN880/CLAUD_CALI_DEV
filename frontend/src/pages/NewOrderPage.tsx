import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clientsApi,
  manufacturersApi,
  ordersApi,
  calculatorApi,
  type Client,
  type Manufacturer,
  type CalcResult,
} from '../api/client'

/* ── Constants ── */

const inputClass =
  'w-full px-3.5 py-2.5 border border-[var(--color-angora-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-rose-300)] focus:border-transparent bg-[var(--color-surface)] text-[var(--color-coffee-700)] placeholder:text-[var(--color-coffee-500)]/50'

const labelClass = 'block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5'

const sectionTitle = 'text-lg font-bold text-[var(--color-coffee-800)] mb-4'

const PRODUCT_TYPES = [
  'платье', 'юбка', 'брюки', 'футболка', 'майка', 'боди',
  'куртка', 'пальто', 'свитер', 'кардиган', 'рубашка',
  'шорты', 'костюм', 'жилет', 'блузка', 'леггинсы',
] as const

const layerMap: Record<string, 1 | 2 | 3> = {
  'футболка': 1, 'майка': 1, 'боди': 1,
  'платье': 2, 'юбка': 2, 'брюки': 2, 'свитер': 2, 'кардиган': 2,
  'рубашка': 2, 'шорты': 2, 'костюм': 2, 'жилет': 2,
  'блузка': 2, 'леггинсы': 2,
  'куртка': 3, 'пальто': 3,
}

const CHILD_AGE_GROUPS = ['до 1 года', 'от 1 до 3 лет', 'от 3 до 7 лет', 'от 7 до 14 лет'] as const

const PAYMENT_METHODS = [
  { value: 'наличные', label: 'Наличный' },
  { value: 'перевод', label: 'Безналичный' },
  { value: 'ип', label: 'ИП' },
] as const

/* ── Helpers ── */

function determineDocType(productType: string, targetGroup: string): 'CC' | 'DC' {
  // Children always CC, layer 1 always CC, otherwise DC
  if (targetGroup === 'child') return 'CC'
  const layer = layerMap[productType] ?? 2
  return layer === 1 ? 'CC' : 'DC'
}

function determineTrTs(targetGroup: string): string {
  return targetGroup === 'child' ? '007/2011' : '017/2011'
}

function requiresSgr(targetGroup: string): boolean {
  return targetGroup === 'child'
}

/* ── Toggle Button ── */

function ToggleButton({
  active,
  onClick,
  children,
  disabled = false,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`py-2.5 px-5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
        disabled
          ? 'border-[var(--color-angora)] bg-[var(--color-angora)] text-[var(--color-coffee-500)]/40 cursor-not-allowed'
          : active
            ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)] text-[var(--color-rose-600)]'
            : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
      }`}
    >
      {children}
    </button>
  )
}

/* ── Main Component ── */

export default function NewOrderPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  /* Section 1: Client */
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showNewClient, setShowNewClient] = useState(false)
  const [savingClient, setSavingClient] = useState(false)
  const [newClient, setNewClient] = useState({
    country_type: 'KR' as 'KR' | 'RF',
    company_type: 'ИП' as 'ИП' | 'ОсОО',
    company_name: '',
    fio: '',
    inn: '',
    phone: '',
  })

  /* Section 2: Manufacturer */
  const [sameAsClient, setSameAsClient] = useState(true)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [mfSearch, setMfSearch] = useState('')
  const [selectedMf, setSelectedMf] = useState<Manufacturer | null>(null)
  const [showNewMf, setShowNewMf] = useState(false)
  const [savingMf, setSavingMf] = useState(false)
  const [newMf, setNewMf] = useState({
    company_type: 'ОсОО',
    company_name: '',
    inn: '',
    legal_address: '',
    production_address: '',
  })

  /* Section 3: Product */
  const [productType, setProductType] = useState('')
  const [weavingType, setWeavingType] = useState<'трикотаж' | 'швейка'>('трикотаж')
  const [targetGroup, setTargetGroup] = useState<'adult_female' | 'adult_male' | 'child'>('adult_female')
  const [ageGroup, setAgeGroup] = useState('')
  const [trademark, setTrademark] = useState('')

  /* Section 4: Calc */
  const [protocolCount, setProtocolCount] = useState(1)
  const [durationYears, setDurationYears] = useState<1 | 3>(1)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [prepayment, setPrepayment] = useState(0)
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  /* Section 5: Notes */
  const [notes, setNotes] = useState('')
  const [certBody, setCertBody] = useState('')

  /* ── Derived values ── */
  const layer = productType ? (layerMap[productType] ?? 2) : null
  const docType = productType ? determineDocType(productType, targetGroup) : 'CC'
  const trTs = determineTrTs(targetGroup)
  const sgrRequired = requiresSgr(targetGroup)

  /* ── Data loading ── */
  useEffect(() => {
    clientsApi.list(clientSearch).then(setClients).catch(() => {})
  }, [clientSearch])

  useEffect(() => {
    if (!sameAsClient) {
      manufacturersApi.list(mfSearch).then(setManufacturers).catch(() => {})
    }
  }, [mfSearch, sameAsClient])

  /* ── Auto-calc ── */
  const runCalc = useCallback(() => {
    if (!selectedClient || !productType) {
      setCalcResult(null)
      return
    }
    calculatorApi
      .calculate({
        country_type: selectedClient.country_type,
        doc_type: docType,
        protocol_count: protocolCount,
        duration_years: durationYears,
      })
      .then(setCalcResult)
      .catch(() => {})
  }, [selectedClient, productType, docType, protocolCount, durationYears])

  useEffect(() => { runCalc() }, [runCalc])

  /* Force CC = 1 year */
  useEffect(() => {
    if (docType === 'CC') setDurationYears(1)
  }, [docType])

  /* ── Actions ── */
  const createClient = async () => {
    setSavingClient(true)
    try {
      const created = await clientsApi.create(newClient)
      setSelectedClient(created)
      setShowNewClient(false)
      setClients((prev) => [...prev, created])
      setNewClient({ country_type: 'KR', company_type: 'ИП', company_name: '', fio: '', inn: '', phone: '' })
    } catch (e: any) {
      setError(e.message || 'Ошибка создания клиента')
    } finally {
      setSavingClient(false)
    }
  }

  const createManufacturer = async () => {
    setSavingMf(true)
    try {
      const created = await manufacturersApi.create(newMf)
      setSelectedMf(created)
      setShowNewMf(false)
      setManufacturers((prev) => [...prev, created])
      setNewMf({ company_type: 'ОсОО', company_name: '', inn: '', legal_address: '', production_address: '' })
    } catch (e: any) {
      setError(e.message || 'Ошибка создания изготовителя')
    } finally {
      setSavingMf(false)
    }
  }

  const debt = (calcResult?.total_price || 0) - (prepayment || 0)

  const canSubmit =
    !!selectedClient &&
    !!productType &&
    (sameAsClient || !!selectedMf) &&
    calcResult?.available !== false

  const handleSubmit = async () => {
    if (!canSubmit || !selectedClient || !calcResult) return
    setSubmitting(true)
    setError('')
    try {
      await ordersApi.create({
        client_id: selectedClient.id,
        manufacturer_id: sameAsClient ? undefined : selectedMf?.id,
        doc_type: docType,
        tr_ts: trTs,
        duration_years: durationYears,
        protocol_count: protocolCount,
        total_price: calcResult.total_price,
        prepayment: prepayment || undefined,
        payment_method: paymentMethod || undefined,
        cert_body: certBody || undefined,
        notes: notes || undefined,
        product_ids: [],
      })
      navigate('/')
    } catch (e: any) {
      setError(e.message || 'Ошибка при создании заказа')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Render ── */
  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">
          Новый заказ
        </h1>
        <p className="text-sm text-[var(--color-coffee-500)] mt-1">Заполните данные и нажмите "Создать заказ"</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-[var(--color-lava-50)] border border-[var(--color-lava-500)]/20 text-[var(--color-lava-500)] text-sm font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* ════════════ SECTION 1: CLIENT ════════════ */}
        <section className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8">
          <h2 className={sectionTitle}>Клиент (заявитель)</h2>

          {/* Client select */}
          {!showNewClient && (
            <>
              <input
                type="text"
                placeholder="Поиск по названию, ФИО или ИНН..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className={`${inputClass} mb-3`}
              />
              <div className="space-y-2 max-h-52 overflow-y-auto mb-3">
                {clients.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedClient(c)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedClient?.id === c.id
                        ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)]'
                        : 'border-[var(--color-angora-dark)] hover:bg-[var(--color-angora)]'
                    }`}
                  >
                    <div className="font-semibold text-sm text-[var(--color-coffee-800)]">{c.company_name}</div>
                    <div className="text-xs text-[var(--color-coffee-500)]">
                      {c.fio} | ИНН: {c.inn}
                      {c.legal_address && ` | ${c.legal_address}`}
                    </div>
                  </button>
                ))}
                {clients.length === 0 && (
                  <div className="text-sm text-[var(--color-coffee-500)] py-3 text-center">Клиенты не найдены</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="text-sm font-semibold text-[var(--color-marina-500)] hover:text-[var(--color-marina-700)] transition-colors"
              >
                + Новый клиент
              </button>
            </>
          )}

          {/* Selected client info */}
          {selectedClient && !showNewClient && (
            <div className="mt-3 p-3 rounded-xl bg-[var(--color-sage-50)] border border-[var(--color-sage-200)] text-sm text-[var(--color-sage-700)]">
              <div className="font-semibold">{selectedClient.company_name}</div>
              <div className="text-xs mt-0.5 text-[var(--color-sage-600)]">
                {selectedClient.fio} | ИНН: {selectedClient.inn}
                {selectedClient.phone && ` | ${selectedClient.phone}`}
                {selectedClient.legal_address && (
                  <span className="block mt-0.5">{selectedClient.legal_address}</span>
                )}
              </div>
            </div>
          )}

          {/* New client inline form */}
          {showNewClient && (
            <div className="border border-[var(--color-angora-dark)] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-coffee-700)]">Новый клиент</span>
                <button
                  type="button"
                  onClick={() => setShowNewClient(false)}
                  className="text-xs text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)]"
                >
                  Отмена
                </button>
              </div>
              {/* country_type */}
              <div>
                <label className={labelClass}>Страна</label>
                <div className="flex gap-2">
                  <ToggleButton active={newClient.country_type === 'KR'} onClick={() => setNewClient({ ...newClient, country_type: 'KR' })}>
                    КР
                  </ToggleButton>
                  <ToggleButton active={newClient.country_type === 'RF'} onClick={() => setNewClient({ ...newClient, country_type: 'RF' })}>
                    РФ
                  </ToggleButton>
                </div>
              </div>
              {/* company_type */}
              <div>
                <label className={labelClass}>Форма</label>
                <div className="flex gap-2">
                  <ToggleButton active={newClient.company_type === 'ИП'} onClick={() => setNewClient({ ...newClient, company_type: 'ИП' })}>
                    ИП
                  </ToggleButton>
                  <ToggleButton active={newClient.company_type === 'ОсОО'} onClick={() => setNewClient({ ...newClient, company_type: 'ОсОО' })}>
                    ОсОО
                  </ToggleButton>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Название компании *</label>
                  <input type="text" value={newClient.company_name} onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })} className={inputClass} placeholder="ИП Иванова А.Б." />
                </div>
                <div>
                  <label className={labelClass}>ФИО *</label>
                  <input type="text" value={newClient.fio} onChange={(e) => setNewClient({ ...newClient, fio: e.target.value })} className={inputClass} placeholder="Иванова Алия Бакытовна" />
                </div>
                <div>
                  <label className={labelClass}>ИНН *</label>
                  <input type="text" value={newClient.inn} onChange={(e) => setNewClient({ ...newClient, inn: e.target.value })} className={inputClass} placeholder="12345678901234" />
                </div>
                <div>
                  <label className={labelClass}>Телефон</label>
                  <input type="text" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className={inputClass} placeholder="+996 555 123 456" />
                </div>
              </div>
              <button
                type="button"
                onClick={createClient}
                disabled={savingClient || !newClient.company_name || !newClient.fio || !newClient.inn}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] hover:from-[var(--color-rose-500)] hover:to-[var(--color-rose-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {savingClient ? 'Сохранение...' : 'Сохранить клиента'}
              </button>
            </div>
          )}
        </section>

        {/* ════════════ SECTION 2: MANUFACTURER ════════════ */}
        <section className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8">
          <h2 className={sectionTitle}>Изготовитель</h2>

          <label className="flex items-center gap-2.5 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={sameAsClient}
              onChange={(e) => setSameAsClient(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-[var(--color-angora-dark)] text-[var(--color-rose-400)] focus:ring-[var(--color-rose-300)] accent-[var(--color-rose-400)]"
            />
            <span className="text-sm text-[var(--color-coffee-700)]">Совпадает с заявителем</span>
          </label>

          {!sameAsClient && (
            <>
              {!showNewMf && (
                <>
                  <input
                    type="text"
                    placeholder="Поиск изготовителя..."
                    value={mfSearch}
                    onChange={(e) => setMfSearch(e.target.value)}
                    className={`${inputClass} mb-3`}
                  />
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                    {manufacturers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
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
                          {m.legal_address && ` | ${m.legal_address}`}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewMf(true)}
                    className="text-sm font-semibold text-[var(--color-marina-500)] hover:text-[var(--color-marina-700)] transition-colors"
                  >
                    + Новый изготовитель
                  </button>
                </>
              )}

              {showNewMf && (
                <div className="border border-[var(--color-angora-dark)] rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--color-coffee-700)]">Новый изготовитель</span>
                    <button type="button" onClick={() => setShowNewMf(false)} className="text-xs text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)]">Отмена</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Название *</label>
                      <input type="text" value={newMf.company_name} onChange={(e) => setNewMf({ ...newMf, company_name: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>ИНН</label>
                      <input type="text" value={newMf.inn} onChange={(e) => setNewMf({ ...newMf, inn: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Юридический адрес</label>
                      <input type="text" value={newMf.legal_address} onChange={(e) => setNewMf({ ...newMf, legal_address: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Адрес производства</label>
                      <input type="text" value={newMf.production_address} onChange={(e) => setNewMf({ ...newMf, production_address: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={createManufacturer}
                    disabled={savingMf || !newMf.company_name}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] hover:from-[var(--color-rose-500)] hover:to-[var(--color-rose-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {savingMf ? 'Сохранение...' : 'Сохранить изготовителя'}
                  </button>
                </div>
              )}

              {selectedMf && !showNewMf && (
                <div className="mt-3 p-3 rounded-xl bg-[var(--color-sage-50)] border border-[var(--color-sage-200)] text-sm text-[var(--color-sage-700)]">
                  <div className="font-semibold">{selectedMf.company_name}</div>
                  <div className="text-xs mt-0.5 text-[var(--color-sage-600)]">
                    {selectedMf.inn && `ИНН: ${selectedMf.inn}`}
                    {selectedMf.production_address && ` | ${selectedMf.production_address}`}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ════════════ SECTION 3: PRODUCT ════════════ */}
        <section className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8">
          <h2 className={sectionTitle}>Продукция</h2>

          {/* Product type */}
          <div className="mb-5">
            <label className={labelClass}>Тип продукции *</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Выберите --</option>
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt} value={pt}>{pt.charAt(0).toUpperCase() + pt.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Auto layer display */}
          {productType && layer && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                layer === 1
                  ? 'bg-[var(--color-marina-50)] text-[var(--color-marina-700)] border border-[var(--color-marina-200)]'
                  : layer === 2
                    ? 'bg-[var(--color-lilac-50)] text-[var(--color-lilac-500)] border border-[var(--color-lilac-200)]'
                    : 'bg-[var(--color-melon-50)] text-[var(--color-melon-600)] border border-[var(--color-melon-200)]'
              }`}>
                {layer}-й слой
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                docType === 'CC'
                  ? 'bg-[var(--color-marina-50)] text-[var(--color-marina-700)] border border-[var(--color-marina-200)]'
                  : 'bg-[var(--color-lilac-50)] text-[var(--color-lilac-500)] border border-[var(--color-lilac-200)]'
              }`}>
                {docType === 'CC' ? 'Сертификат (СС)' : 'Декларация (ДС)'}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-angora)] text-[var(--color-coffee-600)] border border-[var(--color-angora-dark)]">
                ТР ТС {trTs}
              </span>
              {sgrRequired && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-lava-50)] text-[var(--color-lava-500)] border border-[var(--color-lava-500)]/20">
                  СГР обязателен
                </span>
              )}
            </div>
          )}

          {/* Weaving type */}
          <div className="mb-5">
            <label className={labelClass}>Тип переплетения</label>
            <div className="flex gap-2">
              <ToggleButton active={weavingType === 'трикотаж'} onClick={() => setWeavingType('трикотаж')}>
                Трикотаж
              </ToggleButton>
              <ToggleButton active={weavingType === 'швейка'} onClick={() => setWeavingType('швейка')}>
                Швейка
              </ToggleButton>
            </div>
          </div>

          {/* Target group */}
          <div className="mb-5">
            <label className={labelClass}>Целевая группа *</label>
            <div className="flex flex-wrap gap-2">
              <ToggleButton active={targetGroup === 'adult_female'} onClick={() => setTargetGroup('adult_female')}>
                Взрослая жен
              </ToggleButton>
              <ToggleButton active={targetGroup === 'adult_male'} onClick={() => setTargetGroup('adult_male')}>
                Взрослая муж
              </ToggleButton>
              <ToggleButton active={targetGroup === 'child'} onClick={() => setTargetGroup('child')}>
                Детская
              </ToggleButton>
            </div>
          </div>

          {/* Child age group */}
          {targetGroup === 'child' && (
            <div className="mb-5">
              <label className={labelClass}>Возрастная группа</label>
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className={inputClass}>
                <option value="">-- Выберите --</option>
                {CHILD_AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>
          )}

          {/* Trademark */}
          <div>
            <label className={labelClass}>Товарный знак</label>
            <input
              type="text"
              value={trademark}
              onChange={(e) => setTrademark(e.target.value)}
              className={inputClass}
              placeholder="Название бренда"
            />
          </div>
        </section>

        {/* ════════════ SECTION 4: CALC ════════════ */}
        <section className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8">
          <h2 className={sectionTitle}>Расчёт</h2>

          {/* Protocol count */}
          <div className="mb-5">
            <label className={labelClass}>Протоколы испытаний (ПИ)</label>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setProtocolCount(Math.max(1, protocolCount - 1))}
                className="w-11 h-11 rounded-xl border border-[var(--color-angora-dark)] flex items-center justify-center text-lg text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors"
              >
                -
              </button>
              <span className="text-3xl font-bold text-[var(--color-coffee-800)] w-10 text-center tabular-nums">
                {protocolCount}
              </span>
              <button
                type="button"
                onClick={() => setProtocolCount(protocolCount + 1)}
                className="w-11 h-11 rounded-xl border border-[var(--color-angora-dark)] flex items-center justify-center text-lg text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors"
              >
                +
              </button>
              {protocolCount > 1 && (
                <span className="text-sm text-[var(--color-melon-600)] font-medium">
                  +{((protocolCount - 1) * 7000).toLocaleString('ru-RU')} за доп. ПИ
                </span>
              )}
            </div>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <label className={labelClass}>Срок действия</label>
            <div className="flex gap-3 items-center flex-wrap">
              <ToggleButton active={durationYears === 1} onClick={() => setDurationYears(1)}>
                1 год
              </ToggleButton>
              {docType === 'DC' ? (
                <ToggleButton active={durationYears === 3} onClick={() => setDurationYears(3)}>
                  3 года
                </ToggleButton>
              ) : (
                <span className="text-sm text-[var(--color-coffee-500)]">СС только на 1 год</span>
              )}
            </div>
          </div>

          {/* Price result */}
          {calcResult && (
            <div className={`rounded-2xl p-5 sm:p-8 mb-5 transition-all duration-300 ${
              calcResult.available
                ? 'bg-gradient-to-br from-[var(--color-sage-50)] to-[var(--color-sage-100)] border border-[var(--color-sage-200)]'
                : 'bg-[var(--color-lava-50)] border border-[var(--color-lava-500)]/20'
            }`}>
              {calcResult.available ? (
                <>
                  <div className="text-sm font-medium text-[var(--color-sage-600)] mb-1">Стоимость</div>
                  <div className="text-3xl sm:text-5xl font-bold text-[var(--color-sage-700)] tracking-tight">
                    {calcResult.total_price.toLocaleString('ru-RU')}
                    <span className="text-lg sm:text-2xl font-medium ml-1.5">сом</span>
                  </div>
                  <div className="mt-3 flex flex-col sm:flex-row gap-1 sm:gap-6 text-sm text-[var(--color-sage-600)]">
                    <span>Базовая: {calcResult.base_price.toLocaleString('ru-RU')}</span>
                    {calcResult.extra_protocols_price > 0 && (
                      <span>Доп. ПИ: +{calcResult.extra_protocols_price.toLocaleString('ru-RU')}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[var(--color-lava-500)] font-medium">{calcResult.message}</div>
              )}
            </div>
          )}

          {!calcResult && selectedClient && productType && (
            <div className="mb-5 p-4 rounded-xl bg-[var(--color-angora)] text-sm text-[var(--color-coffee-500)] text-center">
              Загрузка расчёта...
            </div>
          )}

          {!selectedClient && (
            <div className="mb-5 p-4 rounded-xl bg-[var(--color-angora)] text-sm text-[var(--color-coffee-500)] text-center">
              Выберите клиента и тип продукции для расчёта
            </div>
          )}

          {/* Payment method */}
          <div className="mb-5">
            <label className={labelClass}>Способ оплаты</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <ToggleButton
                  key={pm.value}
                  active={paymentMethod === pm.value}
                  onClick={() => setPaymentMethod(paymentMethod === pm.value ? '' : pm.value)}
                >
                  {pm.label}
                </ToggleButton>
              ))}
            </div>
          </div>

          {/* Prepayment */}
          <div className="mb-5">
            <label className={labelClass}>Предоплата (сом)</label>
            <input
              type="number"
              min={0}
              value={prepayment || ''}
              onChange={(e) => setPrepayment(Number(e.target.value) || 0)}
              className={inputClass}
              placeholder="0"
            />
          </div>

          {/* Debt display */}
          {calcResult?.available && (
            <div className={`p-4 rounded-xl border text-sm font-semibold ${
              debt > 0
                ? 'bg-[var(--color-melon-50)] border-[var(--color-melon-200)] text-[var(--color-melon-600)]'
                : 'bg-[var(--color-sage-50)] border-[var(--color-sage-200)] text-[var(--color-sage-700)]'
            }`}>
              Долг: {debt.toLocaleString('ru-RU')} сом
              {debt <= 0 && ' (оплачено полностью)'}
            </div>
          )}
        </section>

        {/* ════════════ SECTION 5: NOTES ════════════ */}
        <section className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8">
          <h2 className={sectionTitle}>Примечания</h2>

          <div className="mb-4">
            <label className={labelClass}>Орган сертификации</label>
            <input
              type="text"
              value={certBody}
              onChange={(e) => setCertBody(e.target.value)}
              className={inputClass}
              placeholder='ОС "Тест-KG"'
            />
          </div>

          <div>
            <label className={labelClass}>Примечания</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} resize-y`}
              placeholder="Комментарии к заказу..."
            />
          </div>
        </section>

        {/* ════════════ SUBMIT ════════════ */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] hover:from-[var(--color-rose-500)] hover:to-[var(--color-rose-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {submitting ? 'Создание...' : 'Создать заказ'}
        </button>
      </div>
    </div>
  )
}
