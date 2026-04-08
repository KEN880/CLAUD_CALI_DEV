import { useState, useEffect, useCallback } from 'react';
import { isDemo, tnvedApi } from '../api/client';

/* ── TNVED Demo Resolver ─────────────────────────────── */

interface TnvedResult {
  code: string;
  layer: number;
  trTs: string;
}

const PRODUCT_TYPES = [
  'Платье', 'Юбка', 'Брюки', 'Пиджак', 'Куртка', 'Пальто',
  'Костюм', 'Рубашка', 'Блузка', 'Джемпер', 'Кардиган',
  'Жилет', 'Боди', 'Комбинезон',
] as const;

const MATERIALS = [
  'Хлопок', 'Полиэстер', 'Шерсть', 'Шёлк', 'Синтетика', 'Смешанный',
] as const;

// Demo mapping for TNVED codes (approximate)
function resolveTnvedDemo(
  weaving: string,
  productType: string,
  gender: string,
  material: string,
): TnvedResult {
  // Base: трикотаж → 61xx, швейка → 62xx
  const base = weaving === 'Трикотаж' ? '61' : '62';

  // Gender digit pair
  let genderCode: string;
  if (gender === 'Мужской') genderCode = '03';
  else if (gender === 'Женский') genderCode = '04';
  else genderCode = '04'; // child uses same structure

  // Product type → second pair
  const productMap: Record<string, string> = {
    'Платье': '04', 'Юбка': '04', 'Блузка': '06', 'Рубашка': '05',
    'Брюки': '03', 'Пиджак': '03', 'Куртка': '01', 'Пальто': '01',
    'Костюм': '03', 'Джемпер': '10', 'Кардиган': '10', 'Жилет': '09',
    'Боди': '09', 'Комбинезон': '11',
  };
  const typeCode = productMap[productType] || '04';

  // Material → last part
  const materialMap: Record<string, string> = {
    'Хлопок': '42 000 0',
    'Полиэстер': '43 000 0',
    'Шерсть': '31 000 0',
    'Шёлк': '41 000 0',
    'Синтетика': '43 000 0',
    'Смешанный': '49 000 0',
  };
  const matCode = materialMap[material] || '49 000 0';

  // Layer auto-determination
  const outerTypes = ['Куртка', 'Пальто'];
  const innerTypes = ['Боди'];
  let layer = 2;
  if (outerTypes.includes(productType)) layer = 3;
  if (innerTypes.includes(productType)) layer = 1;

  // TR TS based on gender
  const trTs = gender === 'Детский' ? '007/2011' : '017/2011';

  const code = `${base}${typeCode} ${genderCode} ${matCode}`;
  return { code, layer, trTs };
}

/* ── Copy helper ─────────────────────────────────────── */

function useCopyState() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);
  return { copied, copy };
}

/* ── Tool 1: TNVED Calculator ────────────────────────── */

