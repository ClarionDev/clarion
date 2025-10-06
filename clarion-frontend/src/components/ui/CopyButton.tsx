import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  textToCopy: string;
}

const CopyButton = ({ textToCopy, className, ...props }: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'p-1.5 rounded-md text-text-secondary hover:bg-gray-light hover:text-text-primary transition-all disabled:opacity-50',
        className
      )}
      {...props}
    >
      {isCopied ? <Check className="w-4 h-4 text-accent-green" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

export default CopyButton;