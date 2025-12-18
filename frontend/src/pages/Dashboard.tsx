import { Link } from 'react-router-dom'
import { useOrders } from '../hooks'
import { Button } from '../components/common'

export function Dashboard() {
  const { data: allOrders } = useOrders({ page_size: 100 })

  const stats = {
    total: allOrders?.total || 0,
    draft: allOrders?.items.filter((o) => o.status === 'draft').length || 0,
    generated: allOrders?.items.filter((o) => o.status === 'generated').length || 0,
    sent: allOrders?.items.filter((o) => o.status === 'sent').length || 0,
  }

  const recentOrders = allOrders?.items.slice(0, 5) || []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <Link to="/orders/new">
          <Button>Nouveau bon de commande</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total bons</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Brouillons</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">PDF Générés</p>
          <p className="text-3xl font-bold text-green-600">{stats.generated}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Envoyés</p>
          <p className="text-3xl font-bold text-blue-600">{stats.sent}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Derniers bons de commande</h2>
          <Link
            to="/orders"
            className="text-primary-600 hover:text-primary-800 text-sm"
          >
            Voir tout
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Aucun bon de commande pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-primary-600">
                      {order.reference}
                    </p>
                    <p className="text-sm text-gray-500">{order.client_name}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'draft'
                        ? 'bg-gray-100 text-gray-800'
                        : order.status === 'generated'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {order.status === 'draft'
                      ? 'Brouillon'
                      : order.status === 'generated'
                      ? 'Généré'
                      : 'Envoyé'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