function TnvedCalculator() {
  const [weaving, setWeaving] = useState('Трикотаж');
  const [productType, setProductType] = useState('Платье');
  const [gender, setGender] = useState('Женский');
  const [material, setMaterial] = useState('Хлопок');
  const [result, setResult] = useState<TnvedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { copied, copy } = useCopyState();

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setLoading(true);
      try {
        if (isDemo) {
          const r = resolveTnvedDemo(weaving, productType, gender, material);
          if (!cancelled) setResult(r);
        } else {
          const res = await tnvedApi.resolve({
            material_type: weaving === 'Трикотаж' ? 'трикотаж' : 'швейка',
            product_type: productType,
            gender: gender === 'Мужской' ? 'male' : gender === 'Женский' ? 'female' : 'child',
            main_material: material,
          });
          if (!cancelled) {
            // Determine layer and TR TS from response
            const outerTypes = ['Куртка', 'Пальто'];
            const innerTypes = ['Боди'];
            let layer = 2;
            if (outerTypes.includes(productType)) layer = 3;
            if (innerTypes.includes(productType)) layer = 1;
            const trTs = gender === 'Детский' ? '007/2011' : '017/2011';
            setResult({ code: res.code, layer, trTs });
          }
        }
      } catch {
        if (!cancelled) {
          const r = resolveTnvedDemo(weaving, productType, gender, material);
          setResult(r);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    resolve();
    return () => { cancelled = true; };
  }, [weaving, productType, gender, material]);

  return (
    <div
      className="rounded-2xl p-6 sm:p-8"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-angora-dark)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-marina-100)' }}
        >
          <svg className="w-5 h-5" style={{ color: 'var(--color-marina-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-coffee-800)' }}>
            ТН ВЭД Калькулятор
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-coffee-500)' }}>
            Быстрый подбор 10-значного кода
          </p>
        </div>
      </div>

      {/* Form grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SelectField label="Вид плетения" value={weaving} onChange={setWeaving} options={['Трикотаж', 'Швейка']} />
        <SelectField label="Тип изделия" value={productType} onChange={setProductType} options={[...PRODUCT_TYPES]} />
        <SelectField label="Пол" value={gender} onChange={setGender} options={['Мужской', 'Женский', 'Детский']} />
        <SelectField label="Основной материал" value={material} onChange={setMaterial} options={[...MATERIALS]} />
      </div>

      {/* Result */}
      <div
        className="rounded-xl p-5 text-center"
        style={{
          backgroundColor: 'var(--color-angora)',
          border: '1px solid var(--color-angora-dark)',
        }}
      >
        {loading ? (
          <div className="flex justify-center py-2">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--color-angora-dark)', borderTopColor: 'var(--color-marina-500)' }}
            />
          </div>
        ) : result ? (
          <>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-coffee-500)' }}>
              Код ТН ВЭД
            </p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span
                className="text-2xl sm:text-3xl font-bold font-mono tracking-wider"
                style={{ color: 'var(--color-coffee-800)' }}
              >
                {result.code}
              </span>
              <button
                onClick={() => copy(result.code.replace(/\s/g, ''))}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: copied ? 'var(--color-sage-100)' : 'var(--color-marina-100)',
                  color: copied ? 'var(--color-sage-600)' : 'var(--color-marina-600)',
                }}
              >
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--color-coffee-600)' }}>
              <span>Слой: <strong>{result.layer}</strong></span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-angora-dark)' }} />
              <span>ТР ТС: <strong>{result.trTs}</strong></span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ── Tool 2: Maket Generator (CC & DC) ───────────────── */

interface MaketForm {
  // Doc type
  docType: 'DC' | 'CC';
  // Applicant
  applicantType: 'ИП' | 'ОсОО';
  applicantName: string;
  applicantInn: string;
  applicantOkpo: string;
  applicantAddress: string;
  applicantPhone: string;
  applicantEmail: string;
  // Manufacturer
  sameAsApplicant: boolean;
  manufacturerType: 'ИП' | 'ОсОО';
  manufacturerName: string;
  manufacturerInn: string;
  manufacturerAddress: string;
  manufacturerProductionAddress: string;
  // Product
  productWeaving: string;
  productLayer: string;
  productGender: string;
  productMaterial: string;
  productTrademarks: string;
  productList: string;
  tnvedCodes: string;
  // Document
  trTs: string;
  protocolNumber: string;
  declarationScheme: string;
  validUntil: string;
}

const initialMaketForm: MaketForm = {
  docType: 'DC',
  applicantType: 'ИП',
  applicantName: '',
  applicantInn: '',
  applicantOkpo: '',
  applicantAddress: '',
  applicantPhone: '',
  applicantEmail: '',
  sameAsApplicant: false,
  manufacturerType: 'ИП',
  manufacturerName: '',
  manufacturerInn: '',
  manufacturerAddress: '',
  manufacturerProductionAddress: '',
  productWeaving: 'Трикотаж',
  productLayer: '2',
  productGender: 'Женский',
  productMaterial: '',
  productTrademarks: '',
  productList: '',
  tnvedCodes: '',
  trTs: '017/2011',
  protocolNumber: '',
  declarationScheme: '3Д',
  validUntil: '',
};

