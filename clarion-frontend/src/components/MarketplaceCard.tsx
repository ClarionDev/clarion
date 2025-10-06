import React, { useState } from 'react';
import { MarketplaceItem } from '../data/marketplace-items';
import { Check, Heart, Bookmark } from 'lucide-react';
import Button from './ui/Button';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';

interface MarketplaceCardProps {
  item: MarketplaceItem;
}

const colorPalettes = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/50' },
  { bg: 'bg-green-500/10', border: 'border-green-500/50' },
  { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
  { bg: 'bg-pink-500/10', border: 'border-pink-500/50' },
];

const getColorPalette = (id: string) => {
  const hashCode = id.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const index = Math.abs(hashCode) % colorPalettes.length;
  return colorPalettes[index];
};

const MarketplaceCard = ({ item }: MarketplaceCardProps) => {
  const [isAdded, setIsAdded] = useState(false);
  const [likes, setLikes] = useState(item.likes);
  const [isLiked, setIsLiked] = useState(false);

  const handleAdd = () => setIsAdded(true);
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const { bg, border } = getColorPalette(item.id);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-gray-medium/50 border border-gray-light rounded-lg flex flex-col group relative overflow-hidden transition-all duration-300 hover:border-accent-blue/50 hover:shadow-lg hover:shadow-accent-blue/10">
        {/* Header */}
        <header className='flex items-center gap-4 p-4 border-b border-gray-light/50'>
          <div className={cn('p-2 rounded-lg border flex-shrink-0', bg, border)}>
            <item.icon className='w-6 h-6 text-text-primary' />
          </div>
          <div>
            <h3 className="font-bold text-md text-text-primary">{item.name}</h3>
            <p className="text-sm text-text-secondary">by {item.author}</p>
          </div>
        </header>

        {/* Body */}
        <div className='p-4 flex-grow flex flex-col'>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className='text-sm text-text-secondary mb-4 flex-grow line-clamp-2'>
                {item.description}
              </p>
            </TooltipTrigger>
            <TooltipContent className='max-w-xs'>
              <p>{item.description}</p>
            </TooltipContent>
          </Tooltip>
          <div className='flex flex-wrap gap-2 mb-4'>
              {item.tags.map(tag => (
                  <span key={tag} className='text-xs bg-gray-light/50 px-2 py-1 rounded'>{tag}</span>
              ))}
          </div>
          <span className='text-xs text-text-secondary'>v{item.version}</span>
        </div>

        {/* Footer */}
        <footer className='p-4 border-t border-gray-light/50 flex items-center justify-between mt-auto'>
           <Button size='sm' className='w-3/5' onClick={handleAdd} disabled={isAdded}>
              {isAdded ? <><Check size={16} className='mr-2'/> Added</> : 'Add'}
            </Button>
            <div className='flex items-center gap-2'>
               <button onClick={handleLike} className={cn('flex items-center gap-1.5 p-2 rounded-md text-text-secondary hover:bg-gray-light/50', { 'text-pink-500': isLiked })}>
                  <Heart size={16}/>
                  <span className='text-xs font-medium'>{likes.toLocaleString()}</span>
               </button>
               <button className='p-2 rounded-md text-text-secondary hover:bg-gray-light/50'>
                  <Bookmark size={16} />
               </button>
            </div>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default React.memo(MarketplaceCard);