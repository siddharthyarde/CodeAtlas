import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 40, textAlign: 'center' }}>
        <div>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'rgba(239,68,68,.15)', color: '#EF4444', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: 'white' }}>Something went wrong</h2>
          <p style={{ margin: '0 0 24px', color: 'var(--text-2)', fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>
            {this.state.error?.message || 'An unexpected error occurred on this page.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--purple)', border: 0, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </div>
    );
  }
}
