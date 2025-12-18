import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOrder, useDeleteOrder, useGeneratePdf, useGenerateSignatureLink, useSignatureStatus } from '../hooks'
import { Button } from '../components/common'
import { pdfApi } from '../services/api'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: order, isLoading, error } = useOrder(id!)
  const deleteOrder = useDeleteOrder()
  const generatePdf = useGeneratePdf()
  const generateSignatureLink = useGenerateSignatureLink()
  const { data: signatureStatus } = useSignatureStatus(id)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)

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

  const handleDelete = async () => {
    if (window.confirm('Voulez-vous vraiment supprimer ce bon de commande ?')) {
      await deleteOrder.mutateAsync(order.id)
      navigate('/orders')
    }
  }

  const handleGeneratePdf = async () => {
    await generatePdf.mutateAsync(order.id)
  }

  const handleDownload = () => {
    window.open(pdfApi.getDownloadUrl(order.id), '_blank')
  }

  const handlePreview = () => {
    window.open(pdfApi.getPreviewUrl(order.id), '_blank')
  }

  const handleGenerateSignatureLink = async () => {
    const result = await generateSignatureLink.mutateAsync({ orderId: order.id })
    const fullUrl = `${window.location.origin}${result.signature_url}`
    setSignatureUrl(fullUrl)
    setShowSignatureModal(true)
  }

  const copyToClipboard = async () => {
    if (signatureUrl) {
      await navigator.clipboard.writeText(signatureUrl)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-'
    return timeStr.substring(0, 5)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.reference}</h1>
          <p className="text-gray-500">
            Créé le {format(new Date(order.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="secondary" onClick={handlePreview}>
            Aperçu PDF
          </Button>
          <Button variant="secondary" onClick={handleGeneratePdf} loading={generatePdf.isPending}>
            {order.pdf_url ? 'Regénérer PDF' : 'Générer PDF'}
          </Button>
          {order.pdf_url && (
            <Button onClick={handleDownload}>Télécharger PDF</Button>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-6">
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            order.status === 'draft'
              ? 'bg-gray-100 text-gray-800'
              : order.status === 'generated'
              ? 'bg-green-100 text-green-800'
              : order.status === 'sent'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {order.status === 'draft'
            ? 'Brouillon'
            : order.status === 'generated'
            ? 'PDF Généré'
            : order.status === 'sent'
            ? 'Envoyé'
            : 'Archivé'}
        </span>
      </div>

      {/* Signature Status Card */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              signatureStatus?.has_client_signature
                ? 'bg-green-100'
                : 'bg-gray-100'
            }`}>
              <svg className={`w-5 h-5 ${
                signatureStatus?.has_client_signature
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Signature client</p>
              <p className="text-sm text-gray-500">
                {signatureStatus?.has_client_signature
                  ? `Signé le ${signatureStatus.client_signature_date ? format(new Date(signatureStatus.client_signature_date), 'dd/MM/yyyy à HH:mm', { locale: fr }) : ''}`
                  : 'En attente de signature'}
              </p>
            </div>
          </div>
          {!signatureStatus?.has_client_signature && (
            <Button
              variant="secondary"
              onClick={handleGenerateSignatureLink}
              loading={generateSignatureLink.isPending}
            >
              Générer lien de signature
            </Button>
          )}
        </div>
      </div>

      {/* Signature Link Modal */}
      {showSignatureModal && signatureUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lien de signature</h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Envoyez ce lien au client pour qu'il puisse signer le bon de commande sur son téléphone. Le lien expire dans 24 heures.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-800 break-all font-mono">{signatureUrl}</p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={copyToClipboard} className="flex-1">
                Copier le lien
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSignatureModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Réservation</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Date de réservation</dt>
              <dd className="font-medium">{formatDate(order.reservation_date)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">N° de réservation</dt>
              <dd className="font-medium">{order.reservation_number || order.reference}</dd>
            </div>
          </dl>
        </div>

        {/* Operator Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Exploitant</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-gray-500 text-sm">Nom</dt>
              <dd className="font-medium">{order.operator_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Adresse</dt>
              <dd>
                {order.operator_address} {order.operator_address_number}
                <br />
                {order.operator_postal_code} {order.operator_locality}
              </dd>
            </div>
            {order.operator_bce_number && (
              <div>
                <dt className="text-gray-500 text-sm">N° BCE</dt>
                <dd>{order.operator_bce_number}</dd>
              </div>
            )}
            {order.operator_authorization_number && (
              <div>
                <dt className="text-gray-500 text-sm">N° Autorisation</dt>
                <dd>
                  {order.operator_authorization_number}
                  {order.operator_authorization_date &&
                    ` (${formatDate(order.operator_authorization_date)})`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Client Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Client</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-gray-500 text-sm">Nom</dt>
              <dd className="font-medium">{order.client_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Adresse</dt>
              <dd>
                {order.client_address} {order.client_address_number}
                <br />
                {order.client_postal_code} {order.client_locality}
              </dd>
            </div>
            <div className="flex space-x-4">
              {order.client_phone && (
                <div>
                  <dt className="text-gray-500 text-sm">Tél</dt>
                  <dd>{order.client_phone}</dd>
                </div>
              )}
              {order.client_gsm && (
                <div>
                  <dt className="text-gray-500 text-sm">GSM</dt>
                  <dd>{order.client_gsm}</dd>
                </div>
              )}
            </div>
            <div>
              <dt className="text-gray-500 text-sm">Passagers</dt>
              <dd>
                {order.passengers_adult} adulte(s), {order.passengers_child} enfant(s)
              </dd>
            </div>
          </dl>
        </div>

        {/* Service Info */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Service</h2>
          <p className="font-medium mb-4">
            {order.service_type === 'aller'
              ? 'Aller'
              : order.service_type === 'retour'
              ? 'Retour'
              : 'Aller/Retour'}
          </p>

          {/* Trip Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2"></th>
                {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
                  <th className="text-center py-2">Aller</th>
                )}
                {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
                  <th className="text-center py-2">Retour</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Date</td>
                {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{formatDate(order.aller_date)}</td>
                )}
                {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{formatDate(order.retour_date)}</td>
                )}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Heure</td>
                {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{formatTime(order.aller_time)}</td>
                )}
                {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{formatTime(order.retour_time)}</td>
                )}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Départ</td>
                {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{order.aller_departure || '-'}</td>
                )}
                {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{order.retour_departure || '-'}</td>
                )}
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Destination</td>
                {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{order.aller_destination || '-'}</td>
                )}
                {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">{order.retour_destination || '-'}</td>
                )}
              </tr>
              <tr>
                <td className="py-2 text-gray-500">Prix/pers.</td>
                {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">
                    {order.aller_price ? `${order.aller_price} €` : '-'}
                  </td>
                )}
                {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
                  <td className="text-center py-2">
                    {order.retour_price ? `${order.retour_price} €` : '-'}
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <Link to="/orders">
          <Button variant="secondary">Retour à la liste</Button>
        </Link>
        <div className="space-x-2">
          <Link to={`/orders/${order.id}/edit`}>
            <Button variant="secondary">Modifier</Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </div>
    </div>
  )
}
