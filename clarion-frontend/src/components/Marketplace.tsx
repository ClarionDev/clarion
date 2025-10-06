import { useState, useMemo } from 'react';
import { Search, Bot, Fingerprint, Bot as OutputSchemaIcon, FileCode2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { marketplaceItems } from '../data/marketplace-items';
import MarketplaceCard from './MarketplaceCard';

type MarketplaceCategory = 'all' | 'agent' | 'prompt' | 'schema' | 'filter_set';
type SortByType = 'downloads' | 'newest';

const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>('all');
  const [sortBy, setSortBy] = useState<SortByType>('downloads');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'agent', label: 'Agents', icon: Bot },
    { id: 'prompt', label: 'System Prompts', icon: Fingerprint },
    { id: 'schema', label: 'Output Schemas', icon: OutputSchemaIcon },
    { id: 'filter_set', label: 'Filter Sets', icon: FileCode2 },
  ];

  const filteredAndSortedItems = useMemo(() => {
    let items = activeCategory === 'all' 
        ? marketplaceItems 
        : marketplaceItems.filter(item => item.type === activeCategory);

    if (sortBy === 'downloads') {
      items.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return items;
  }, [activeCategory, sortBy]);

  return (
    <div className="h-full w-full bg-gray-medium rounded-lg border border-gray-light overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-light flex-shrink-0">
          <h2 className="text-xl font-bold mb-1">Marketplace</h2>
          <p className="text-sm text-text-secondary">Discover community-made agents, prompts, and more to enhance your workflow.</p>
      </div>
      
      {/* Filters and Controls */}
      <div className='p-4 flex-shrink-0 border-b border-gray-light'>
        <div className='flex justify-between items-center flex-wrap gap-4'>
            <div className='flex items-center border border-gray-light rounded-lg p-1'>
                {categories.map(cat => (
                    <button 
                    key={cat.id} 
                    onClick={() => setActiveCategory(cat.id as MarketplaceCategory)}
                    className={cn('py-2 px-4 text-sm font-medium flex items-center gap-2 rounded-md', {
                        'bg-gray-dark text-text-primary': activeCategory === cat.id,
                        'text-text-secondary hover:text-text-primary': activeCategory !== cat.id
                    })}
                    >
                    {cat.icon && <cat.icon size={16}/>} {cat.label}
                    </button>
                ))}
            </div>
            <div className='flex items-center gap-4'>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input type="text" placeholder="Search..." className="w-full bg-gray-dark/50 border border-gray-light/50 rounded-md py-2 pl-9 pr-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm"/>
                </div>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as SortByType)}
                    className='bg-gray-dark/50 border border-gray-light/50 rounded-md py-2 px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue'
                >
                    <option value="downloads">Most Popular</option>
                    <option value="newest">Newest</option>
                </select>
            </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-grow overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedItems.map(item => (
                <MarketplaceCard key={item.id} item={item} />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;