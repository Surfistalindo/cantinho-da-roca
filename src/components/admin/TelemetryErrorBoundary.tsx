import React from "react";
import { telemetry, trackUiError } from "@/lib/telemetry";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  scope?: string;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class TelemetryErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    telemetry.track({
      level: "error",
      category: "ui",
      message: error.message || "Erro de renderização",
      stack: error.stack,
      context: { scope: this.props.scope, componentStack: info.componentStack },
    });
  }

  reset = () => {
    trackUiError("Boundary reset manual", { scope: this.props.scope });
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <p className="font-medium text-foreground">Algo quebrou nesta área</p>
            <p className="text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={this.reset}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
