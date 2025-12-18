import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOrders, useDeleteOrder, useGeneratePdf } from '../../hooks'
import { Button, Input, Select } from '../common'
import { pdfApi } from '../../services/api'
import type { OrderFilters, OrderStatus, ServiceType } from '../../types'

const statusLabels: Record<OrderStatus, string> = {
  draft: 'Brouillon',
  generated: 'Généré',
  sent: 'Envoyé',
  archived: 'Archivé',
}

const serviceTypeLabels: Record<ServiceType, string> = {
  aller: 'Aller',
  retour: 'Retour',
  aller_retour: 'Aller/Retour',
}

const statusColors: Record<OrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  generated: 'bg-green-100 text-green-800',
  sent: 'bg-blue-100 text-blue-800',
  archived: 'bg-yellow-100 text-yellow-800',
}

export function OrderList() {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    page_size: 20,
  })
  const { data, isLoading, error } = useOrders(filters)
  const deleteOrder = useDeleteOrder()
  const generatePdf = useGeneratePdf()

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status ? (status as OrderStatus) : undefined,
      page: 1,
    }))
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce bon de commande ?')) {
      await deleteOrder.mutateAsync(id)
    }
  }

  const handleGeneratePdf = async (id: string) => {
    await generatePdf.mutateAsync(id)
  }

  const handleDownloadPdf = (id: string) => {
    window.open(pdfApi.getDownloadUrl(id), '_blank')
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erreur lors du chargement des bons de commande
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher (référence, client, exploitant)..."
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Select
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'draft', label: 'Brouillon' },
              { value: 'generated', label: 'Généré' },
              { value: 'sent', label: 'Envoyé' },
              { value: 'archived', label: 'Archivé' },
            ]}
            onChange={(e) => handleStatusFilter(e.target.value)}
          />
          <Link to="/orders/new">
            <Button className="w-full">Nouveau bon de commande</Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : !data?.items.length ? (
          <div className="text-center py-8 text-gray-500">
            Aucun bon de commande trouvé
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date réservation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.items.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-primary-600 hover:text-primary-800 font-medium"
                        >
                          {order.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {serviceTypeLabels[order.service_type]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(order.reservation_date), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            statusColors[order.status]
                          }`}
                        >
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link
                          to={`/orders/${order.id}/edit`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          Modifier
                        </Link>
                        {order.status !== 'generated' && (
                          <button
                            onClick={() => handleGeneratePdf(order.id)}
                            className="text-green-600 hover:text-green-800"
                            disabled={generatePdf.isPending}
                          >
                            Générer PDF
                          </button>
                        )}
                        {order.pdf_url && (
                          <button
                            onClick={() => handleDownloadPdf(order.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Télécharger
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {data.total} résultat(s) - Page {data.page} sur {data.pages}
                </p>
                <div className="space-x-2">
                  <Button
                    variant="secondary"
                    disabled={data.page <= 1}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))
                    }
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={data.page >= data.pages}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))
                    }
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
