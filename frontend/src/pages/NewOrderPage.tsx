import { OrderForm } from '../components/OrderForm'

export function NewOrderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Nouveau bon de commande
      </h1>
      <OrderForm />
    </div>
  )
}
