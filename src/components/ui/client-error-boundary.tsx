"use client";

import React, { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
};

type State = { error: Error | null };

/** Catches render errors without killing the whole screen. */
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
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="space-y-3 rounded-2xl bg-white p-4 text-center text-black">
          <p className="text-[15px] font-semibold">Could not load this form</p>
          <p className="text-[13px] text-[#6B6B6B]">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="flex min-h-12 w-full items-center justify-center rounded-full bg-black text-[15px] font-semibold text-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
