import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../services/api'
import type { ClientCreate } from '../types'

export function useClientSearch(query: string) {
  return useQuery({
    queryKey: ['clients', 'search', query],
    queryFn: () => clientsApi.search(query),
    enabled: query.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  })
}

export function useFindOrCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientCreate) => clientsApi.findOrCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
