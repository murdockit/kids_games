import { Component, type ReactNode } from 'react';

interface State { hasError: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white px-6 text-center">
          <p className="text-6xl">😕</p>
          <p className="text-2xl font-extrabold text-gray-700">Oops! Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="bg-kidblue text-white font-bold rounded-2xl px-6 py-3 text-lg"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
