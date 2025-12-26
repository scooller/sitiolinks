import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Container, Alert, Button } from 'react-bootstrap';
import { withTranslation, type WithTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props & WithTranslation, State> {
  constructor(props: Props & WithTranslation) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    
    
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to logging service (e.g., Sentry, LogRocket)
    // logErrorToService(error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container className="mt-5 py-5">
          <div className="text-center mb-4">
            <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '4rem' }}></i>
          </div>
          
          <Alert variant="danger" className="shadow-sm">
            <Alert.Heading className="d-flex align-items-center gap-2">
              <i className="fas fa-bug"></i>
              {this.props.t('error_boundary.title')}
            </Alert.Heading>
            <p className="mb-0">
              {this.props.t('error_boundary.message')}
            </p>
          </Alert>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <Button variant="primary" onClick={this.handleReload}>
              <i className="fas fa-sync-alt me-2"></i>
              {this.props.t('error_boundary.reload')}
            </Button>
            <Button variant="outline-primary" onClick={this.handleGoHome}>
              <i className="fas fa-home me-2"></i>
              {this.props.t('error_boundary.go_home')}
            </Button>
          </div>

          {(import.meta as any).env?.DEV && this.state.error && (
            <details className="mt-4">
              <summary className="cursor-pointer text-muted">
                <small>{this.props.t('error_boundary.show_details_dev')}</small>
              </summary>
              <pre className="mt-3 p-3 bg-light border rounded" style={{ fontSize: '0.85rem', overflow: 'auto' }}>
                <strong>{this.props.t('error_boundary.error_label')}:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    {'\n\n'}
                    <strong>{this.props.t('error_boundary.stack_label')}:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
        </Container>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
