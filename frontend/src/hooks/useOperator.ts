import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { operatorApi } from '../services/api'
import type { OperatorConfigUpdate } from '../types'
import toast from 'react-hot-toast'

export function useOperatorConfig() {
  return useQuery({
    queryKey: ['operator'],
    queryFn: () => operatorApi.get(),
  })
}

export function useUpdateOperatorConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OperatorConfigUpdate) => operatorApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator'] })
      toast.success('Configuration exploitant mise à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })
}
