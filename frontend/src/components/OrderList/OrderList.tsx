import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOrders, useDeleteOrder, useGeneratePdf, useAuth } from '../../hooks'
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

type PdfButtonState = 'idle' | 'loading' | 'success' | 'error'

export function OrderList() {
  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    page_size: 20,
  })
  const [pdfStates, setPdfStates] = useState<Record<string, PdfButtonState>>({})
  const { data, isLoading, error } = useOrders(filters)
  const { canEdit } = useAuth()
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
    setPdfStates((prev) => ({ ...prev, [id]: 'loading' }))
    try {
      await generatePdf.mutateAsync(id)
      setPdfStates((prev) => ({ ...prev, [id]: 'success' }))
    } catch {
      setPdfStates((prev) => ({ ...prev, [id]: 'error' }))
    }
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
          {canEdit && (
            <Link to="/orders/new">
              <Button className="w-full">Nouveau bon de commande</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="card text-center py-8">Chargement...</div>
      ) : !data?.items.length ? (
        <div className="card text-center py-8 text-gray-500">
          Aucun bon de commande trouvé
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {data.items.map((order) => {
              const pdfState = pdfStates[order.id] || 'idle'
              const hasPdf = order.pdf_url || pdfState === 'success'

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-primary-600 hover:text-primary-800 font-semibold"
                    >
                      {order.reference}
                    </Link>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusColors[order.status]
                      }`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{order.client_name}</p>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span>{serviceTypeLabels[order.service_type]}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {format(new Date(order.reservation_date), 'dd/MM/yyyy', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                    {canEdit && (
                      <Link
                        to={`/orders/${order.id}/edit`}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg active:bg-primary-100"
                      >
                        Modifier
                      </Link>
                    )}
                    {pdfState === 'loading' ? (
                      <span className="px-3 py-1.5 text-sm text-gray-500">
                        Génération...
                      </span>
                    ) : pdfState === 'error' && canEdit ? (
                      <button
                        onClick={() => handleGeneratePdf(order.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg active:bg-red-100"
                      >
                        Réessayer
                      </button>
                    ) : hasPdf ? (
                      <button
                        onClick={() => handleDownloadPdf(order.id)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100"
                      >
                        Télécharger
                      </button>
                    ) : canEdit ? (
                      <button
                        onClick={() => handleGeneratePdf(order.id)}
                        className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg active:bg-green-100"
                      >
                        Générer PDF
                      </button>
                    ) : null}
                    {canEdit && (
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg active:bg-red-100"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block card overflow-hidden">
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
                        {canEdit && (
                          <Link
                            to={`/orders/${order.id}/edit`}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Modifier
                          </Link>
                        )}
                        {(() => {
                          const pdfState = pdfStates[order.id] || 'idle'
                          const hasPdf = order.pdf_url || pdfState === 'success'

                          if (pdfState === 'loading') {
                            return (
                              <span className="text-gray-500 cursor-wait">
                                Génération...
                              </span>
                            )
                          }

                          if (pdfState === 'error' && canEdit) {
                            return (
                              <button
                                onClick={() => handleGeneratePdf(order.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Erreur - Réessayer
                              </button>
                            )
                          }

                          if (hasPdf) {
                            return (
                              <button
                                onClick={() => handleDownloadPdf(order.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Télécharger
                              </button>
                            )
                          }

                          if (canEdit) {
                            return (
                              <button
                                onClick={() => handleGeneratePdf(order.id)}
                                className="text-green-600 hover:text-green-800"
                              >
                                Générer PDF
                              </button>
                            )
                          }

                          return null
                        })()}
                        {canEdit && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="mt-4 px-4 py-3 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {data.total} résultat(s) - Page {data.page} sur {data.pages}
              </p>
              <div className="flex space-x-2">
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
  )
}
