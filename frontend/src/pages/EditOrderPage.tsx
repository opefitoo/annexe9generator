import { useParams } from 'react-router-dom'
import { useOrder } from '../hooks'
import { OrderForm } from '../components/OrderForm'

export function EditOrderPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, error } = useOrder(id!)

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  if (error || !order) {
    return (
      <div className="text-center py-8 text-red-600">
        Bon de commande non trouvé
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Modifier le bon de commande {order.reference}
      </h1>
      <OrderForm order={order} mode="edit" />
    </div>
  )
}
