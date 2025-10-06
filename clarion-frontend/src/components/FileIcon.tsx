import { File, FileJson, FileCode, FileText, CodeXml, GitCommitHorizontal, FileCode2, Settings2, Folder, FolderOpen } from 'lucide-react';

interface FileIconProps {
  filename: string;
  type: 'file' | 'folder';
  isExpanded?: boolean;
}

const FileIcon = ({ filename, type, isExpanded }: FileIconProps) => {
  const iconProps = { className: 'w-4 h-4 mr-2 flex-shrink-0 text-text-secondary' };

  if (type === 'folder') {
    return isExpanded ? <FolderOpen {...iconProps} className={`${iconProps.className} text-accent-blue`} /> : <Folder {...iconProps} />;
  }

  const extension = filename.split('.').pop()?.toLowerCase();

  if (filename.endsWith('.config.js') || filename.endsWith('.config.ts')) {
    return <Settings2 {...iconProps} />
  }
  if (filename.startsWith('.git')) {
     return <GitCommitHorizontal {...iconProps} />
  }

  switch (extension) {
    case 'html':
      return <CodeXml {...iconProps} />;
    case 'tsx':
    case 'jsx':
      return <FileCode {...iconProps} />;
    case 'ts':
    case 'js':
      return <FileCode2 {...iconProps} />;
    case 'json':
      return <FileJson {...iconProps} />;
    case 'css':
      return <FileText {...iconProps} />;
    case 'md':
      return <FileText {...iconProps} />;
    case 'go':
       return <FileCode2 {...iconProps} />;
    case 'mod':
    case 'sum':
        return <FileText {...iconProps} />;
    default:
      return <File {...iconProps} />;
  }
};

export default FileIcon;