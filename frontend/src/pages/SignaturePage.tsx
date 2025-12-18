import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useOrderByToken, useSubmitSignature } from '../hooks'
import { SignatureCanvas } from '../components/SignatureCanvas'
import { Button } from '../components/common'

export function SignaturePage() {
  const { token } = useParams<{ token: string }>()
  const { data: order, isLoading, error } = useOrderByToken(token)
  const submitSignature = useSubmitSignature()
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-gray-600">
            Ce lien de signature n'est plus valide. Veuillez contacter l'exploitant pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-'
    return timeStr.substring(0, 5)
  }

  const handleSaveSignature = async () => {
    if (!signatureData || !token) return

    try {
      await submitSignature.mutateAsync({
        token,
        signatureData,
      })
      setSaved(true)
    } catch (err) {
      console.error('Error saving signature:', err)
    }
  }

  // Calculate total price
  const calculateTotal = () => {
    const passengers = (order.passengers_adult || 0) + (order.passengers_child || 0)
    let total = 0
    if (order.service_type === 'aller' || order.service_type === 'aller_retour') {
      total += (order.aller_price || 0) * passengers
    }
    if (order.service_type === 'retour' || order.service_type === 'aller_retour') {
      total += (order.retour_price || 0) * passengers
    }
    return total.toFixed(2)
  }

  // Already signed
  if ((order as any).has_signature) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Déjà signé</h1>
          <p className="text-gray-600">
            Ce bon de commande a déjà été signé.
          </p>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signature enregistrée</h1>
          <p className="text-gray-600 mb-4">Merci, votre signature a été enregistrée avec succès.</p>
          <p className="text-sm text-gray-500">
            Référence: {order.reference}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-primary-600 text-white px-4 py-6 text-center">
        <h1 className="text-xl font-bold">Bon de commande</h1>
        <p className="text-primary-100 text-sm mt-1">{order.reference}</p>
      </div>

      {/* Order Recap */}
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Service Summary Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Récapitulatif du service
          </h2>

          <div className="space-y-3">
            {/* Service Type */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Type</span>
              <span className="font-semibold text-gray-900">
                {order.service_type === 'aller'
                  ? 'Aller'
                  : order.service_type === 'retour'
                  ? 'Retour'
                  : 'Aller/Retour'}
              </span>
            </div>

            {/* Passengers */}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Passagers</span>
              <span className="font-semibold text-gray-900">
                {(order.passengers_adult || 0) + (order.passengers_child || 0)} pers.
                <span className="text-gray-500 text-sm ml-1">
                  ({order.passengers_adult || 0} ad. + {order.passengers_child || 0} enf.)
                </span>
              </span>
            </div>

            {/* Aller Details */}
            {(order.service_type === 'aller' || order.service_type === 'aller_retour') && (
              <div className="py-2 border-b border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-primary-600">Aller</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.aller_date)} à {formatTime(order.aller_time)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-16 text-gray-400">De:</span>
                    <span>{order.aller_departure || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-gray-400">Vers:</span>
                    <span>{order.aller_destination || '-'}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="w-16 text-gray-400">Prix:</span>
                    <span className="font-medium">{order.aller_price ? `${order.aller_price} €/pers.` : '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Retour Details */}
            {(order.service_type === 'retour' || order.service_type === 'aller_retour') && (
              <div className="py-2 border-b border-gray-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-primary-600">Retour</span>
                  <span className="text-sm text-gray-500">
                    {formatDate(order.retour_date)} à {formatTime(order.retour_time)}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-16 text-gray-400">De:</span>
                    <span>{order.retour_departure || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-16 text-gray-400">Vers:</span>
                    <span>{order.retour_destination || '-'}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="w-16 text-gray-400">Prix:</span>
                    <span className="font-medium">{order.retour_price ? `${order.retour_price} €/pers.` : '-'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center py-3 bg-gray-50 -mx-4 px-4 rounded-b-xl">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-primary-600">{calculateTotal()} €</span>
            </div>
          </div>
        </div>

        {/* Client Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Client
          </h2>
          <div className="text-gray-900">
            <p className="font-semibold">{order.client_title} {order.client_name}</p>
            <p className="text-sm text-gray-600">
              {order.client_address} {order.client_address_number}
            </p>
            <p className="text-sm text-gray-600">
              {order.client_postal_code} {order.client_locality}
            </p>
          </div>
        </div>

        {/* Operator Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Exploitant
          </h2>
          <div className="text-gray-900">
            <p className="font-semibold">{order.operator_title} {order.operator_name}</p>
            <p className="text-sm text-gray-600">
              {order.operator_address} {order.operator_address_number}
            </p>
            <p className="text-sm text-gray-600">
              {order.operator_postal_code} {order.operator_locality}
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Signature du client
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            En signant, je confirme avoir pris connaissance des conditions du service et accepte la réservation.
          </p>

          <div className="flex justify-center">
            <SignatureCanvas
              onSignatureChange={setSignatureData}
              width={Math.min(320, window.innerWidth - 64)}
              height={160}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pb-6">
          <Button
            onClick={handleSaveSignature}
            loading={submitSignature.isPending}
            disabled={!signatureData}
            className="w-full py-4 text-lg"
          >
            Confirmer et signer
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-xs text-gray-400 pb-4">
          <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Signature chiffrée et sécurisée
        </div>
      </div>
    </div>
  )
}
