import { useCallback, useEffect, useState } from 'react';
import { Flame, LogOut, Sun, Moon, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import { ThemeId, useTheme } from '../contexts/ThemeContext';
import { useToast } from './ui/ToastProvider';
import useHotkeyManager from '../hooks/useHotkeyManager';
import SearchPlaceholder from './search/SearchPlaceholder';
import SearchModal from './search/SearchModal';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface HeaderProps {
  currentStreak: number;
}

const NIGHT_THEMES = new Set<ThemeId>(['night-journal', 'dark', 'ocean', 'forest', 'sunset', 'lavender', 'midnight', 'oled']);

const Header = ({ currentStreak }: HeaderProps) => {
  const { user, logout, isMockMode } = useAuth();
  useConfig();
  const navigate = useNavigate();
  const { theme, cycle } = useTheme();
  const themeCycleIcon = NIGHT_THEMES.has(theme) ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />;
  useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Use centralized hotkey manager for '/' search shortcut
  const handleSearchShortcut = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  useHotkeyManager('/', handleSearchShortcut, [handleSearchShortcut]);

  useEffect(() => {
    const openSearch = () => setIsSearchOpen(true);
    window.addEventListener('twilightio:open-search', openSearch);
    return () => window.removeEventListener('twilightio:open-search', openSearch);
  }, []);

  return (
    <header className="h-16 border-b border-border/70 bg-card/90 backdrop-blur sticky top-0 z-20 px-3 sm:px-4 md:px-6 flex items-center gap-2 shadow-sm">
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {isMockMode && (
          <Badge variant="secondary" className="bg-destructive/80 hover:bg-destructive text-destructive-foreground gap-1 animate-pulse">
            🎭 MOCK
          </Badge>
        )}
        {currentStreak > 0 && (
          <Badge variant="secondary" className="gap-1.5 hidden sm:flex">
            <Flame size={14} className="text-[color:var(--warning)] fill-[color:var(--warning)]" aria-hidden="true" />
            <span>{currentStreak} day rhythm</span>
          </Badge>
        )}
      </div>

      <div
        className="flex-1 min-w-0 max-w-xl lg:max-w-2xl xl:max-w-3xl mx-1 sm:mx-4 lg:mx-8 cursor-pointer"
        onClick={() => setIsSearchOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsSearchOpen(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Open search"
      >
        <SearchPlaceholder />
      </div>

      {user && (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={cycle}
            aria-label={`Current theme: ${theme}. Click to change theme`}
            className="hidden sm:inline-flex rounded-full"
          >
            {themeCycleIcon}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full">
                <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                  <AvatarImage src={user.avatar_url} alt={user.name || ''} />
                  <AvatarFallback>{(user.name || user.email || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
};

export default Header;
