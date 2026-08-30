/**
 * AuthCard — the centered narrow panel the sign-in and sign-up screens live in: a title, an optional error and success notice, the form, an SSO divider, and a footer line linking to the other screen.
 * It exists so the two auth screens can't drift apart — they share one width, one heading scale and one place for the "or continue with" divider.
 * Lives in `components/ui/layout/`; not for general page content — use `PageContainer width="narrow"` for that.
 */
import type { ReactNode } from 'react'
import ErrorNotice from '../feedback/ErrorNotice'

interface Props {
  title: string
  children: ReactNode
  /** Validation or server error. Rendered above the form. */
  error?: string | null
  /** Confirmation message, e.g. "Account created". Rendered above the form. */
  success?: string | null
  /** Single-sign-on action, shown under a divider below the form. */
  sso?: ReactNode
  /** Trailing line, e.g. "Don't have an account? Sign up". */
  footer?: ReactNode
  className?: string
}

export default function AuthCard({
  title,
  children,
  error,
  success,
  sso,
  footer,
  className = '',
}: Props) {
  return (
    <div className={`mx-auto flex w-full max-w-md flex-col gap-5 px-page py-page ${className}`}>
      <h1 className="m-0 text-center text-2xl font-semibold text-content">{title}</h1>

      {error && <ErrorNotice message={error} />}
      {success && <ErrorNotice message={success} tone="info" />}

      <div
        className="flex flex-col gap-5 rounded-panel border border-border bg-surface p-6"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {children}

        {sso && (
          <>
            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-content-muted">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {sso}
          </>
        )}
      </div>

      {footer && <p className="m-0 text-center text-sm text-content-tertiary">{footer}</p>}
    </div>
  )
}
