import { OrderList } from '../components/OrderList'

export function OrdersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Bons de commande
      </h1>
      <OrderList />
    </div>
  )
}
