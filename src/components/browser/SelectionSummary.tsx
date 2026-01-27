import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Download, Loader2, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { FileSize } from '~/components/common/FileSize';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
import { Button } from '~/components/ui/button';
import { submitExport } from '~/server/functions/export';
import { useSelectionStore } from '~/store/selectionStore';

type SelectionSummaryProps = {
  userEmail?: string | undefined;
};

const emailSchema = z.string().trim().min(1, 'Email is required').email('Please enter a valid email address');

export const SelectionSummary = ({ userEmail }: SelectionSummaryProps) => {
  const navigate = useNavigate();
  const { getSelectedFiles, getTotalSelectedSize, clearSelection, getPendingInfo } = useSelectionStore();

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showEmailInput && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [showEmailInput]);

  const selectedFiles = getSelectedFiles();
  const totalSize = getTotalSelectedSize();
  const { pendingCollections, pendingItems } = getPendingInfo();
  const hasPending = pendingCollections > 0 || pendingItems > 0;

  const exportMutation = useMutation({
    mutationFn: (email: string) =>
      submitExport({
        data: {
          files: selectedFiles.map((f) => ({
            id: f.id,
            filename: f.filename,
            size: f.size,
            memberOf: f.memberOf,
          })),
          email,
        },
      }),
    onSuccess: (result) => {
      if (result.success) {
        clearSelection();
        setShowEmailInput(false);
        setEmailInput('');
        navigate({ to: '/export-status' });
      }
    },
  });

  const handleExport = () => {
    if (userEmail) {
      exportMutation.mutate(userEmail);
    } else {
      setShowEmailInput(true);
      setEmailError(null);
    }
  };

  const handleEmailSubmit = () => {
    const result = emailSchema.safeParse(emailInput);

    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? 'Invalid email');

      return;
    }

    setEmailError(null);
    exportMutation.mutate(result.data);
  };

  const handleCancelEmailInput = () => {
    setShowEmailInput(false);
    setEmailInput('');
    setEmailError(null);
  };

  const handleClear = () => {
    clearSelection();
  };

  if (selectedFiles.length === 0 && !hasPending) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-400 border-t shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </span>
            <span className="text-sm text-muted-foreground">
              Total: <FileSize bytes={totalSize} className="font-medium" />
            </span>

            {hasPending && (
              <span className="text-sm text-amber-800 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading more...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClear} disabled={exportMutation.isPending || showEmailInput}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>

            {showEmailInput ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <input
                      ref={emailInputRef}
                      type="email"
                      value={emailInput}
                      onChange={(e) => {
                        setEmailInput(e.target.value);
                        setEmailError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEmailSubmit();
                        } else if (e.key === 'Escape') {
                          handleCancelEmailInput();
                        }
                      }}
                      placeholder="Enter your email address"
                      className="h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      disabled={exportMutation.isPending}
                    />
                    <Button size="sm" onClick={handleEmailSubmit} disabled={exportMutation.isPending}>
                      {exportMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1" />
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEmailInput} disabled={exportMutation.isPending}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {emailError && <span className="text-xs text-destructive mt-1">{emailError}</span>}
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleExport}
                disabled={exportMutation.isPending || hasPending}
                title={hasPending ? 'Please wait for all files to load' : undefined}
              >
                {exportMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {exportMutation.error && <div className="mt-2 text-sm text-destructive">Error: {exportMutation.error.message}</div>}
      </div>
    </div>
  );
};
