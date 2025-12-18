import type { TitleType } from './order'

export interface OperatorConfig {
  title: TitleType
  name: string
  address: string
  address_number: string
  postal_code: string
  locality: string
  bce_number: string
  authorization_number: string
  authorization_date: string | null
  updated_at: string
  is_configured: boolean
}

export interface OperatorConfigUpdate {
  title?: TitleType
  name?: string
  address?: string
  address_number?: string
  postal_code?: string
  locality?: string
  bce_number?: string
  authorization_number?: string
  authorization_date?: string | null
}
