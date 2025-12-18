import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { Input, Select, Button } from '../common'
import { useCreateOrder, useUpdateOrder, useClientSearch, useFindOrCreateClient, useOperatorConfig } from '../../hooks'
import type { Order, OrderCreate, ServiceType, Client, TitleType } from '../../types'

interface OrderFormProps {
  order?: Order
  mode?: 'create' | 'edit'
}

const serviceTypeOptions = [
  { value: 'aller', label: 'Aller' },
  { value: 'retour', label: 'Retour' },
  { value: 'aller_retour', label: 'Aller/Retour' },
]

const titleOptions = [
  { value: 'Madame', label: 'Madame' },
  { value: 'Monsieur', label: 'Monsieur' },
  { value: 'Société', label: 'Société' },
]

export function OrderForm({ order, mode = 'create' }: OrderFormProps) {
  const navigate = useNavigate()
  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder()
  const findOrCreateClient = useFindOrCreateClient()
  const { data: operatorConfig } = useOperatorConfig()

  // Client search state
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const { data: clientSearchResults } = useClientSearch(clientSearch)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderCreate>({
    defaultValues: order
      ? {
          ...order,
          reservation_date: order.reservation_date,
          operator_authorization_date: order.operator_authorization_date || undefined,
          aller_date: order.aller_date || undefined,
          aller_time: order.aller_time || undefined,
          retour_date: order.retour_date || undefined,
          retour_time: order.retour_time || undefined,
        }
      : {
          reservation_date: new Date().toISOString().split('T')[0],
          passengers_adult: 1,
          passengers_child: 0,
          service_type: 'aller' as ServiceType,
        },
  })

  // Auto-fill operator data from config when creating new order
  useEffect(() => {
    if (mode === 'create' && operatorConfig?.is_configured) {
      setValue('operator_title', operatorConfig.title)
      setValue('operator_name', operatorConfig.name)
      setValue('operator_address', operatorConfig.address)
      setValue('operator_address_number', operatorConfig.address_number || '')
      setValue('operator_postal_code', operatorConfig.postal_code)
      setValue('operator_locality', operatorConfig.locality)
      setValue('operator_bce_number', operatorConfig.bce_number || '')
      setValue('operator_authorization_number', operatorConfig.authorization_number || '')
      if (operatorConfig.authorization_date) {
        setValue('operator_authorization_date', operatorConfig.authorization_date)
      }
    }
  }, [mode, operatorConfig, setValue])

  // Check if operator section should be shown (only in edit mode or when not configured)
  const showOperatorSection = mode === 'edit' || !operatorConfig?.is_configured

  const serviceType = watch('service_type')
  const showAller = serviceType === 'aller' || serviceType === 'aller_retour'
  const showRetour = serviceType === 'retour' || serviceType === 'aller_retour'

  // Handle client selection from dropdown
  const handleSelectClient = useCallback((client: Client) => {
    setValue('client_title', client.title || 'Monsieur')
    setValue('client_name', client.name)
    setValue('client_address', client.address)
    setValue('client_address_number', client.address_number || '')
    setValue('client_postal_code', client.postal_code)
    setValue('client_locality', client.locality)
    setValue('client_phone', client.phone || '')
    setValue('client_gsm', client.gsm || '')
    setClientSearch('')
    setShowClientDropdown(false)
  }, [setValue])

  const onSubmit = async (data: OrderCreate) => {
    try {
      // Clean up data: convert empty strings to null for optional fields
      const cleanedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          // Convert empty strings to null for date/time fields
          if (value === '' && (key.includes('_date') || key.includes('_time'))) {
            return [key, null]
          }
          return [key, value]
        })
      ) as OrderCreate

      // Save/update client in database
      if (cleanedData.client_name && cleanedData.client_locality) {
        await findOrCreateClient.mutateAsync({
          title: cleanedData.client_title,
          name: cleanedData.client_name,
          address: cleanedData.client_address,
          address_number: cleanedData.client_address_number,
          postal_code: cleanedData.client_postal_code,
          locality: cleanedData.client_locality,
          phone: cleanedData.client_phone,
          gsm: cleanedData.client_gsm,
        })
      }

      if (mode === 'edit' && order) {
        await updateOrder.mutateAsync({ id: order.id, data: cleanedData })
        navigate(`/orders/${order.id}`)
      } else {
        const newOrder = await createOrder.mutateAsync(cleanedData)
        navigate(`/orders/${newOrder.id}`)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const isLoading = createOrder.isPending || updateOrder.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Reservation Section */}
      <section className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
          Informations de réservation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date de réservation"
            type="date"
            required
            {...register('reservation_date', { required: 'Date requise' })}
            error={errors.reservation_date?.message}
          />
          <Input
            label="N° de réservation"
            {...register('reservation_number')}
            helpText="Laissez vide pour génération automatique"
          />
        </div>
      </section>

      {/* Warning if operator not configured */}
      {mode === 'create' && !operatorConfig?.is_configured && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-800">
                Configuration exploitant requise
              </h3>
              <p className="mt-2 text-red-700">
                Les informations de l'exploitant ne sont pas configurées. Veuillez les configurer dans les paramètres avant de créer un bon de commande.
              </p>
              <Link
                to="/settings"
                className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Configurer l'exploitant
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Operator Section - Only shown in edit mode */}
      {showOperatorSection && (
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            Exploitant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Titre"
              options={titleOptions}
              required
              {...register('operator_title')}
            />
            <Input
              label="Nom"
              required
              {...register('operator_name', { required: 'Nom requis' })}
              error={errors.operator_name?.message}
            />
            <Input
              label="Adresse"
              required
              {...register('operator_address', { required: 'Adresse requise' })}
              error={errors.operator_address?.message}
            />
            <Input
              label="N°"
              {...register('operator_address_number')}
              className="w-24"
            />
            <Input
              label="Code postal"
              required
              {...register('operator_postal_code', {
                required: 'Code postal requis',
                pattern: {
                  value: /^\d{4,5}$/,
                  message: 'Code postal invalide',
                },
              })}
              error={errors.operator_postal_code?.message}
            />
            <Input
              label="Localité"
              required
              {...register('operator_locality', { required: 'Localité requise' })}
              error={errors.operator_locality?.message}
            />
            <Input
              label="N° BCE"
              {...register('operator_bce_number')}
              helpText="Numéro à la Banque-Carrefour des Entreprises"
            />
            <Input
              label="N° d'autorisation"
              {...register('operator_authorization_number')}
            />
            <Input
              label="Date d'autorisation"
              type="date"
              {...register('operator_authorization_date')}
            />
          </div>
        </section>
      )}

      {/* Client Section */}
      <section className="card">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Client
          </h2>
          {/* Client Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={clientSearch}
              onChange={(e) => {
                setClientSearch(e.target.value)
                setShowClientDropdown(e.target.value.length >= 2)
              }}
              onFocus={() => clientSearch.length >= 2 && setShowClientDropdown(true)}
              onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
              className="w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {showClientDropdown && clientSearchResults?.items && clientSearchResults.items.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {clientSearchResults.items.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">
                      {client.address}, {client.postal_code} {client.locality}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showClientDropdown && clientSearchResults?.items && clientSearchResults.items.length === 0 && clientSearch.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500">
                Aucun client trouvé
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Titre"
            options={titleOptions}
            required
            {...register('client_title')}
          />
          <Input
            label="Nom"
            required
            {...register('client_name', { required: 'Nom requis' })}
            error={errors.client_name?.message}
          />
          <Input
            label="Adresse"
            required
            {...register('client_address', { required: 'Adresse requise' })}
            error={errors.client_address?.message}
          />
          <Input
            label="N°"
            {...register('client_address_number')}
            className="w-24"
          />
          <Input
            label="Code postal"
            required
            {...register('client_postal_code', {
              required: 'Code postal requis',
              pattern: {
                value: /^\d{4,5}$/,
                message: 'Code postal invalide',
              },
            })}
            error={errors.client_postal_code?.message}
          />
          <Input
            label="Localité"
            required
            {...register('client_locality', { required: 'Localité requise' })}
            error={errors.client_locality?.message}
          />
          <Input label="Téléphone" type="tel" {...register('client_phone')} />
          <Input label="GSM" type="tel" {...register('client_gsm')} />
        </div>
      </section>

      {/* Service Section */}
      <section className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
          Service
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            label="Type de service"
            options={serviceTypeOptions}
            required
            {...register('service_type')}
          />
          <Input
            label="Nombre d'adultes"
            type="number"
            min="0"
            {...register('passengers_adult', { valueAsNumber: true })}
          />
          <Input
            label="Nombre d'enfants (-12 ans)"
            type="number"
            min="0"
            {...register('passengers_child', { valueAsNumber: true })}
          />
        </div>

        {/* Aller Trip Details */}
        {showAller && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3 text-gray-700">
              Trajet Aller
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                {...register('aller_date')}
              />
              <Input
                label="Heure"
                type="time"
                {...register('aller_time')}
              />
              <Input
                label="Lieu de départ"
                {...register('aller_departure')}
              />
              <Input
                label="Destination"
                {...register('aller_destination')}
              />
              <Input
                label="Prix par personne (€)"
                type="number"
                step="0.01"
                min="0"
                {...register('aller_price', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}

        {/* Retour Trip Details */}
        {showRetour && (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-3 text-gray-700">
              Trajet Retour
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                {...register('retour_date')}
              />
              <Input
                label="Heure"
                type="time"
                {...register('retour_time')}
              />
              <Input
                label="Lieu de départ"
                {...register('retour_departure')}
              />
              <Input
                label="Destination"
                {...register('retour_destination')}
              />
              <Input
                label="Prix par personne (€)"
                type="number"
                step="0.01"
                min="0"
                {...register('retour_price', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Annuler
        </Button>
        <Button type="submit" loading={isLoading}>
          {mode === 'edit' ? 'Mettre à jour' : 'Créer le bon de commande'}
        </Button>
      </div>
    </form>
  )
}
