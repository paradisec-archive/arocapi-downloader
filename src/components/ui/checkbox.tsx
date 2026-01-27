import * as React from 'react';
import { cn } from '~/lib/utils';

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ className, onCheckedChange, onChange, indeterminate, ...props }, ref) => {
  const internalRef = React.useRef<HTMLInputElement>(null);

  // biome-ignore lint/style/noNonNullAssertion: React ref is always set after mount
  React.useImperativeHandle(ref, () => internalRef.current!);

  React.useEffect(() => {
    if (internalRef.current) {
      internalRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  return (
    <input
      type="checkbox"
      className={cn(
        'h-4 w-4 shrink-0 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-primary',
        className,
      )}
      ref={internalRef}
      onChange={handleChange}
      {...props}
    />
  );
});
Checkbox.displayName = 'Checkbox';

export { Checkbox };
