import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import GoogleSignIn from './GoogleSignIn';
import PasswordLogin from './PasswordLogin';
import RegistrationForm from './RegistrationForm';

const FALLBACK_GOOGLE_CLIENT_ID =
  (import.meta.env && import.meta.env.VITE_GOOGLE_CLIENT_ID) || null;

type AuthView = 'google' | 'password' | 'register';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const { config } = useConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentView, setCurrentView] = useState<AuthView>('google');

  const googleClientId = useMemo(
    () => config.google_client_id || FALLBACK_GOOGLE_CLIENT_ID,
    [config.google_client_id],
  );

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.classList.add('login-page-active');

    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Set initial view based on config
  useEffect(() => {
    if (!config.enable_google_oauth) {
      setCurrentView('password');
    }
  }, [config.enable_google_oauth]);

  const handleGoogleSuccess = useCallback(
    async (credential: string) => {
      setMessage('');
      const result = await login(credential);
      if (!result.success) {
        setMessage(result.error || 'Login failed. Please try again.');
      } else {
        navigate('/dashboard', { replace: true });
      }
    },
    [login, navigate],
  );

  const handlePasswordLogin = useCallback(
    async (username: string, password: string) => {
      if (!username || !password) {
        setMessage('Username and password are required');
        return;
      }

      setIsLoading(true);
      setMessage('');

      try {
        const result = await login(undefined, { username, password });
        if (!result.success) {
          setMessage(result.error || 'Login failed. Please try again.');
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Login with username/password failed.', error);
        setMessage('Login failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate],
  );

  const handleRegistration = useCallback(
    async (username: string, password: string, email: string, name: string) => {
      if (!username || !password) {
        setMessage('Username and password are required');
        return;
      }

      setIsLoading(true);
      setMessage('');

      try {
        const result = await login(undefined, { username, password, email, name, isRegistration: true });
        if (!result.success) {
          setMessage(result.error || 'Registration failed. Please try again.');
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Registration failed.', error);
        setMessage('Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [login, navigate],
  );

  const handleSelfHostContinue = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.location.reload();
  }, []);

  const isSelfHost = !config.enable_google_oauth && !config.enable_registration;
  const showGoogleLogin = config.enable_google_oauth;

  const getDescription = () => {
    if (isSelfHost) {
      return 'Click continue to start using Twilightio locally.';
    }
    if (showGoogleLogin && currentView === 'google') {
      return 'Sign in to continue tracking your mood journey.';
    }
    return 'Sign in with your username and password to continue.';
  };

  const renderAuthContent = () => {
    if (isSelfHost) {
      return (
        <Button
          className="w-full"
          onClick={handleSelfHostContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Loading…
            </>
          ) : (
            'Continue'
          )}
        </Button>
      );
    }

    if (currentView === 'google' && showGoogleLogin && googleClientId) {
      return (
        <GoogleSignIn
          googleClientId={googleClientId}
          onSuccess={handleGoogleSuccess}
          onError={setMessage}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onSwitchToPassword={() => setCurrentView('password')}
        />
      );
    }

    if (currentView === 'register') {
      return (
        <RegistrationForm
          onRegister={handleRegistration}
          onSwitchToLogin={() => setCurrentView('password')}
          isLoading={isLoading}
        />
      );
    }

    return (
      <PasswordLogin
        onLogin={handlePasswordLogin}
        onSwitchToRegister={config.enable_registration ? () => setCurrentView('register') : undefined}
        onSwitchToGoogle={showGoogleLogin ? () => setCurrentView('google') : undefined}
        isLoading={isLoading}
        showGoogleOption={!!showGoogleLogin}
        showRegisterOption={!!config.enable_registration}
      />
    );
  };

  return (
    <div className="login-page">
      <Card className="w-full max-w-[420px] shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Twilightio logo" width={32} height={32} className="w-8 h-8 object-contain" />
            <CardTitle className="text-3xl font-extrabold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
              Twilightio
            </CardTitle>
          </div>
          <CardDescription className="text-base">Your daily mood companion.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {getDescription()}
          </p>

          {message && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm text-center">
              {message}
            </div>
          )}

          {renderAuthContent()}
        </CardContent>

        <CardFooter className="justify-center text-xs text-muted-foreground gap-2">
          <Lock size={12} aria-hidden="true" />
          <span>
            {isSelfHost
              ? 'No external authentication required.'
              : 'Your data is secure and private.'}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
