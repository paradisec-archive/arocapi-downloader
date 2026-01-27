import { formatFileSize } from '~/shared/formatters';

type FileSizeProps = {
  bytes: number;
  className?: string;
};

export { formatFileSize };

export const FileSize = ({ bytes, className }: FileSizeProps) => {
  return <span className={className}>{formatFileSize(bytes)}</span>;
};
