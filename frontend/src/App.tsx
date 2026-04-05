import { Routes, Route, NavLink } from 'react-router-dom'
import ClientsPage from './pages/ClientsPage'
import ProductsPage from './pages/ProductsPage'
import CalculatorPage from './pages/CalculatorPage'
import CertificatesPage from './pages/CertificatesPage'
import BatchUploadPage from './pages/BatchUploadPage'

const navItems = [
  { to: '/', label: 'Калькулятор', icon: '~' },
  { to: '/clients', label: 'Клиенты', icon: '~' },
  { to: '/products', label: 'Продукция', icon: '~' },
  { to: '/certificates', label: 'Сертификаты', icon: '~' },
  { to: '/batch', label: 'Импорт', icon: '~' },
]

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-onyx)]">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[var(--color-angora-dark)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-16 gap-10">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-rose-400)] to-[var(--color-marina-500)] flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-tight">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[var(--color-coffee-800)]">
                CALI
              </span>
            </NavLink>

            <div className="flex gap-0.5">
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/certificates" element={<CertificatesPage />} />
          <Route path="/batch" element={<BatchUploadPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-angora-dark)] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[var(--color-coffee-500)]">
          CALI Certification System &middot; NYFW SS26 Palette
        </div>
      </footer>
    </div>
  )
}
