import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PasswordLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSwitchToRegister?: () => void;
  onSwitchToGoogle?: () => void;
  isLoading: boolean;
  showGoogleOption: boolean;
  showRegisterOption: boolean;
  showForgotPassword?: boolean;
}

const PasswordLogin = ({
  onLogin,
  onSwitchToRegister,
  onSwitchToGoogle,
  isLoading,
  showGoogleOption,
  showRegisterOption,
  showForgotPassword,
}: PasswordLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !username || !password}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          'Sign In'
        )}
      </Button>
      {showForgotPassword && (
        <Link
          to="/forgot-password"
          className="block text-center text-sm text-primary hover:underline"
        >
          Forgot your password?
        </Link>
      )}
      {showRegisterOption && onSwitchToRegister && (
        <Button
          type="button"
          variant="link"
          onClick={onSwitchToRegister}
          className="w-full"
        >
          Create an account
        </Button>
      )}
      {showGoogleOption && onSwitchToGoogle && (
        <Button
          type="button"
          variant="ghost"
          onClick={onSwitchToGoogle}
          className="w-full text-muted-foreground"
        >
          Back to Google Sign-In
        </Button>
      )}
    </form>
  );
};

export default PasswordLogin;
