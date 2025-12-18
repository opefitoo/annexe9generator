import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks'
import { Input, Button } from '../components/common'
import toast from 'react-hot-toast'

export function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ username, password })
      toast.success('Connexion réussie')
    } catch {
      toast.error('Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Annex 9 Generator</h1>
          <p className="text-gray-600 mt-2">
            Générateur de bons de commande pour taxis collectifs
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-6 text-center">Connexion</h2>
          <form onSubmit={handleSubmit}>
            <Input
              label="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full mt-4">
              Se connecter
            </Button>
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Mot de passe oublié ?
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Wallonie - Services de taxis collectifs
        </p>
      </div>
    </div>
  )
}
