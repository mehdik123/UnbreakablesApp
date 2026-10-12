import React from 'react';
import { ClientPortalUnavailableScreen } from './ClientPortalUnavailableScreen';
import { ClientLocaleProvider } from '../contexts/ClientLocaleContext';

type Props = { children: React.ReactNode };

type State = { hasError: boolean };

/** Catches client-portal render crashes so users never fall into coach UI. */
export class ClientSafeBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Client portal crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ClientLocaleProvider>
          <ClientPortalUnavailableScreen
            onRetry={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          />
        </ClientLocaleProvider>
      );
    }
    return this.props.children;
  }
}

export default ClientSafeBoundary;
