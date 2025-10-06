import { Bot, FileCode2, Bot as OutputSchemaIcon, Fingerprint, LucideIcon } from 'lucide-react';

export interface MarketplaceItem {
  id: string;
  type: 'agent' | 'prompt' | 'schema' | 'filter_set';
  name: string;
  author: string;
  description: string;
  version: string;
  downloads: number;
  likes: number;
  icon: LucideIcon;
  tags: string[];
  createdAt: string; // ISO date string
}

export const marketplaceItems: MarketplaceItem[] = [
  {
    id: 'agent-01',
    type: 'agent',
    name: 'React Component Generator',
    author: 'Jane Doe',
    description: 'A powerful agent that generates high-quality, production-ready React components from a simple description. It automatically includes boilerplate, prop types, and basic styling to accelerate your development workflow.',
    version: '1.4.2',
    downloads: 12503,
    likes: 2300,
    icon: Bot,
    tags: ['React', 'UI', 'Component', 'TypeScript'],
    createdAt: '2025-09-10T10:00:00Z',
  },
  {
    id: 'agent-02',
    type: 'agent',
    name: 'Python Docstring Writer',
    author: 'PyCommunity',
    description: 'Automatically analyzes and writes comprehensive, Google-style docstrings for any Python function or class. Saves you time and improves code documentation.',
    version: '1.1.0',
    downloads: 8741,
    likes: 1200,
    icon: Bot,
    tags: ['Python', 'Docs', 'Refactoring'],
    createdAt: '2025-09-05T14:30:00Z',
  },
  {
    id: 'prompt-01',
    type: 'prompt',
    name: 'Explain Code Like I am 5',
    author: 'ELI5Master',
    description: 'A system prompt designed to make any code explanation simple, clear, and easy to understand using helpful analogies.',
    version: '1.0.0',
    downloads: 25341,
    likes: 5600,
    icon: Fingerprint,
    tags: ['Learning', 'Explanation', 'Beginner'],
    createdAt: '2025-08-20T11:00:00Z',
  },
  {
    id: 'schema-01',
    type: 'schema',
    name: 'Standard File Operations',
    author: 'Pepe Corp',
    description: 'A robust JSON schema for file operations: create, modify, and delete files. Ensures reliable output for any agent that interacts with the filesystem.',
    version: '2.0.0',
    downloads: 54102,
    likes: 9800,
    icon: OutputSchemaIcon,
    tags: ['Filesystem', 'Utility', 'JSON'],
    createdAt: '2025-08-01T09:00:00Z',
  },
  {
    id: 'filter-set-01',
    type: 'filter_set',
    name: 'Standard JavaScript Project',
    author: 'JS Guild',
    description: 'Includes common JS file types while excluding node_modules, dist, and log files. Perfect for focusing the AI on your source code.',
    version: '1.0.0',
    downloads: 18943,
    likes: 3100,
    icon: FileCode2,
    tags: ['JavaScript', 'Filter', 'Workspace'],
    createdAt: '2025-09-12T15:00:00Z',
  },
];
