import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("UI Crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-3xl mx-auto px-5 py-10">
          <div className="glass rounded-2xl p-5 ring-soft">
            <div className="text-lg font-semibold text-white/90">Page crashed</div>
            <div className="mt-2 text-sm text-white/65">
              Open DevTools (F12) → Console to see the error.
            </div>
            <pre className="mt-3 text-xs text-rose-200 whitespace-pre-wrap break-words bg-black/20 border border-white/10 rounded-xl p-3">
              {String(this.state.error?.message || this.state.error || "Unknown error")}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
