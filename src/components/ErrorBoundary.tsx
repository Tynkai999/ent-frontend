import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

/** Sans ceci, une exception pendant le rendu (page/route quelconque)
 * démonte tout l'arbre React et laisse une page blanche silencieuse — on
 * préfère afficher l'erreur pour pouvoir la diagnostiquer. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Erreur applicative non interceptée :', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">Une erreur est survenue</p>
          <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-4 max-w-xl overflow-auto text-left whitespace-pre-wrap">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.assign('/login')}
            className="mt-4 text-sm text-primary hover:text-primary-dark font-medium"
          >
            Retour à la connexion
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
