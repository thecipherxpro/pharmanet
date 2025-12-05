import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

class OnboardingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Onboarding Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
            <p className="text-gray-600 mb-4">
              The onboarding process encountered an error.
            </p>
            {this.state.error && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs font-mono text-red-600 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                variant="outline"
                className="w-full h-12"
              >
                Clear Cache & Reload
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default OnboardingErrorBoundary;