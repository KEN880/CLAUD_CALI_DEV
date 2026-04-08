import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { isDemo } from './api/client'
import KanbanPage from './pages/KanbanPage'
import NewOrderPage from './pages/NewOrderPage'
import ClientsPage from './pages/ClientsPage'
import ToolsPage from './pages/ToolsPage'

function useTheme() {
  const [manual, setManual] = useState<boolean | null>(() => {
    const saved = localStorage.getItem('cali-theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return null // no manual override — follow system
  })
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  // Listen for system theme changes (iPhone dark mode toggle etc.)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const dark = manual ?? systemDark

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const toggle = () => {
    // If currently in manual mode, cycle: manual dark → manual light → auto
    if (manual !== null) {
      const next = !dark
      if (next === systemDark) {
        // Going back to what system wants = reset to auto
        setManual(null)
        localStorage.removeItem('cali-theme')
      } else {
        setManual(next)
        localStorage.setItem('cali-theme', next ? 'dark' : 'light')
      }
    } else {
      // Auto mode → switch to opposite of system
      const next = !systemDark
      setManual(next)
      localStorage.setItem('cali-theme', next ? 'dark' : 'light')
    }
  }

  return [dark, toggle] as const
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, toggleTheme] = useTheme()

  return (
    <div className="min-h-screen bg-[var(--color-onyx)]">
      <nav className="bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-angora-dark)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <NavLink to="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-rose-400)] to-[var(--color-marina-500)] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--color-coffee-800)]">CALI</span>
            </NavLink>

            <div className="hidden md:flex gap-0.5">
              <NavLink to="/" end
                className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)] shadow-sm' : 'text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)] hover:bg-[var(--color-angora)]'}`}>
                Доска
              </NavLink>
              <NavLink to="/clients"
                className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)] shadow-sm' : 'text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)] hover:bg-[var(--color-angora)]'}`}>
                Клиенты
              </NavLink>
              <NavLink to="/tools"
                className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)] shadow-sm' : 'text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)] hover:bg-[var(--color-angora)]'}`}>
                Инструменты
              </NavLink>
              <NavLink to="/new"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white hover:shadow-lg hover:shadow-[var(--color-rose-200)] transition-all duration-200">
                + Заказ
              </NavLink>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleTheme}
                className="p-2 rounded-lg text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)] hover:bg-[var(--color-angora)] transition-all"
                title={dark ? 'Светлая тема' : 'Тёмная тема'}>
                {dark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-angora-dark)] bg-[var(--color-surface)]/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-1">
              <NavLink to="/" end onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)]' : 'text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'}`}>
                Доска
              </NavLink>
              <NavLink to="/clients" onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)]' : 'text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'}`}>
                Клиенты
              </NavLink>
              <NavLink to="/tools" onClick={() => setMenuOpen(false)}
                className={({ isActive }) => `block px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)]' : 'text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'}`}>
                Инструменты
              </NavLink>
              <NavLink to="/new" onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-center bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-rose-500)] text-white">
                + Новый заказ
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {isDemo && (
        <div className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-marina-500)] text-white text-center py-2 px-4 text-xs sm:text-sm font-medium">
          Демо-режим — данные локальные
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <Routes>
          <Route path="/" element={<KanbanPage />} />
          <Route path="/new" element={<NewOrderPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/tools" element={<ToolsPage />} />
        </Routes>
      </main>
    </div>
  )
}
