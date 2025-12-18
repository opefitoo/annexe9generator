import { useQuery, useMutation } from '@tanstack/react-query'
import { signaturesApi } from '../services/api'
import type { Order } from '../types'

// Get order by signature token (public, no auth)
export function useOrderByToken(token: string | undefined) {
  return useQuery<Order>({
    queryKey: ['order-by-token', token],
    queryFn: () => signaturesApi.getOrderByToken(token!),
    enabled: !!token,
    retry: false,
  })
}

// Submit signature (public, no auth)
export function useSubmitSignature() {
  return useMutation({
    mutationFn: ({ token, signatureData }: { token: string; signatureData: string }) =>
      signaturesApi.submitSignature(token, signatureData),
  })
}

// Generate signature link (authenticated)
export function useGenerateSignatureLink() {
  return useMutation({
    mutationFn: ({ orderId, hoursValid = 24 }: { orderId: string; hoursValid?: number }) =>
      signaturesApi.generateLink(orderId, hoursValid),
  })
}

// Get signature status (authenticated) - polls every 5s when waiting for signature
export function useSignatureStatus(orderId: string | undefined) {
  return useQuery({
    queryKey: ['signature-status', orderId],
    queryFn: () => signaturesApi.getStatus(orderId!),
    enabled: !!orderId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if no signature yet
      if (query.state.data && !query.state.data.has_client_signature) {
        return 5000
      }
      return false // Stop polling once signed
    },
  })
}
