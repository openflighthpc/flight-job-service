import React from 'react';

export const DefaultErrorMessage = () => (
  <div className="card">
    <div className="card-body">
      <h3>An error has occurred</h3>
      <p>
        Unfortunately there has been a problem handling your request. Please
        try again and, if problems persist, help us to more quickly rectify
        the problem by contacting us and letting us know what you were trying
        to do when the error occurred.
      </p>
    </div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static defaultProps = {
    fallback: DefaultErrorMessage,
  };

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  // componentDidCatch(error, errorInfo) {
  //   // XXX Add sentry error reporting here.
  // }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback();
      }
      return this.props.fallback;
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
