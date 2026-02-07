import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import GoogleIcon from './GoogleIcon';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          prompt: (callback?: (notification: GoogleNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
}

interface GoogleButtonOptions {
  theme: string;
  size: string;
}

interface GoogleSignInProps {
  googleClientId: string;
  onSuccess: (credential: string) => Promise<void>;
  onError: (message: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onSwitchToPassword: () => void;
}

const GoogleSignIn = ({
  googleClientId,
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
  onSwitchToPassword,
}: GoogleSignInProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  const handleGoogleResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response?.credential) {
        onError('Google response was empty. Please try again.');
        return;
      }

      setIsLoading(true);

      try {
        await onSuccess(response.credential);
      } catch (error) {
        console.error('Login with Google failed.', error);
        onError('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, setIsLoading],
  );

  const initializeGoogle = useCallback(() => {
    if (typeof window === 'undefined' || !googleClientId) {
      return undefined;
    }

    const scriptSrc = 'https://accounts.google.com/gsi/client';

    const initialize = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });
      setIsInitialized(true);
    };

    if (window.google?.accounts?.id) {
      initialize();
      return undefined;
    }

    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

    if (existingScript) {
      existingScript.addEventListener('load', initialize);
      return () => existingScript.removeEventListener('load', initialize);
    }

    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;

    const handleLoad = () => {
      initialize();
    };

    const handleError = () => {
      onError('Failed to load Google services. Please check your internet connection.');
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [googleClientId, handleGoogleResponse, onError]);

  useEffect(() => {
    return initializeGoogle();
  }, [initializeGoogle]);

  const handleGoogleLogin = useCallback(() => {
    if (typeof window === 'undefined') {
      onError('Google services not loaded. Please refresh the page.');
      return;
    }

    if (!window.google?.accounts?.id) {
      onError('Google services not loaded. Please refresh the page.');
      return;
    }

    try {
      window.google.accounts.id.prompt((notification: GoogleNotification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          document.body.appendChild(tempDiv);

          window.google!.accounts.id.renderButton(tempDiv, {
            theme: 'outline',
            size: 'large',
          });

          setTimeout(() => {
            const googleBtn = tempDiv.querySelector('div[role="button"]') as HTMLElement;
            if (googleBtn) {
              googleBtn.click();
            }
            document.body.removeChild(tempDiv);
          }, 100);
        }
      });
    } catch (error) {
      console.error('Google sign-in prompt failed.', error);
      onError('Sign-in failed. Please try refreshing the page.');
    }
  }, [onError]);

  return (
    <>
      <Button
        variant="outline"
        className="w-full bg-card hover:bg-muted text-foreground border-border"
        onClick={handleGoogleLogin}
        disabled={isLoading || !isInitialized}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        <span className="ml-3">{isLoading ? 'Signing in…' : 'Sign in with Google'}</span>
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={onSwitchToPassword}
      >
        Sign in with Username & Password
      </Button>
    </>
  );
};

export default GoogleSignIn;
