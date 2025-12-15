import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // You can log errorInfo if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-100 text-red-800 p-6 rounded m-6">
          <h2>Something went wrong...</h2>
          <pre>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
