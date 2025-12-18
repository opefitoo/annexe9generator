export type ServiceType = 'aller' | 'retour' | 'aller_retour'
export type OrderStatus = 'draft' | 'generated' | 'sent' | 'archived'
export type TitleType = 'Madame' | 'Monsieur' | 'Société'

export interface Order {
  id: string
  reference: string
  template_version: string
  status: OrderStatus
  language: string

  // Reservation
  reservation_date: string
  reservation_number: string

  // Operator
  operator_title: TitleType
  operator_name: string
  operator_address: string
  operator_address_number: string
  operator_postal_code: string
  operator_locality: string
  operator_bce_number: string
  operator_authorization_number: string
  operator_authorization_date: string | null

  // Client
  client_title: TitleType
  client_name: string
  client_address: string
  client_address_number: string
  client_postal_code: string
  client_locality: string
  client_phone: string
  client_gsm: string
  passengers_adult: number
  passengers_child: number

  // Service
  service_type: ServiceType

  // Trip - Aller
  aller_date: string | null
  aller_time: string | null
  aller_departure: string
  aller_destination: string
  aller_price: number | null

  // Trip - Retour
  retour_date: string | null
  retour_time: string | null
  retour_departure: string
  retour_destination: string
  retour_price: number | null

  // Metadata
  pdf_url: string | null
  created_at: string
  updated_at: string
}

export interface OrderCreate {
  reservation_date: string
  reservation_number?: string

  operator_title?: TitleType
  operator_name: string
  operator_address: string
  operator_address_number?: string
  operator_postal_code: string
  operator_locality: string
  operator_bce_number?: string
  operator_authorization_number?: string
  operator_authorization_date?: string | null

  client_title?: TitleType
  client_name: string
  client_address: string
  client_address_number?: string
  client_postal_code: string
  client_locality: string
  client_phone?: string
  client_gsm?: string
  passengers_adult: number
  passengers_child: number

  service_type: ServiceType

  aller_date?: string | null
  aller_time?: string | null
  aller_departure?: string
  aller_destination?: string
  aller_price?: number | null

  retour_date?: string | null
  retour_time?: string | null
  retour_departure?: string
  retour_destination?: string
  retour_price?: number | null
}

export interface OrderListResponse {
  items: Order[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface OrderFilters {
  search?: string
  status?: OrderStatus
  service_type?: ServiceType
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}
