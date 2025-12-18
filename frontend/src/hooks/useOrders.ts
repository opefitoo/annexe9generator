import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, pdfApi } from '../services/api'
import type { OrderCreate, OrderFilters } from '../types'
import toast from 'react-hot-toast'

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.list(filters),
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OrderCreate) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Bon de commande créé avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création du bon de commande')
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrderCreate> }) =>
      ordersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] })
      toast.success('Bon de commande mis à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour')
    },
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Bon de commande supprimé')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression')
    },
  })
}

export function useGeneratePdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => pdfApi.generate(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      toast.success('PDF généré avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la génération du PDF')
    },
  })
}
