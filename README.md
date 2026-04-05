# CALI — Certification Automation for Textile Products

Локальное веб-приложение для автоматизации создания сертификатов и деклараций соответствия текстильной продукции.

## Стек

- **Backend:** Python 3.11+ / FastAPI / SQLite
- **Frontend:** React 18 / TypeScript / Vite / Tailwind CSS
- **Дизайн:** NYFW SS26 Color Palette (Pantone)

## Быстрый запуск

### Windows (один клик)
```
start.bat
```

### Ручной запуск

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Открыть: http://localhost:3000

API Docs: http://localhost:8000/docs

## Функционал

- Калькулятор стоимости сертификации (СС/ДС)
- Управление клиентами (ИП КР / ИП РФ)
- Каталог продукции с автоопределением типа документа и кода ТН ВЭД
- Массовый импорт из CSV/Excel
- Генерация документов DOCX/PDF
- Индикация СГР для детской одежды до 3 лет

## Бизнес-правила

| Заявитель | СС (сертификат) | ДС (декларация) |
|-----------|-----------------|-----------------|
| ИП КР     | 30 000 руб.     | 25 000 руб.     |
| ИП РФ     | 35 000 руб.     | Недоступно      |

Доп. протокол испытаний: +6 000 руб.

## GitHub Pages

Фронтенд (UI демо) доступен по адресу:
https://KEN880.github.io/CLAUD_CALI_DEV/

> Для полного функционала (API, БД, генерация документов) необходим локальный запуск бэкенда.
