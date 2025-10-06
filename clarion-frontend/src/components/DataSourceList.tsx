import { useState } from 'react';
import { Link, Github, Upload, Plus, X } from 'lucide-react';
import IndexingStatusIndicator, { Status } from './IndexingStatusIndicator';

export type DataSourceType = 'url' | 'github' | 'upload';

export interface DataSource {
  id: string;
  type: DataSourceType;
  value: string;
  status: Status;
}

interface DataSourceListProps {
  sources: DataSource[];
  onAddSource: (source: Omit<DataSource, 'id' | 'status'>) => void;
  onRemoveSource: (id: string) => void;
  isIndexing: boolean;
}

const DataSourceList = ({ sources, onAddSource, onRemoveSource, isIndexing }: DataSourceListProps) => {
  const [type, setType] = useState<DataSourceType>('url');
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onAddSource({ type, value });
      setValue('');
    }
  };

  const getIcon = (type: DataSourceType) => {
    switch (type) {
      case 'url': return <Link className="w-5 h-5 text-text-secondary" />;
      case 'github': return <Github className="w-5 h-5 text-text-secondary" />;
      case 'upload': return <Upload className="w-5 h-5 text-text-secondary" />;
    }
  };

  const getPlaceholder = (type: DataSourceType) => {
     switch (type) {
      case 'url': return 'https://example.com/docs';
      case 'github': return 'https://github.com/owner/repo';
      case 'upload': return 'Select a file';
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
        <div className="relative">
           <select
            value={type}
            onChange={(e) => setType(e.target.value as DataSourceType)}
            className="appearance-none bg-gray-dark border border-gray-light rounded-l-md py-2 pl-3 pr-8 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="url">URL</option>
            <option value="github">GitHub</option>
            <option value="upload">Upload</option>
          </select>
        </div>
        <input
          type={type === 'upload' ? 'file' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={getPlaceholder(type)}
          className="flex-grow bg-gray-dark border border-gray-light py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue rounded-r-md"
          disabled={isIndexing}
        />
        <button type="submit" className="bg-accent-green hover:bg-green-600 text-white p-2 rounded-md disabled:bg-gray-light" disabled={isIndexing}>
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {sources.length > 0 ? sources.map((source) => (
          <div key={source.id} className="flex items-center bg-gray-dark p-3 rounded-md border border-gray-light">
            <div className="mr-3">{getIcon(source.type)}</div>
            <p className="flex-grow text-sm text-text-secondary truncate mr-4" title={source.value}>
              {source.value}
            </p>
            <div className="flex items-center gap-3">
              <IndexingStatusIndicator status={source.status} />
              <button onClick={() => onRemoveSource(source.id)} className="text-text-secondary hover:text-red-500" disabled={isIndexing}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )) : (
          <p className="text-center text-text-secondary py-4">No data sources added yet.</p>
        )}
      </div>
    </div>
  );
};

export default DataSourceList;