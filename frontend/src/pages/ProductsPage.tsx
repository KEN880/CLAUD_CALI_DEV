import { useState, useEffect } from 'react'
import { productsApi, type Product, type Composition } from '../api/client'

const productTypes = ['платье', 'юбка', 'брюки', 'шорты', 'футболка', 'майка', 'топ', 'рубашка', 'блузка', 'жакет', 'костюм', 'свитер', 'кардиган', 'пуловер', 'джемпер', 'водолазка', 'пальто', 'куртка', 'ветровка', 'пуховик', 'комбинезон', 'халат', 'пижама', 'леггинсы', 'боди', 'ползунки']
const materialTypes = ['трикотаж', 'текстиль']
const targetGroups = [
  { value: 'adult_female', label: 'Взрослая жен.' },
  { value: 'adult_male', label: 'Взрослая муж.' },
  { value: 'child', label: 'Детская' },
]
const ageGroups = ['до 3 лет', '3+']
const commonMaterials = ['хлопок', 'полиэстер', 'вискоза', 'шерсть', 'лён', 'шёлк', 'нейлон', 'эластан', 'акрил', 'синтетика', 'кашемир', 'бамбук']

const emptyForm = {
  article: '', name: '', product_type: 'платье', material_type: 'трикотаж',
  target_group: 'adult_female', age_group: undefined as string | undefined, layer: 1,
  compositions: [{ material_name: 'хлопок', percentage: 100 }] as Composition[],
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const load = () => productsApi.list().then(setProducts)
  useEffect(() => { load() }, [])

  const addComposition = () => setForm({ ...form, compositions: [...form.compositions, { material_name: '', percentage: 0 }] })
  const removeComposition = (i: number) => setForm({ ...form, compositions: form.compositions.filter((_, idx) => idx !== i) })
  const updateComposition = (i: number, field: keyof Composition, value: string | number) => {
    const comps = [...form.compositions]; comps[i] = { ...comps[i], [field]: value }; setForm({ ...form, compositions: comps })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const totalPct = form.compositions.reduce((s, c) => s + c.percentage, 0)
    if (Math.abs(totalPct - 100) > 0.1) { setError(`Сумма = ${totalPct}%. Должно быть 100%`); return }
    try {
      await productsApi.create({ ...form, age_group: form.target_group === 'child' ? form.age_group : undefined })
      setForm(emptyForm); setShowForm(false); load()
    } catch (err: any) { setError(err.message) }
  }

  const handleDelete = async (id: number) => { await productsApi.delete(id); load() }

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--color-angora-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-rose-300)] focus:border-transparent bg-white text-[var(--color-coffee-700)]"

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">Продукция</h1>
          <p className="text-sm text-[var(--color-coffee-500)] mt-1">Артикулы, составы и ТН ВЭД</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setForm(emptyForm) }}
          className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 w-full sm:w-auto">
          {showForm ? 'Закрыть' : '+ Добавить'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Артикул</label>
              <input required value={form.article} onChange={e => setForm({ ...form, article: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Наименование</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Тип изделия</label>
              <select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className={inputClass}>
                {productTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Тип материала</label>
              <select value={form.material_type} onChange={e => setForm({ ...form, material_type: e.target.value })} className={inputClass}>
                {materialTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Группа</label>
              <select value={form.target_group} onChange={e => setForm({ ...form, target_group: e.target.value })} className={inputClass}>
                {targetGroups.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Слой</label>
              <select value={form.layer} onChange={e => setForm({ ...form, layer: Number(e.target.value) })} className={inputClass}>
                <option value={1}>1 слой</option><option value={2}>2 слой</option><option value={3}>3 слой</option>
              </select>
            </div>
            {form.target_group === 'child' && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Возраст</label>
                <select value={form.age_group || ''} onChange={e => setForm({ ...form, age_group: e.target.value || undefined })} className={inputClass}>
                  <option value="">Не указана</option>{ageGroups.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-[var(--color-coffee-700)]">Состав</label>
              <button type="button" onClick={addComposition} className="text-xs text-[var(--color-rose-500)] hover:text-[var(--color-rose-600)] font-semibold">+ Материал</button>
            </div>
            {form.compositions.map((comp, i) => (
              <div key={i} className="flex gap-2 sm:gap-3 mb-3 items-center">
                <select value={comp.material_name} onChange={e => updateComposition(i, 'material_name', e.target.value)}
                  className={`flex-1 min-w-0 ${inputClass}`}>
                  <option value="">Выберите...</option>{commonMaterials.map(m => <option key={m}>{m}</option>)}
                </select>
                <div className="flex items-center gap-1 shrink-0">
                  <input type="number" min={0} max={100} step={0.1} value={comp.percentage}
                    onChange={e => updateComposition(i, 'percentage', Number(e.target.value))}
                    className="w-16 sm:w-20 px-2 py-2.5 border border-[var(--color-angora-dark)] rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-[var(--color-rose-300)]" />
                  <span className="text-sm text-[var(--color-coffee-500)]">%</span>
                </div>
                {form.compositions.length > 1 && (
                  <button type="button" onClick={() => removeComposition(i)} className="text-[var(--color-lava-500)] text-lg shrink-0">&times;</button>
                )}
              </div>
            ))}
            <div className="text-xs text-[var(--color-coffee-500)] mt-1">
              Итого: <span className={`font-semibold ${Math.abs(form.compositions.reduce((s, c) => s + c.percentage, 0) - 100) < 0.1 ? 'text-[var(--color-sage-600)]' : 'text-[var(--color-lava-500)]'}`}>
                {form.compositions.reduce((s, c) => s + c.percentage, 0)}%
              </span>
            </div>
          </div>

          {error && <div className="mt-4 text-sm text-[var(--color-lava-500)] bg-[var(--color-lava-50)] px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit"
            className="mt-5 bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 w-full sm:w-auto">
            Создать
          </button>
        </form>
      )}

      {/* Mobile cards + Desktop table */}
      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold text-[var(--color-coffee-800)]">{p.article}</span>
                <span className="text-[var(--color-coffee-500)] ml-2">{p.name}</span>
              </div>
              <button onClick={() => handleDelete(p.id)} className="text-[var(--color-lava-500)] text-xs font-medium shrink-0">Удалить</button>
            </div>
            <div className="text-xs text-[var(--color-coffee-500)] mb-2">{p.product_type} ({p.material_type})</div>
            <div className="text-xs text-[var(--color-coffee-500)] mb-2">
              {p.compositions.map(c => `${c.material_name} ${c.percentage}%`).join(', ')}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                p.doc_type === 'CC' ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]' : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'
              }`}>{p.doc_type === 'CC' ? 'СС' : 'ДС'}</span>
              <span className="text-xs text-[var(--color-coffee-500)]">{p.tr_ts}</span>
              {p.requires_sgr && <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-melon-100)] text-[var(--color-melon-600)] font-semibold">СГР</span>}
              <span className="font-mono text-xs text-[var(--color-coffee-500)] ml-auto">{p.tnved_code}</span>
            </div>
          </div>
        ))}
        {products.length === 0 && <div className="text-center text-[var(--color-coffee-500)] py-12 bg-white rounded-2xl border border-[var(--color-angora-dark)]">Нет продукции</div>}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-angora)]/50 text-[var(--color-coffee-600)]">
                <th className="text-left px-5 py-4 font-semibold">Артикул</th>
                <th className="text-left px-5 py-4 font-semibold">Наименование</th>
                <th className="text-left px-5 py-4 font-semibold">Тип</th>
                <th className="text-left px-5 py-4 font-semibold">Состав</th>
                <th className="text-left px-5 py-4 font-semibold">Документ</th>
                <th className="text-left px-5 py-4 font-semibold">ТН ВЭД</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-[var(--color-angora)] hover:bg-[var(--color-angora)]/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-[var(--color-coffee-800)]">{p.article}</td>
                  <td className="px-5 py-4 text-[var(--color-coffee-700)]">{p.name}</td>
                  <td className="px-5 py-4 text-[var(--color-coffee-500)]">{p.product_type}</td>
                  <td className="px-5 py-4 text-[var(--color-coffee-500)]">{p.compositions.map(c => `${c.material_name} ${c.percentage}%`).join(', ')}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${p.doc_type === 'CC' ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]' : 'bg-[var(--color-lilac-100)] text-[var(--color-lilac-500)]'}`}>{p.doc_type === 'CC' ? 'СС' : 'ДС'}</span>
                      <span className="text-xs text-[var(--color-coffee-500)]">{p.tr_ts}</span>
                      {p.requires_sgr && <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-melon-100)] text-[var(--color-melon-600)] font-semibold">СГР</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[var(--color-coffee-500)]">{p.tnved_code}</td>
                  <td className="px-5 py-4"><button onClick={() => handleDelete(p.id)} className="text-[var(--color-lava-500)] text-xs font-medium">Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && <div className="text-center text-[var(--color-coffee-500)] py-16">Нет продукции</div>}
        </div>
      </div>
    </div>
  )
}
