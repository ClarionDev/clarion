import ReactDiffViewer from 'react-diff-viewer-continued';

interface MainDiffViewerProps {
  oldValue: string;
  newValue: string;
}

const diffViewerStyles = {
  variables: {
    dark: {
      diffViewerBackground: '#1a1a1a',
      diffViewerColor: '#f0f0f0',
      addedBackground: 'rgba(16, 185, 129, 0.1)',
      addedColor: '#f0f0f0',
      removedBackground: 'rgba(239, 68, 68, 0.1)',
      removedColor: '#f0f0f0',
      wordAddedBackground: 'rgba(16, 185, 129, 0.25)',
      wordRemovedBackground: 'rgba(239, 68, 68, 0.25)',
      addedGutterBackground: 'rgba(16, 185, 129, 0.15)',
      removedGutterBackground: 'rgba(239, 68, 68, 0.15)',
      gutterBackground: '#2a2a2a',
      gutterBackgroundDark: '#1a1a1a',
      gutterColor: '#a0a0a0',
      addedGutterColor: '#a0a0a0',
      removedGutterColor: '#a0a0a0',
      diffViewerTitleBackground: '#2a2a2a',
      diffViewerTitleColor: '#f0f0f0',
      diffViewerTitleBorderColor: '#3c3c3c',
    },
  },
  line: {
    padding: '8px 4px',
  },
  marker: {
    fontSize: '1em'
  }
};

const MainDiffViewer = ({ oldValue, newValue }: MainDiffViewerProps) => {
  return (
    <div className='h-full overflow-auto'>
      <ReactDiffViewer
          oldValue={oldValue}
          newValue={newValue}
          splitView={true}
          useDarkTheme={true}
          styles={diffViewerStyles}
          showDiffOnly={false}
          hideLineNumbers={false}
      />
    </div>
  );
};

export default MainDiffViewer;