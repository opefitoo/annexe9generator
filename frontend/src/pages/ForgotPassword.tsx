import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Button } from '../components/common'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSubmitted(true)
      toast.success('Email envoyé si le compte existe')
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-4">Vérifiez votre email</h2>
            <p className="text-gray-600 mb-6">
              Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe.
            </p>
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Retour à la connexion
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
            Réinitialisation du mot de passe
          </p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2 text-center">Mot de passe oublié ?</h2>
          <p className="text-gray-600 text-sm mb-6 text-center">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
          <form onSubmit={handleSubmit}>
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="exemple@email.com"
            />
            <Button type="submit" loading={loading} className="w-full mt-4">
              Envoyer le lien
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
