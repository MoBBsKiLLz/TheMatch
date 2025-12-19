import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';
import { VStack } from './ui/vstack';
import { Heading } from './ui/heading';
import { Text } from './ui/text';
import { Button, ButtonText } from './ui/button';
import { logger } from '@/lib/utils/logger';
import { captureException, setContext } from '@/lib/utils/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and display React errors gracefully
 * Automatically reports errors to Sentry in production
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error locally
    logger.error('React Error Boundary caught an error', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
    });

    // Send to Sentry with full context
    setContext('errorBoundary', {
      componentStack: errorInfo.componentStack,
    });
    captureException(error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <View className="flex-1 bg-background-0 justify-center items-center p-6">
          <VStack space="xl" className="max-w-md items-center">
            <Heading size="2xl" className="text-typography-900 text-center">
              Oops! Something went wrong
            </Heading>

            <Text className="text-typography-600 text-center">
              We're sorry, but something unexpected happened. The error has been logged
              and we'll look into it.
            </Text>

            {__DEV__ && this.state.error && (
              <VStack space="sm" className="w-full bg-error-50 p-4 rounded-lg">
                <Text className="text-error-700 font-semibold">
                  Error: {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text className="text-error-600 text-xs">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </VStack>
            )}

            <VStack space="md" className="w-full">
              <Button
                size="lg"
                action="primary"
                onPress={this.handleReset}
                className="w-full"
              >
                <ButtonText>Try Again</ButtonText>
              </Button>

              <Button
                size="md"
                variant="outline"
                action="secondary"
                onPress={() => {
                  // In a real app, this could navigate to home or reload the app
                  this.handleReset();
                }}
                className="w-full"
              >
                <ButtonText>Go to Home</ButtonText>
              </Button>
            </VStack>

            {!__DEV__ && (
              <Text className="text-typography-400 text-sm text-center">
                If this problem persists, please contact support.
              </Text>
            )}
          </VStack>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary alternative for functional components
 * Note: This doesn't actually catch errors, it's just a placeholder
 * Use the class-based ErrorBoundary component above for actual error catching
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      logger.error('Error caught by useErrorHandler', error);
      throw error; // Re-throw to be caught by ErrorBoundary
    }
  }, [error]);

  return setError;
}
