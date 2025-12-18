import { useForm } from 'react-hook-form'
import { useEffect } from 'react'
import { Input, Button, Select } from '../components/common'
import { useOperatorConfig, useUpdateOperatorConfig } from '../hooks'
import type { OperatorConfigUpdate } from '../types'

const titleOptions = [
  { value: 'Madame', label: 'Madame' },
  { value: 'Monsieur', label: 'Monsieur' },
  { value: 'Société', label: 'Société' },
]

export function SettingsPage() {
  const { data: operatorConfig, isLoading } = useOperatorConfig()
  const updateOperator = useUpdateOperatorConfig()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<OperatorConfigUpdate>()

  // Reset form when data loads
  useEffect(() => {
    if (operatorConfig) {
      reset({
        title: operatorConfig.title,
        name: operatorConfig.name,
        address: operatorConfig.address,
        address_number: operatorConfig.address_number,
        postal_code: operatorConfig.postal_code,
        locality: operatorConfig.locality,
        bce_number: operatorConfig.bce_number,
        authorization_number: operatorConfig.authorization_number,
        authorization_date: operatorConfig.authorization_date || undefined,
      })
    }
  }, [operatorConfig, reset])

  const onSubmit = async (data: OperatorConfigUpdate) => {
    // Convert empty strings to null for date field
    const cleanedData = {
      ...data,
      authorization_date: data.authorization_date || null,
    }
    await updateOperator.mutateAsync(cleanedData)
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 mt-1">
          Configurez les informations de l'exploitant qui seront pré-remplies dans les nouveaux bons de commande.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">
            Informations de l'exploitant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Titre"
              options={titleOptions}
              required
              {...register('title')}
            />
            <Input
              label="Nom"
              required
              {...register('name', { required: 'Nom requis' })}
              error={errors.name?.message}
            />
            <Input
              label="Adresse"
              required
              {...register('address', { required: 'Adresse requise' })}
              error={errors.address?.message}
            />
            <Input
              label="N°"
              {...register('address_number')}
            />
            <Input
              label="Code postal"
              required
              {...register('postal_code', {
                required: 'Code postal requis',
                pattern: {
                  value: /^\d{4,5}$/,
                  message: 'Code postal invalide',
                },
              })}
              error={errors.postal_code?.message}
            />
            <Input
              label="Localité"
              required
              {...register('locality', { required: 'Localité requise' })}
              error={errors.locality?.message}
            />
            <Input
              label="N° BCE"
              {...register('bce_number')}
              helpText="Numéro à la Banque-Carrefour des Entreprises"
            />
            <Input
              label="N° d'autorisation"
              {...register('authorization_number')}
            />
            <Input
              label="Date d'autorisation"
              type="date"
              {...register('authorization_date')}
            />
          </div>
        </section>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={updateOperator.isPending}
            disabled={!isDirty}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      {operatorConfig && !operatorConfig.is_configured && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Note :</strong> L'exploitant n'est pas encore configuré. Veuillez remplir les informations ci-dessus pour qu'elles soient automatiquement pré-remplies dans les nouveaux bons de commande.
          </p>
        </div>
      )}
    </div>
  )
}
