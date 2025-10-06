import React from 'react';
import { AgentPersona, iconMap } from '../data/agent-personas';
import Button from './ui/Button';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';
import { Edit } from 'lucide-react';

interface AgentCardProps {
  agent: AgentPersona;
  onClick: (id: string) => void;
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

const AgentCard = ({ agent, onClick }: AgentCardProps) => {
  const { bg, border } = getColorPalette(agent.id);
  const Icon = iconMap[agent.icon] || iconMap.default;

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        onClick={() => onClick(agent.id)}
        className="bg-gray-medium/50 border border-gray-light rounded-lg flex flex-col group relative overflow-hidden transition-all duration-300 hover:border-accent-blue/50 hover:shadow-xl hover:shadow-accent-blue/10 hover:-translate-y-1 cursor-pointer"
      >
        <header className='flex items-center gap-4 p-4 border-b border-gray-light/50'>
          <div className={cn('p-2 rounded-lg border flex-shrink-0', bg, border)}>
            <Icon className='w-6 h-6 text-text-primary' />
          </div>
          <div>
            <h3 className="font-bold text-md text-text-primary">{agent.name}</h3>
            <p className="text-sm text-text-secondary">by {agent.author}</p>
          </div>
        </header>

        <div className='p-4 flex-grow flex flex-col'>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className='text-sm text-text-secondary mb-4 flex-grow line-clamp-2'>
                {agent.description}
              </p>
            </TooltipTrigger>
            <TooltipContent className='max-w-xs'>
              <p>{agent.description}</p>
            </TooltipContent>
          </Tooltip>
          <span className='text-xs text-text-secondary'>v{agent.version}</span>
        </div>

        <footer className='p-4 border-t border-gray-light/50 mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
           <Button size='sm' className='w-full' tabIndex={-1}>
              <Edit size={16} className='mr-2'/> Edit Agent
            </Button>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default React.memo(AgentCard);