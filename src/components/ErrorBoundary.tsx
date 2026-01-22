import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error?: unknown;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Log for debugging; prevents silent white screens
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearSessionAndReload = () => {
    try {
      // Clears corrupted auth/session cache that can cause crashes on boot.
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to clear storage:", e);
    }
    window.location.reload();
  };

  private getErrorText = () => {
    const err = this.state.error;
    if (!err) return null;
    if (err instanceof Error) return `${err.name}: ${err.message}`;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  render() {
    if (this.state.hasError) {
      const errorText = this.getErrorText();
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold">
              {this.props.fallbackTitle ?? "Algo salió mal"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocurrió un error inesperado. Puedes intentar recargar la página.
            </p>

            {errorText ? (
              <pre className="mt-4 max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
                {errorText}
              </pre>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Button onClick={this.handleReload}>Recargar</Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Intentar de nuevo
              </Button>
              <Button variant="outline" onClick={this.handleClearSessionAndReload}>
                Limpiar sesión
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
