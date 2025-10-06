import { cn } from '../lib/utils';

export type Status = 'Pending' | 'Indexing' | 'Complete' | 'Error';

interface IndexingStatusIndicatorProps {
  status: Status;
}

const statusStyles: Record<Status, string> = {
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Indexing: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
  Complete: 'bg-green-500/20 text-green-400 border-green-500/30',
  Error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const IndexingStatusIndicator = ({ status }: IndexingStatusIndicatorProps) => {
  return (
    <div
      className={cn(
        'px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status]
      )}
    >
      {status}
    </div>
  );
};

export default IndexingStatusIndicator;