function MaketGenerator() {
  const [form, setForm] = useState<MaketForm>(initialMaketForm);
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = <K extends keyof MaketForm>(key: K, value: MaketForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-set TR TS based on gender
      if (key === 'productGender') {
        next.trTs = value === 'Детский' ? '007/2011' : '017/2011';
      }
      // Auto-set scheme based on doc type
      if (key === 'docType') {
        next.declarationScheme = value === 'CC' ? '3С' : '3Д';
      }
      // Copy applicant data to manufacturer
      if (key === 'sameAsApplicant' && value === true) {
        next.manufacturerType = prev.applicantType;
        next.manufacturerName = prev.applicantName;
        next.manufacturerInn = prev.applicantInn;
        next.manufacturerAddress = prev.applicantAddress;
        next.manufacturerProductionAddress = prev.applicantAddress;
      }
      return next;
    });
  };

  // Upload and parse TZ file
  const handleTzUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset input

    if (isDemo) {
      setError('Запустите бэкенд для парсинга ТЗ');
      return;
    }

    setParsing(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/maket/parse-tz', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Ошибка парсинга' }));
        throw new Error(err.detail || 'Ошибка парсинга');
      }

      const parsed = await res.json();

      // Merge parsed data into form (only non-empty values)
      setForm((prev) => {
        const next = { ...prev };
        for (const [key, val] of Object.entries(parsed)) {
          if (val && key in next) {
            (next as any)[key] = val;
          }
        }
        return next;
      });

      setSuccess('ТЗ загружено! Проверьте и дополните данные.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка парсинга ТЗ');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (isDemo) {
      setError('Запустите бэкенд для генерации документов');
      return;
    }

    setSubmitting(true);
    setError('');

    const endpoint = form.docType === 'CC' ? '/api/maket/cc' : '/api/maket/ds';
    const prefix = form.docType === 'CC' ? 'maket_cc' : 'maket_ds';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Ошибка генерации' }));
        throw new Error(err.detail || 'Ошибка генерации');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prefix}_${form.applicantName || 'document'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-6 sm:p-8"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-angora-dark)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-rose-100)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--color-rose-600)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-coffee-800)' }}>
              Генератор Макета
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-coffee-500)' }}>
              Заполните данные или загрузите ТЗ
            </p>
          </div>
        </div>

        {/* Upload TZ button */}
        <label
          className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5"
          style={{
            backgroundColor: 'var(--color-marina-100)',
            color: 'var(--color-marina-600)',
            border: '1px solid var(--color-marina-200)',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {parsing ? 'Парсинг...' : 'Загрузить ТЗ'}
          <input type="file" accept=".docx" onChange={handleTzUpload} className="hidden" />
        </label>
      </div>

      {/* Success message */}
      {success && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{
            backgroundColor: 'var(--color-sage-50)',
            color: 'var(--color-sage-600)',
            border: '1px solid var(--color-sage-100)',
          }}
        >
          {success}
        </div>
      )}

      {/* === Doc type toggle (CC / DC) === */}
      <div className="flex items-center gap-2 mb-6">
        {(['DC', 'CC'] as const).map((dt) => (
          <button
            key={dt}
            onClick={() => update('docType', dt)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              backgroundColor: form.docType === dt
                ? (dt === 'DC' ? 'var(--color-lilac-400)' : 'var(--color-marina-500)')
                : 'var(--color-angora)',
              color: form.docType === dt ? '#fff' : 'var(--color-coffee-600)',
            }}
          >
            {dt === 'DC' ? 'Декларация (ДС)' : 'Сертификат (СС)'}
          </button>
        ))}
      </div>

      {/* === Applicant Section === */}
      <SectionHeader title="Заявитель" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="sm:col-span-2">
          <RadioGroup
            label="Тип"
            value={form.applicantType}
            onChange={(v) => update('applicantType', v as 'ИП' | 'ОсОО')}
            options={['ИП', 'ОсОО']}
          />
        </div>
        <TextField label="ФИО / Название" value={form.applicantName} onChange={(v) => update('applicantName', v)} />
        <TextField label="ИНН" value={form.applicantInn} onChange={(v) => update('applicantInn', v)} />
        <TextField label="ОКПО" value={form.applicantOkpo} onChange={(v) => update('applicantOkpo', v)} />
        <TextField label="Адрес (место нахождения)" value={form.applicantAddress} onChange={(v) => update('applicantAddress', v)} />
        <TextField label="Телефон" value={form.applicantPhone} onChange={(v) => update('applicantPhone', v)} />
        <TextField label="Email" value={form.applicantEmail} onChange={(v) => update('applicantEmail', v)} />
      </div>

      {/* === Manufacturer Section === */}
      <SectionHeader title="Изготовитель" />
      <div className="mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.sameAsApplicant}
            onChange={(e) => update('sameAsApplicant', e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ accentColor: 'var(--color-rose-400)' }}
          />
          <span className="text-sm" style={{ color: 'var(--color-coffee-700)' }}>
            Совпадает с заявителем
          </span>
        </label>
      </div>
      {!form.sameAsApplicant && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="sm:col-span-2">
            <RadioGroup
              label="Тип"
              value={form.manufacturerType}
              onChange={(v) => update('manufacturerType', v as 'ИП' | 'ОсОО')}
              options={['ИП', 'ОсОО']}
            />
          </div>
          <TextField label="ФИО / Название" value={form.manufacturerName} onChange={(v) => update('manufacturerName', v)} />
          <TextField label="ИНН" value={form.manufacturerInn} onChange={(v) => update('manufacturerInn', v)} />
          <TextField label="Адрес" value={form.manufacturerAddress} onChange={(v) => update('manufacturerAddress', v)} />
          <TextField label="Адрес производства" value={form.manufacturerProductionAddress} onChange={(v) => update('manufacturerProductionAddress', v)} />
        </div>
      )}

      {/* === Product Section === */}
      <SectionHeader title="Продукция" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SelectField label="Вид плетения" value={form.productWeaving} onChange={(v) => update('productWeaving', v)} options={['Трикотаж', 'Швейка']} />
        <SelectField label="Слой" value={form.productLayer} onChange={(v) => update('productLayer', v)} options={['1', '2', '3']} />
        <SelectField label="Пол" value={form.productGender} onChange={(v) => update('productGender', v)} options={['Мужской', 'Женский', 'Детский']} />
        <TextField label="Основной материал" value={form.productMaterial} onChange={(v) => update('productMaterial', v)} placeholder="напр. Хлопок" />
        <TextField label="Торговая марка" value={form.productTrademarks} onChange={(v) => update('productTrademarks', v)} placeholder="через запятую" />
        <div className="sm:col-span-2">
          <TextAreaField label="Перечень изделий" value={form.productList} onChange={(v) => update('productList', v)} placeholder="Список изделий для приложения" rows={3} />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField label="Коды ТН ВЭД" value={form.tnvedCodes} onChange={(v) => update('tnvedCodes', v)} placeholder="По одному коду на строку" rows={2} />
        </div>
      </div>

      {/* === Document Section === */}
      <SectionHeader title="Документ" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <SelectField label="ТР ТС" value={form.trTs} onChange={(v) => update('trTs', v)} options={['017/2011', '007/2011']} />
        <TextField label="Протокол испытаний №" value={form.protocolNumber} onChange={(v) => update('protocolNumber', v)} />
        <SelectField
          label={form.docType === 'CC' ? 'Схема сертификации' : 'Схема декларирования'}
          value={form.declarationScheme}
          onChange={(v) => update('declarationScheme', v)}
          options={form.docType === 'CC' ? ['3С', '4С', '5С'] : ['3Д', '4Д', '6Д']}
        />
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-coffee-600)' }}>
            Срок действия до
          </label>
          <input
            type="date"
            value={form.validUntil}
            onChange={(e) => update('validUntil', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              backgroundColor: 'var(--color-angora)',
              border: '1px solid var(--color-angora-dark)',
              color: 'var(--color-coffee-800)',
            }}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{
            backgroundColor: 'var(--color-lava-50)',
            color: 'var(--color-lava-500)',
            border: '1px solid var(--color-lava-100)',
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
        style={{
          background: 'linear-gradient(135deg, var(--color-rose-400), var(--color-rose-600))',
        }}
      >
        {submitting ? 'Генерация...' : `Скачать Макет ${form.docType === 'CC' ? 'СС' : 'ДС'}`}
      </button>
    </div>
  );
}

