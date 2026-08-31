import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-loading" role="alert">
          <p>Something went wrong loading this page.</p>
          <button type="button" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
