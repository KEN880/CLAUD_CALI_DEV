import { useState } from 'react'
import { productsApi, type Product } from '../api/client'

export default function BatchUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpload = async () => {
    if (!file) return
    setLoading(true); setError('')
    try {
      const data = await productsApi.batchUpload(file)
      setResults(data)
    } catch (err: any) { setError(err.message || 'Ошибка загрузки') }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">Импорт</h1>
        <p className="text-[var(--color-coffee-500)] mt-1">Массовая загрузка продукции из CSV / Excel</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-8 mb-8">
        {/* Format hint */}
        <div className="bg-[var(--color-angora)]/50 rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-coffee-700)] mb-2">Формат файла</h3>
          <div className="overflow-x-auto">
            <table className="text-xs text-[var(--color-coffee-600)] w-full">
              <thead>
                <tr className="border-b border-[var(--color-angora-dark)]">
                  {['артикул', 'наименование', 'тип изделия', 'тип материала', 'группа', 'возраст', 'слой', 'состав'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold text-[var(--color-coffee-700)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2">ART-001</td>
                  <td className="px-3 py-2">Платье летнее</td>
                  <td className="px-3 py-2">платье</td>
                  <td className="px-3 py-2">трикотаж</td>
                  <td className="px-3 py-2">adult_female</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">1</td>
                  <td className="px-3 py-2">хлопок 80%, полиэстер 20%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--color-coffee-500)] mt-3">
            Группа: adult_male, adult_female, child. Возраст (для child): "до 3 лет", "3+".
          </p>
        </div>

        {/* Upload area */}
        <div className="flex items-center gap-5">
          <label className="flex-1">
            <div className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              file
                ? 'border-[var(--color-rose-300)] bg-[var(--color-rose-50)]'
                : 'border-[var(--color-angora-dark)] hover:border-[var(--color-rose-300)] hover:bg-[var(--color-rose-50)]/50'
            }`}>
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div>
                  <div className="text-sm font-semibold text-[var(--color-rose-600)]">{file.name}</div>
                  <div className="text-xs text-[var(--color-coffee-500)] mt-1">{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-[var(--color-coffee-500)]">Нажмите или перетащите файл</div>
                  <div className="text-xs text-[var(--color-coffee-500)]/60 mt-1">CSV, XLS, XLSX</div>
                </div>
              )}
            </div>
          </label>
          <button onClick={handleUpload} disabled={!file || loading}
            className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-8 py-4 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 disabled:opacity-40">
            {loading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>

        {error && <div className="mt-4 text-sm text-[var(--color-lava-500)] bg-[var(--color-lava-50)] px-4 py-3 rounded-xl">{error}</div>}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-[var(--color-sage-50)] to-[var(--color-sage-100)] border-b border-[var(--color-sage-200)]">
            <span className="text-sm font-semibold text-[var(--color-sage-700)]">Загружено: {results.length} товаров</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-angora)]/50 text-[var(--color-coffee-600)]">
                <th className="text-left px-5 py-3 font-semibold">Артикул</th>
                <th className="text-left px-5 py-3 font-semibold">Наименование</th>
                <th className="text-left px-5 py-3 font-semibold">Тип</th>
                <th className="text-left px-5 py-3 font-semibold">Документ</th>
                <th className="text-left px-5 py-3 font-semibold">ТН ВЭД</th>
              </tr>
            </thead>
            <tbody>
              {results.map(p => (
                <tr key={p.id} className="border-t border-[var(--color-angora)]">
                  <td className="px-5 py-3 font-semibold text-[var(--color-coffee-800)]">{p.article}</td>
                  <td className="px-5 py-3 text-[var(--color-coffee-700)]">{p.name}</td>
                  <td className="px-5 py-3 text-[var(--color-coffee-500)]">{p.product_type}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      p.doc_type === 'CC' ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]' : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'
                    }`}>{p.doc_type === 'CC' ? 'СС' : 'ДС'}</span>
                    {p.requires_sgr && <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-melon-100)] text-[var(--color-melon-600)] font-semibold ml-2">СГР</span>}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-[var(--color-coffee-500)]">{p.tnved_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
