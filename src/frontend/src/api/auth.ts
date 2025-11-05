import api from './client'

type LoginInput = { email: string; password: string }
type LoginResponse = { token: string }

export async function login(data: LoginInput) {
  const res = await api.post<LoginResponse>('/api/auth/login', data)
  localStorage.setItem('token', res.token)
  return res
}

export function logout() {
  localStorage.removeItem('token')
}
