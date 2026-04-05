import { useState } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { isDemo } from './api/client'
import ClientsPage from './pages/ClientsPage'
import ProductsPage from './pages/ProductsPage'
import CalculatorPage from './pages/CalculatorPage'
import CertificatesPage from './pages/CertificatesPage'
import BatchUploadPage from './pages/BatchUploadPage'

const navItems = [
  { to: '/', label: 'Калькулятор' },
  { to: '/clients', label: 'Клиенты' },
  { to: '/products', label: 'Продукция' },
  { to: '/certificates', label: 'Сертификаты' },
  { to: '/batch', label: 'Импорт' },
]

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--color-onyx)]">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[var(--color-angora-dark)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <NavLink to="/" className="flex items-center gap-2.5" onClick={() => setMenuOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-rose-400)] to-[var(--color-marina-500)] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--color-coffee-800)]">CALI</span>
            </NavLink>

            {/* Desktop nav */}
            <div className="hidden md:flex gap-0.5">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)] shadow-sm'
                        : 'text-[var(--color-coffee-500)] hover:text-[var(--color-coffee-700)] hover:bg-[var(--color-angora)]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Mobile burger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-angora-dark)] bg-white/95 backdrop-blur-md">
            <div className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[var(--color-rose-50)] text-[var(--color-rose-600)]'
                        : 'text-[var(--color-coffee-600)] hover:bg-[var(--color-angora)]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Demo banner */}
      {isDemo && (
        <div className="bg-gradient-to-r from-[var(--color-rose-400)] to-[var(--color-marina-500)] text-white text-center py-2 px-4 text-xs sm:text-sm font-medium">
          Демо-режим — данные локальные. Для полного функционала запустите бэкенд на своём устройстве.
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/batch" element={<BatchUploadPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-angora-dark)] mt-8 sm:mt-12 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-[var(--color-coffee-500)]">
          CALI Certification System
        </div>
      </footer>
    </div>
  )
}
