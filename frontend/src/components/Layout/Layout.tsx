import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Tableau de bord' },
    { path: '/orders', label: 'Bons de commande' },
    { path: '/orders/new', label: 'Nouveau bon' },
    { path: '/settings', label: 'Paramètres' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-primary-600">
                  Annex 9 Generator
                </Link>
              </div>
              <nav className="ml-10 flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center">
              {user && (
                <>
                  <span className="text-sm text-gray-600 mr-4">
                    {user.first_name || user.username}
                  </span>
                  <button
                    onClick={logout}
                    className="btn btn-secondary text-sm"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Annex 9 Generator - Bons de commande pour services de taxis collectifs (Wallonie)
          </p>
        </div>
      </footer>
    </div>
  )
}