/* ── Shared Form Components ──────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <h3 className="text-sm font-bold" style={{ color: 'var(--color-coffee-800)' }}>
        {title}
      </h3>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-angora-dark)' }} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-coffee-600)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all cursor-pointer appearance-none"
        style={{
          backgroundColor: 'var(--color-angora)',
          border: '1px solid var(--color-angora-dark)',
          color: 'var(--color-coffee-800)',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236e5040' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '36px',
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-coffee-600)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:opacity-40"
        style={{
          backgroundColor: 'var(--color-angora)',
          border: '1px solid var(--color-angora-dark)',
          color: 'var(--color-coffee-800)',
        }}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-coffee-600)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-y placeholder:opacity-40"
        style={{
          backgroundColor: 'var(--color-angora)',
          border: '1px solid var(--color-angora-dark)',
          color: 'var(--color-coffee-800)',
        }}
      />
    </div>
  );
}

function RadioGroup({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-coffee-600)' }}>
        {label}
      </label>
      <div className="flex gap-4">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={value === o}
              onChange={() => onChange(o)}
              className="w-4 h-4"
              style={{ accentColor: 'var(--color-rose-400)' }}
            />
            <span className="text-sm" style={{ color: 'var(--color-coffee-700)' }}>{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */

export default function ToolsPage() {
  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-coffee-800)' }}>
          Инструменты
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-coffee-500)' }}>
          Калькулятор кодов и генератор документов
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TnvedCalculator />
        <MaketGenerator />
      </div>
    </div>
  );
}
