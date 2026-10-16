import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8faf8',
          color: '#142820',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '560px',
            background: '#ffffff',
            border: '1px solid #d4e2d8',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={24} />
            </div>
            <h2 style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '20px',
              fontWeight: 800,
              margin: '0 0 10px',
              color: '#0f2942'
            }}>
              CDsimerEcoTwin Interface Notice
            </h2>
            <p style={{
              fontSize: '13.5px',
              color: '#607368',
              lineHeight: 1.6,
              margin: '0 0 20px'
            }}>
              A rendering component encountered an issue ({this.state.error?.message || 'Unexpected state'}). The application has safely recovered.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0d7353',
                color: '#ffffff',
                border: '0',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={15} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
