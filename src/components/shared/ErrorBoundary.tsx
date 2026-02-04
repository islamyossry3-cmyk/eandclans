import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                <p className="text-sm text-gray-700 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button
              onClick={this.handleReload}
              size="lg"
              className="flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
