import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Input, Button } from '../components/common'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

export function ResetPassword() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (!token) {
      setError('Token invalide')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password, confirmPassword)
      setSuccess(true)
      toast.success('Mot de passe réinitialisé avec succès')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null
      setError(errorMessage || 'Le lien est invalide ou a expiré')
      toast.error('Erreur lors de la réinitialisation')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">Annex 9 Generator</h1>
          </div>

          <div className="card text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-4">Mot de passe réinitialisé</h2>
            <p className="text-gray-600 mb-6">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
            </p>
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Se connecter maintenant
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">Annex 9 Generator</h1>
          <p className="text-gray-600 mt-2">
            Nouveau mot de passe
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2 text-center">Réinitialiser le mot de passe</h2>
          <p className="text-gray-600 text-sm mb-6 text-center">
            Choisissez un nouveau mot de passe sécurisé.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Nouveau mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              helpText="Minimum 8 caractères"
            />
            <Input
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <Button type="submit" loading={loading} className="w-full mt-4">
              Réinitialiser le mot de passe
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
