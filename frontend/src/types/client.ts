import type { TitleType } from './order'

export interface Client {
  id: string
  title: TitleType
  name: string
  address: string
  address_number: string
  postal_code: string
  locality: string
  phone: string
  gsm: string
  created_at: string
  updated_at: string
}

export interface ClientCreate {
  title?: TitleType
  name: string
  address: string
  address_number?: string
  postal_code: string
  locality: string
  phone?: string
  gsm?: string
}

export interface ClientSearchResponse {
  items: Client[]
}

export interface ClientListResponse {
  items: Client[]
  total: number
}
