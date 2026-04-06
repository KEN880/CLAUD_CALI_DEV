import { useState, useEffect } from 'react'
import { calculatorApi, type CalcResult } from '../api/client'

export default function CalculatorPage() {
  const [countryType, setCountryType] = useState<'KR' | 'RF'>('KR')
  const [docType, setDocType] = useState<'CC' | 'DC'>('CC')
  const [protocolCount, setProtocolCount] = useState(1)
  const [durationYears, setDurationYears] = useState(1)
  const [result, setResult] = useState<CalcResult | null>(null)

  useEffect(() => { if (countryType === 'RF') setDocType('CC') }, [countryType])
  useEffect(() => { if (docType === 'CC') setDurationYears(1) }, [docType])

  useEffect(() => {
    calculatorApi
      .calculate({ country_type: countryType, doc_type: docType, protocol_count: protocolCount, duration_years: durationYears })
      .then(setResult).catch(() => {})
  }, [countryType, docType, protocolCount, durationYears])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">Калькулятор</h1>
        <p className="text-sm text-[var(--color-coffee-500)] mt-1">Расчёт стоимости сертификации</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8 space-y-6 sm:space-y-8">
        {/* Country Type */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-3">Тип заявителя</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { value: 'KR', title: 'ИП Кыргызстан', sub: 'СС 30 000 / ДС 25 000 сом' },
              { value: 'RF', title: 'ИП Россия', sub: 'Только СС 35 000 сом' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setCountryType(opt.value)}
                className={`py-3.5 px-4 sm:py-4 sm:px-5 rounded-xl border-2 text-left transition-all duration-200 ${
                  countryType === opt.value
                    ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)] shadow-sm'
                    : 'border-[var(--color-angora-dark)] hover:bg-[var(--color-angora)]'
                }`}
              >
                <div className={`text-sm font-semibold ${countryType === opt.value ? 'text-[var(--color-rose-600)]' : 'text-[var(--color-coffee-700)]'}`}>{opt.title}</div>
                <div className="text-xs mt-1 text-[var(--color-coffee-500)]">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Doc Type */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-3">Тип документа</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setDocType('CC')}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                docType === 'CC'
                  ? 'border-[var(--color-marina-500)] bg-[var(--color-marina-50)] text-[var(--color-marina-700)]'
                  : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
              }`}
            >
              Сертификат (СС)
            </button>
            <button
              onClick={() => setDocType('DC')}
              disabled={countryType === 'RF'}
              className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                countryType === 'RF'
                  ? 'border-[var(--color-angora)] bg-[var(--color-angora)] text-[var(--color-coffee-500)]/40 cursor-not-allowed'
                  : docType === 'DC'
                  ? 'border-[var(--color-lilac-400)] bg-[var(--color-lilac-50)] text-[var(--color-lilac-500)]'
                  : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
              }`}
            >
              Декларация (ДС)
              {countryType === 'RF' && <div className="text-xs mt-1 text-[var(--color-lava-500)]">Недоступно для РФ</div>}
            </button>
          </div>
        </div>

        {/* Protocol Count */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-3">Протоколы испытаний (ПИ)</label>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <button onClick={() => setProtocolCount(Math.max(1, protocolCount - 1))}
              className="w-11 h-11 rounded-xl border border-[var(--color-angora-dark)] flex items-center justify-center text-lg text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors">-</button>
            <span className="text-3xl font-bold text-[var(--color-coffee-800)] w-10 text-center tabular-nums">{protocolCount}</span>
            <button onClick={() => setProtocolCount(protocolCount + 1)}
              className="w-11 h-11 rounded-xl border border-[var(--color-angora-dark)] flex items-center justify-center text-lg text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)] transition-colors">+</button>
            {protocolCount > 1 && (
              <span className="text-sm text-[var(--color-melon-600)] font-medium">
                +{((protocolCount - 1) * 7000).toLocaleString('ru-RU')} за доп. ПИ
              </span>
            )}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-3">Срок действия</label>
          <div className="flex gap-3 items-center flex-wrap">
            <button onClick={() => setDurationYears(1)}
              className={`py-2.5 px-6 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                durationYears === 1 ? 'border-[var(--color-marina-500)] bg-[var(--color-marina-50)] text-[var(--color-marina-700)]' : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)]'
              }`}>1 год</button>
            {docType === 'DC' && (
              <button onClick={() => setDurationYears(3)}
                className={`py-2.5 px-6 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  durationYears === 3 ? 'border-[var(--color-marina-500)] bg-[var(--color-marina-50)] text-[var(--color-marina-700)]' : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)]'
                }`}>3 года</button>
            )}
            {docType === 'CC' && <span className="text-sm text-[var(--color-coffee-500)]">СС только на 1 год</span>}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-5 sm:p-8 transition-all duration-300 ${
            result.available
              ? 'bg-gradient-to-br from-[var(--color-sage-50)] to-[var(--color-sage-100)] border border-[var(--color-sage-200)]'
              : 'bg-[var(--color-lava-50)] border border-[var(--color-lava-500)]/20'
          }`}>
            {result.available ? (
              <>
                <div className="text-sm font-medium text-[var(--color-sage-600)] mb-1">Итого</div>
                <div className="text-3xl sm:text-5xl font-bold text-[var(--color-sage-700)] tracking-tight">
                  {result.total_price.toLocaleString('ru-RU')}
                  <span className="text-lg sm:text-2xl font-medium ml-1.5">сом</span>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-1 sm:gap-6 text-sm text-[var(--color-sage-600)]">
                  <span>Базовая: {result.base_price.toLocaleString('ru-RU')}</span>
                  {result.extra_protocols_price > 0 && <span>Доп. ПИ: +{result.extra_protocols_price.toLocaleString('ru-RU')}</span>}
                </div>
              </>
            ) : (
              <div className="text-[var(--color-lava-500)] font-medium">{result.message}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
