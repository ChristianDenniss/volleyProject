/**
 * Login — the sign-in screen: username/password against the site account, or a Roblox SSO handoff.
 * It also surfaces the two failure states the Roblox OAuth callback can redirect back with (`roblox=error`, `roblox=need_signup`), which arrive as query params rather than through the login hook.
 * Lives in `components/`; routed at /login.
 */
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '@/hooks/useLogin'
import { startRobloxOAuth } from '@/hooks/useTeamRegistrations'

import AuthCard from '@/components/ui/layout/AuthCard'
import Button from '@/components/ui/buttons/Button'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error } = useLogin()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [oauthError, setOauthError] = useState<string | null>(null)

  // The Roblox OAuth callback redirects back here with its outcome in the query string.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('roblox') === 'error') {
      setOauthError(params.get('message') || 'Roblox login failed')
    }
    if (params.get('roblox') === 'need_signup') {
      setOauthError('No account linked to that Roblox user. Sign up with Roblox instead.')
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (await login(username, password)) {
      navigate('/')
    }
  }

  return (
    <AuthCard
      title="Login"
      error={error || oauthError}
      sso={
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            void startRobloxOAuth('login').catch((e) => setOauthError(String(e.message || e)))
          }
        >
          Log in with Roblox
        </Button>
      }
      footer={
        <>
          Don&rsquo;t have an account?{' '}
          <Link to="/signup" className="font-medium text-accent no-underline hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Username" required>
          {(id) => (
            <TextInput
              id={id}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}
        </FormField>

        <FormField label="Password" required>
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
        </FormField>

        <Button type="submit" fullWidth loading={loading} loadingLabel="Logging in…">
          Login
        </Button>
      </form>
    </AuthCard>
  )
}
