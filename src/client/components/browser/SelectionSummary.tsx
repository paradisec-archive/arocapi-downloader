import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { FileSize } from '@/components/common/FileSize';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useSelectionStore } from '@/store/selectionStore';

type SelectionSummaryProps = {
  userEmail?: string;
};

export const SelectionSummary = ({ userEmail }: SelectionSummaryProps) => {
  const navigate = useNavigate();
  const {
    getSelectedFiles,
    getTotalSelectedSize,
    audioQuality,
    videoQuality,
    clearSelection,
    getPendingInfo,
  } = useSelectionStore();

  const selectedFiles = getSelectedFiles();
  const totalSize = getTotalSelectedSize();
  const { pendingCollections, pendingItems } = getPendingInfo();
  const hasPending = pendingCollections > 0 || pendingItems > 0;

  const exportMutation = useMutation({
    mutationFn: (email: string) =>
      api.submitExport({
        files: selectedFiles.map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          memberOf: f.memberOf,
        })),
        email,
      }),
    onSuccess: () => {
      clearSelection();
      navigate({ to: '/export-status' });
    },
  });

  const handleExport = () => {
    const email = userEmail || prompt('Enter your email address:');
    if (email) {
      exportMutation.mutate(email);
    }
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={exportMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>

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
          </div>
        </div>

        {exportMutation.error && (
          <div className="mt-2 text-sm text-destructive">Error: {exportMutation.error.message}</div>
        )}
      </div>
    </div>
  );
};
