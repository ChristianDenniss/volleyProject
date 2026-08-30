/**
 * ErrorBoundary — the top-level React error boundary that catches a render crash anywhere in the routed tree and shows a recoverable notice instead of a blank page.
 * `handleRetry` clears the error state so a transient failure (a chunk that failed to load, a bad response shape) can be retried without a full reload.
 * Lives in `components/layout/`; App wraps the route Suspense in it — pages do not need their own.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from '@/components/ui/buttons/Button'
import ErrorNotice from '@/components/ui/feedback/ErrorNotice'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled UI error:', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-page">
          <ErrorNotice
            title="Something went wrong"
            message="This page failed to load. Retrying usually fixes it."
            action={
              <Button variant="secondary" size="sm" onClick={this.handleRetry}>
                Try again
              </Button>
            }
            className="max-w-lg"
          />
        </div>
      )
    }

    return this.props.children
  }
}
