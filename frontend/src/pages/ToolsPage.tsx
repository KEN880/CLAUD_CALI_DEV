import { useState, useEffect, useCallback } from 'react';
import { isDemo } from '../api/client';

/* ── TNVED Demo Resolver ─────────────────────────────── */

const PRODUCT_TYPES = [
  'Платье', 'Юбка', 'Брюки', 'Пиджак', 'Куртка', 'Пальто',
  'Костюм', 'Рубашка', 'Блузка', 'Джемпер', 'Кардиган',
  'Жилет', 'Боди', 'Комбинезон',
] as const;

const MATERIALS = [
  'Хлопок', 'Полиэстер', 'Шерсть', 'Шёлк', 'Вискоза', 'Нейлон',
  'Акрил', 'Лён', 'Эластан', 'Спандекс', 'Бамбук',
] as const;

type TargetGroup = 'Взрослая' | 'Детская';

interface TnvedMultiResult {
  results: { gender: string; code: string; layer: number; trTs: string; docType: string }[];
  materials: string;
}

// Demo mapping for TNVED codes (approximate)
function resolveTnvedMultiDemo(
  weaving: string,
  productType: string,
  targetGroup: TargetGroup,
  genders: string[],
  materials: { name: string; percent: number }[],
): TnvedMultiResult {
  // Base: трикотаж → 61xx, швейка → 62xx
  const base = weaving === 'Трикотаж' ? '61' : '62';

  // Product type → second pair
  const productMap: Record<string, string> = {
    'Платье': '04', 'Юбка': '04', 'Блузка': '06', 'Рубашка': '05',
    'Брюки': '03', 'Пиджак': '03', 'Куртка': '01', 'Пальто': '01',
    'Костюм': '03', 'Джемпер': '10', 'Кардиган': '10', 'Жилет': '09',
    'Боди': '09', 'Комбинезон': '11',
  };
  const typeCode = productMap[productType] || '04';

  // Determine main material (highest percent) for TNVED classification
  const mainMat = materials.length > 0
    ? materials.reduce((a, b) => a.percent >= b.percent ? a : b).name
    : 'Хлопок';

  // Real TNVED material subcodes from ЕТТ ЕАЭС chapters 61/62:
  // Structure: XX YY ZZZ D — YY=material group, ZZZ D=product subcode
  // YY: 10=шерсть, 20=хлопок, 30=синтетика/химнити, 90=прочие
  // For most products: ZZZ D = 000 0 (basic subcode)
  const materialGroupMap: Record<string, string> = {
    'Шерсть': '10',
    'Хлопок': '20',
    'Полиэстер': '30',
    'Нейлон': '30',
    'Акрил': '30',
    'Вискоза': '30',
    'Шёлк': '90',
    'Лён': '90',
    'Эластан': '90',
    'Спандекс': '90',
    'Бамбук': '90',
  };
  const matGroup = materialGroupMap[mainMat] || '90';
  // Default product subcode (most common)
  const matCode = `${matGroup} 000 0`;

  // Layer auto-determination
  const outerTypes = ['Куртка', 'Пальто'];
  const innerTypes = ['Боди'];
  let layer = 2;
  if (outerTypes.includes(productType)) layer = 3;
  if (innerTypes.includes(productType)) layer = 1;

  // Format materials string
  const matStr = materials.length > 0
    ? materials.map(m => `${m.name} ${m.percent}%`).join(', ')
    : mainMat;

  // Real TNVED heading structure from ЕТТ ЕАЭС (chapters 61, 62):
  // 6101/6201 = пальто, куртки — мужские или для мальчиков
  // 6102/6202 = пальто, куртки — женские или для девочек
  // 6103/6203 = костюмы, пиджаки, брюки — мужские или для мальчиков
  // 6104/6204 = костюмы, жакеты, платья, юбки, брюки — женские или для девочек
  // 6105/6205 = рубашки — мужские или для мальчиков
  // 6106/6206 = блузки, блузы — женские или для девочек
  // 6107/6207 = кальсоны, трусы, пижамы — мужские
  // 6108/6208 = комбинации, трусы, пижамы — женские
  // 6109     = майки, фуфайки (унисекс)
  // 6110     = свитеры, пуловеры, кардиганы, жилеты (унисекс)
  // 6111/6209 = детская одежда (для детей ростом до 86 см)
  // 6114/6211 = прочая одежда
  const productGenderMap: Record<string, Record<string, string>> = {
    'Куртка':     { 'Мужская': '01', 'Женская': '02', 'Для мальчиков': '01', 'Для девочек': '02' },
    'Пальто':     { 'Мужская': '01', 'Женская': '02', 'Для мальчиков': '01', 'Для девочек': '02' },
    'Костюм':     { 'Мужская': '03', 'Женская': '04', 'Для мальчиков': '03', 'Для девочек': '04' },
    'Пиджак':     { 'Мужская': '03', 'Женская': '04', 'Для мальчиков': '03', 'Для девочек': '04' },
    'Брюки':      { 'Мужская': '03', 'Женская': '04', 'Для мальчиков': '03', 'Для девочек': '04' },
    'Платье':     { 'Мужская': '04', 'Женская': '04', 'Для мальчиков': '04', 'Для девочек': '04' },
    'Юбка':       { 'Мужская': '04', 'Женская': '04', 'Для мальчиков': '04', 'Для девочек': '04' },
    'Рубашка':    { 'Мужская': '05', 'Женская': '06', 'Для мальчиков': '05', 'Для девочек': '06' },
    'Блузка':     { 'Мужская': '06', 'Женская': '06', 'Для мальчиков': '06', 'Для девочек': '06' },
    'Джемпер':    { 'Мужская': '10', 'Женская': '10', 'Для мальчиков': '10', 'Для девочек': '10' },
    'Кардиган':   { 'Мужская': '10', 'Женская': '10', 'Для мальчиков': '10', 'Для девочек': '10' },
    'Жилет':      { 'Мужская': '10', 'Женская': '10', 'Для мальчиков': '10', 'Для девочек': '10' },
    'Боди':       { 'Мужская': '09', 'Женская': '08', 'Для мальчиков': '11', 'Для девочек': '11' },
    'Комбинезон': { 'Мужская': '14', 'Женская': '14', 'Для мальчиков': '11', 'Для девочек': '11' },
  };

  const isChild = targetGroup === 'Детская';
  const trTs = isChild ? '007/2011' : '017/2011';

  // Doc type auto-determination per Справочник:
  // СС: детская 1-2 слой, взрослая 1 слой
  // ДС: взрослая 2-3 слой, детская 3 слой
  let docType: string;
  if (isChild) {
    docType = layer <= 2 ? 'СС' : 'ДС';
  } else {
    docType = layer === 1 ? 'СС' : 'ДС';
  }

  const results = genders.map((g) => {
    const pgMap = productGenderMap[productType];
    const pgCode = pgMap?.[g] || '04';
    // 10-digit code: XXXX XX XXX X (4+2+3+1)
    const code = `${base}${pgCode} ${matCode}`;
    return { gender: g, code, layer, trTs, docType };
  });

  return { results, materials: matStr };
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
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('Взрослая');
  const [genders, setGenders] = useState<string[]>(['Женская']);
  const [materials, setMaterials] = useState<{ name: string; percent: number }[]>([
    { name: 'Хлопок', percent: 100 },
  ]);
  const [newMaterial, setNewMaterial] = useState('');
  const [result, setResult] = useState<TnvedMultiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const adultGenders = ['Женская', 'Мужская'];
  const childGenders = ['Для девочек', 'Для мальчиков'];
  const subOptions = targetGroup === 'Взрослая' ? adultGenders : childGenders;

  const toggleGender = (g: string) => {
    setGenders((prev) => {
      if (prev.includes(g)) {
        return prev.length > 1 ? prev.filter((x) => x !== g) : prev;
      }
      return [...prev, g];
    });
  };

  // When switching target group, reset genders to first sub-option
  const handleGroupChange = (g: TargetGroup) => {
    setTargetGroup(g);
    setGenders(g === 'Взрослая' ? ['Женская'] : ['Для девочек']);
  };

  // Materials management
  const addMaterial = (name: string) => {
    if (!name || materials.some((m) => m.name === name)) return;
    setMaterials((prev) => {
      const evenPercent = Math.floor(100 / (prev.length + 1));
      const updated = prev.map((m) => ({ ...m, percent: evenPercent }));
      const remainder = 100 - evenPercent * prev.length;
      return [...updated, { name, percent: remainder }];
    });
    setNewMaterial('');
  };

  const removeMaterial = (name: string) => {
    if (materials.length <= 1) return;
    setMaterials((prev) => {
      const filtered = prev.filter((m) => m.name !== name);
      // Redistribute to 100%
      const each = Math.floor(100 / filtered.length);
      return filtered.map((m, i) => ({
        ...m,
        percent: i === filtered.length - 1 ? 100 - each * (filtered.length - 1) : each,
      }));
    });
  };

  const updatePercent = (name: string, percent: number) => {
    setMaterials((prev) => prev.map((m) => m.name === name ? { ...m, percent } : m));
  };

  const copyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  };

  useEffect(() => {
    const r = resolveTnvedMultiDemo(weaving, productType, targetGroup, genders, materials);
    setResult(r);
    setLoading(false);
  }, [weaving, productType, targetGroup, genders, materials]);

  const availableMaterials = [...MATERIALS].filter((m) => !materials.some((x) => x.name === m));

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

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <SelectField label="Вид плетения" value={weaving} onChange={setWeaving} options={['Трикотаж', 'Швейка']} />
        <SelectField label="Тип изделия" value={productType} onChange={setProductType} options={[...PRODUCT_TYPES]} />
      </div>

      {/* Target group: Взрослая / Детская */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-coffee-600)' }}>
          Целевая группа
        </label>
        <div className="flex gap-2 mb-3">
          {(['Взрослая', 'Детская'] as TargetGroup[]).map((g) => (
            <button
              key={g}
              onClick={() => handleGroupChange(g)}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: targetGroup === g ? 'var(--color-marina-500)' : 'var(--color-angora)',
                color: targetGroup === g ? '#fff' : 'var(--color-coffee-600)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
        {/* Gender sub-options (multi-select checkboxes) */}
        <div className="flex gap-3 ml-1">
          {subOptions.map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={genders.includes(g)}
                onChange={() => toggleGender(g)}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--color-rose-400)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-coffee-700)' }}>{g}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Materials combo */}
      <div className="mb-6">
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-coffee-600)' }}>
          Состав материалов
        </label>
        {/* Material chips */}
        <div className="flex flex-wrap gap-2 mb-2">
          {materials.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-angora)',
                border: '1px solid var(--color-angora-dark)',
                color: 'var(--color-coffee-800)',
              }}
            >
              <span className="font-medium">{m.name}</span>
              <input
                type="number"
                min={1}
                max={100}
                value={m.percent}
                onChange={(e) => updatePercent(m.name, Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                className="w-12 text-center text-xs px-1 py-0.5 rounded outline-none"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-angora-dark)',
                  color: 'var(--color-coffee-800)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-coffee-500)' }}>%</span>
              {materials.length > 1 && (
                <button
                  onClick={() => removeMaterial(m.name)}
                  className="ml-1 w-5 h-5 rounded-full flex items-center justify-center text-xs hover:scale-110 transition-all"
                  style={{ backgroundColor: 'var(--color-lava-50)', color: 'var(--color-lava-500)' }}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
        </div>
        {/* Add material */}
        {availableMaterials.length > 0 && (
          <div className="flex gap-2">
            <select
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none cursor-pointer appearance-none"
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
              <option value="">+ Добавить материал</option>
              {availableMaterials.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {newMaterial && (
              <button
                onClick={() => addMaterial(newMaterial)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ backgroundColor: 'var(--color-marina-100)', color: 'var(--color-marina-600)' }}
              >
                +
              </button>
            )}
          </div>
        )}
        {/* Total percent indicator */}
        {materials.length > 1 && (
          <div className="mt-2 text-xs" style={{
            color: materials.reduce((s, m) => s + m.percent, 0) === 100
              ? 'var(--color-sage-600)' : 'var(--color-lava-500)',
          }}>
            Итого: {materials.reduce((s, m) => s + m.percent, 0)}%
            {materials.reduce((s, m) => s + m.percent, 0) !== 100 && ' (должно быть 100%)'}
          </div>
        )}
      </div>

      {/* Results — one per selected gender */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{ borderColor: 'var(--color-angora-dark)', borderTopColor: 'var(--color-marina-500)' }}
            />
          </div>
        ) : result?.results.map((r, i) => (
          <div
            key={r.gender}
            className="rounded-xl p-4 text-center"
            style={{
              backgroundColor: 'var(--color-angora)',
              border: '1px solid var(--color-angora-dark)',
            }}
          >
            {result.results.length > 1 && (
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-coffee-500)' }}>
                {r.gender}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              <span
                className="text-xl sm:text-2xl font-bold font-mono tracking-wider"
                style={{ color: 'var(--color-coffee-800)' }}
              >
                {r.code}
              </span>
              <button
                onClick={() => copyCode(r.code.replace(/\s/g, ''), i)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  backgroundColor: copiedIdx === i ? 'var(--color-sage-100)' : 'var(--color-marina-100)',
                  color: copiedIdx === i ? 'var(--color-sage-600)' : 'var(--color-marina-600)',
                }}
              >
                {copiedIdx === i ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--color-coffee-600)' }}>
              <span>Слой: <strong>{r.layer}</strong></span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-angora-dark)' }} />
              <span>ТР ТС: <strong>{r.trTs}</strong></span>
              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-angora-dark)' }} />
              <span
                className="px-2 py-0.5 rounded-md font-bold"
                style={{
                  backgroundColor: r.docType === 'СС' ? 'var(--color-marina-100)' : 'var(--color-lilac-100)',
                  color: r.docType === 'СС' ? 'var(--color-marina-600)' : 'var(--color-lilac-600)',
                }}
              >
                {r.docType}
              </span>
            </div>
          </div>
        ))}
        {/* Show materials summary if multiple genders */}
        {result && result.results.length > 1 && (
          <div className="text-center text-xs pt-1" style={{ color: 'var(--color-coffee-500)' }}>
            Состав: {result.materials}
          </div>
        )}
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
  productTrademarks: string[];
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
  productTrademarks: [],
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
            // Convert trademarks string from backend to array
            if (key === 'productTrademarks' && typeof val === 'string') {
              next.productTrademarks = (val as string).split(',').map((s: string) => s.trim()).filter(Boolean);
            } else {
              (next as any)[key] = val;
            }
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
      // Serialize trademarks array to comma-separated string for backend
      const payload = { ...form, productTrademarks: form.productTrademarks.join(', ') };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        <TagInput label="Торговые марки" tags={form.productTrademarks} onChange={(v) => update('productTrademarks', v)} placeholder="Введите и нажмите Enter" />
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

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-coffee-600)' }}>
        {label}
      </label>
      <div
        className="flex flex-wrap gap-1.5 px-3 py-2 rounded-xl min-h-[42px] items-center"
        style={{
          backgroundColor: 'var(--color-angora)',
          border: '1px solid var(--color-angora-dark)',
        }}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--color-marina-100)', color: 'var(--color-marina-600)' }}
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:opacity-70 text-sm leading-none"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(); }
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder:opacity-40"
          style={{ color: 'var(--color-coffee-800)' }}
        />
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
