"use client";

import React, { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
};

type State = { error: Error | null };

/** Catches render errors (e.g. Mapbox/WebGL on budget phones) without killing the whole app. */
export class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full min-h-[12rem] w-full items-center justify-center bg-[#1a1a1a] p-4 text-center text-sm text-white/80">
            This part could not load on this device.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
