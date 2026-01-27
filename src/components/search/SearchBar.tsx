import { useNavigate } from '@tanstack/react-router';
import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

type SearchBarProps = {
  initialQuery?: string;
  className?: string;
};

export const SearchBar = ({ initialQuery = '', className }: SearchBarProps) => {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update local state when initialQuery changes (e.g., from URL)
  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const navigateToSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        navigate({
          to: '/search',
          search: { q: query.trim(), page: 1 },
        });
      }
    },
    [navigate],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce navigation
    if (newValue.trim()) {
      debounceRef.current = setTimeout(() => {
        navigateToSearch(newValue);
      }, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Clear debounce and navigate immediately
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (value.trim()) {
        navigateToSearch(value);
      }
    }
  };

  const handleClear = () => {
    setValue('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    navigate({ to: '/browser' });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search collections and items..."
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-64 pl-8 pr-8"
      />
      {value && (
        <Button variant="ghost" size="icon-xs" className="absolute right-1.5" onClick={handleClear} aria-label="Clear search">
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};
