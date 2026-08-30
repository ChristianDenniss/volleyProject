/**
 * SignUp — the account creation screen: username, email and a confirmed password, or a Roblox SSO handoff.
 * Password confirmation is checked in the form (not by the hook) and surfaces as a field-level error rather than an alert; on success it shows a confirmation and redirects to /login after a short pause, cancelling the timer if the user navigates away first.
 * Lives in `components/`; routed at /signup.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignup } from '@/hooks/useSignUp'
import { startRobloxOAuth } from '@/hooks/useTeamRegistrations'

import AuthCard from '@/components/ui/layout/AuthCard'
import Button from '@/components/ui/buttons/Button'
import FormField from '@/components/ui/inputs/FormField'
import TextInput from '@/components/ui/inputs/TextInput'

const REDIRECT_DELAY_MS = 2000

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, loading, error, clearError } = useSignup()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [ssoError, setSsoError] = useState<string | null>(null)

  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (redirectTimeout.current) clearTimeout(redirectTimeout.current)
    },
    []
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (password !== confirm) {
      setConfirmError('Passwords do not match.')
      return
    }

    setConfirmError(null)
    clearError()
    setSuccess(null)

    if (await signup(username, password, email)) {
      setSuccess('Account created successfully! Redirecting to login…')
      redirectTimeout.current = setTimeout(() => navigate('/login'), REDIRECT_DELAY_MS)
    }
  }

  return (
    <AuthCard
      title="Sign Up"
      error={error || ssoError}
      success={success}
      sso={
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            void startRobloxOAuth('signup').catch((e) => setSsoError(String(e.message || e)))
          }
        >
          Sign up with Roblox
        </Button>
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent no-underline hover:underline">
            Log in
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

        <FormField label="Email" required>
          {(id) => (
            <TextInput
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}
        </FormField>

        <FormField label="Password" required hint="At least 6 characters.">
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
        </FormField>

        <FormField label="Confirm Password" required error={confirmError}>
          {(id) => (
            <TextInput
              id={id}
              type="password"
              autoComplete="new-password"
              invalid={Boolean(confirmError)}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          )}
        </FormField>

        <Button type="submit" fullWidth loading={loading} loadingLabel="Signing up…">
          Sign Up
        </Button>
      </form>
    </AuthCard>
  )
}
