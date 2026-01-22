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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
            <h1 className="text-lg font-semibold">
              {this.props.fallbackTitle ?? "Algo salió mal"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ocurrió un error inesperado. Puedes intentar recargar la página.
            </p>
            <div className="mt-4 flex gap-2">
              <Button onClick={this.handleReload}>Recargar</Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                Intentar de nuevo
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
