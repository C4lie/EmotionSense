import React from "react";
import { ShieldAlert, RotateCcw } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 shadow-sm">
            <CardContent className="p-8 text-center space-y-6">
              <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <ShieldAlert className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  An unexpected error occurred in the application. Please try reloading the page.
                </p>
              </div>
              {this.state.error && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left overflow-x-auto max-h-32 text-xs font-mono text-zinc-400">
                  {this.state.error.toString()}
                </div>
              )}
              <Button
                onClick={this.handleReset}
                variant="primary"
                className="w-full inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" /> Reload Application
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
