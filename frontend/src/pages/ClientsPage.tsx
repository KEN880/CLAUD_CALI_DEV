import { useState, useEffect } from 'react'
import { clientsApi, type Client } from '../api/client'

const emptyClient = {
  country_type: 'KR' as string,
  fio: '', inn: '', okpo: '', legal_address: '', workshop_address: '', phone: '', email: '',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyClient)
  const [editing, setEditing] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => clientsApi.list(search).then(setClients)
  useEffect(() => { load() }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) { await clientsApi.update(editing, form) } else { await clientsApi.create(form) }
    setForm(emptyClient); setEditing(null); setShowForm(false); load()
  }

  const startEdit = (c: Client) => {
    setForm({ country_type: c.country_type, fio: c.fio, inn: c.inn, okpo: c.okpo || '', legal_address: c.legal_address || '', workshop_address: c.workshop_address || '', phone: c.phone || '', email: c.email || '' })
    setEditing(c.id); setShowForm(true)
  }

  const handleFileUpload = async (clientId: number, file: File) => { await clientsApi.uploadCertificate(clientId, file); load() }

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--color-angora-dark)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-rose-300)] focus:border-transparent bg-white text-[var(--color-coffee-700)] placeholder:text-[var(--color-coffee-500)]/50"

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-coffee-800)] tracking-tight">Клиенты</h1>
          <p className="text-sm text-[var(--color-coffee-500)] mt-1">Управление заявителями</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyClient) }}
          className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 w-full sm:w-auto">
          {showForm ? 'Закрыть' : '+ Новый клиент'}
        </button>
      </div>

      <input type="text" placeholder="Поиск по ФИО или ИНН..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} mb-5`} />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-5 sm:p-8 mb-6 sm:mb-8">
          <h2 className="text-lg font-bold text-[var(--color-coffee-800)] mb-5">{editing ? 'Редактирование' : 'Новый клиент'}</h2>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-[var(--color-coffee-700)] mb-3">Тип ИП</label>
            <div className="grid grid-cols-2 gap-3">
              {(['KR', 'RF'] as const).map(ct => (
                <button key={ct} type="button" onClick={() => setForm({ ...form, country_type: ct })}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    form.country_type === ct ? 'border-[var(--color-rose-400)] bg-[var(--color-rose-50)] text-[var(--color-rose-600)]' : 'border-[var(--color-angora-dark)] text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
                  }`}>{ct === 'KR' ? 'ИП КР' : 'ИП РФ'}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'fio', label: 'ФИО', required: true },
              { key: 'inn', label: 'ИНН', required: true },
              { key: 'okpo', label: 'ОКПО' },
              { key: 'phone', label: 'Телефон' },
              { key: 'email', label: 'Email' },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">{field.label}</label>
                <input type="text" required={field.required} value={(form as any)[field.key]} onChange={e => setForm({ ...form, [field.key]: e.target.value })} className={inputClass} />
              </div>
            ))}
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Юр. адрес (из свидетельства)</label>
              <input type="text" value={form.legal_address} onChange={e => setForm({ ...form, legal_address: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-coffee-600)] mb-1.5">Адрес швейного цеха</label>
              <input type="text" value={form.workshop_address} onChange={e => setForm({ ...form, workshop_address: e.target.value })} className={inputClass} />
            </div>
          </div>

          <button type="submit"
            className="mt-5 bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white px-8 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200 w-full sm:w-auto">
            {editing ? 'Сохранить' : 'Создать'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {clients.map(c => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-[var(--color-angora-dark)] p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${
                    c.country_type === 'KR' ? 'bg-[var(--color-marina-100)] text-[var(--color-marina-700)]' : 'bg-[var(--color-melon-100)] text-[var(--color-melon-600)]'
                  }`}>ИП {c.country_type === 'KR' ? 'КР' : 'РФ'}</span>
                  <span className="font-semibold text-[var(--color-coffee-800)] truncate">{c.fio}</span>
                </div>
                <div className="text-sm text-[var(--color-coffee-500)] break-all">
                  ИНН: {c.inn}{c.okpo && ` | ОКПО: ${c.okpo}`}{c.phone && ` | ${c.phone}`}
                </div>
                {c.legal_address && <div className="text-sm text-[var(--color-coffee-500)]/70 mt-1 truncate">{c.legal_address}</div>}
                {c.ip_certificate_path && <div className="text-xs text-[var(--color-sage-600)] font-medium mt-1.5">Свидетельство загружено</div>}
              </div>
              <div className="flex gap-3 sm:flex-col sm:items-end shrink-0">
                <label className="text-xs text-[var(--color-marina-500)] cursor-pointer hover:text-[var(--color-marina-700)] font-medium">
                  Скан ИП <input type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(c.id, e.target.files[0])} />
                </label>
                <button onClick={() => startEdit(c)} className="text-xs text-[var(--color-rose-500)] hover:text-[var(--color-rose-600)] font-medium">Редактировать</button>
              </div>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="text-center text-[var(--color-coffee-500)] py-12 sm:py-16 bg-white rounded-2xl border border-[var(--color-angora-dark)]">Нет клиентов. Добавьте первого!</div>
        )}
      </div>
    </div>
  )
}
