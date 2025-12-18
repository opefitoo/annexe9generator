export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_staff: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}
