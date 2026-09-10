"use client";

import { Component, type ReactNode } from "react";
import { ErrorState } from "@repo/ui/errorState";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          message={this.state.error?.message || "An unexpected error occurred."}
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}
