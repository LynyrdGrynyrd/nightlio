import { useState, FormEvent, useCallback } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { cn } from '@/lib/utils';
import { validatePasswordStrength, validateUsername, getStrengthColor } from '../../utils/passwordValidation';

interface RegistrationFormProps {
  onRegister: (username: string, password: string, email: string, name: string) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading: boolean;
}

const RegistrationForm = ({
  onRegister,
  onSwitchToLogin,
  isLoading,
}: RegistrationFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: '', errors: [] as string[] });

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    if (value) {
      const validation = validateUsername(value);
      setUsernameError(validation.valid ? '' : validation.errors[0]);
    } else {
      setUsernameError('');
    }
  }, []);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (value) {
      const validation = validatePasswordStrength(value);
      setPasswordStrength({
        score: validation.score,
        strength: validation.strength,
        errors: validation.errors,
      });
    } else {
      setPasswordStrength({ score: 0, strength: '', errors: [] });
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onRegister(username, password, email, name || username);
  };

  const handleBack = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setName('');
    setUsernameError('');
    setPasswordStrength({ score: 0, strength: '', errors: [] });
    onSwitchToLogin();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username">Username</Label>
        <Input
          id="reg-username"
          type="text"
          placeholder="Choose a username"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
          className={cn(usernameError && "border-destructive")}
        />
        {usernameError && (
          <p className="text-xs text-destructive">{usernameError}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            disabled={isLoading}
            autoComplete="new-password"
            className={cn("pr-10", passwordStrength.errors.length > 0 && "border-destructive")}
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
        {password && passwordStrength.strength && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Progress value={(passwordStrength.score / 5) * 100} className="h-1 flex-1" />
              <span
                className="text-xs font-medium"
                style={{ color: getStrengthColor(passwordStrength.score) }}
              >
                {passwordStrength.strength}
              </span>
            </div>
            {passwordStrength.errors.length > 0 && (
              <p className="text-xs text-destructive">{passwordStrength.errors[0]}</p>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !username || !password}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Creating account…
          </>
        ) : (
          'Create Account'
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="w-full text-muted-foreground"
      >
        Back to Sign In
      </Button>
    </form>
  );
};

export default RegistrationForm;
