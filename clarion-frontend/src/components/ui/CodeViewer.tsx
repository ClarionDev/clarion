import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import CopyButton from './CopyButton';

interface CodeViewerProps extends ReactCodeMirrorProps {
  content: string;
  showCopyButton?: boolean;
}

const CodeViewer = ({ content, showCopyButton = false, ...props }: CodeViewerProps) => {
  return (
    <div className='relative border border-gray-light rounded-md overflow-hidden h-full group'>
      {showCopyButton && (
        <div className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity'>
          <CopyButton textToCopy={content} />
        </div>
      )}
      <CodeMirror
        value={content}
        height="100%"
        extensions={[javascript({ jsx: false, typescript: false, json: true })]}
        theme={oneDark}
        style={{ height: '100%' }}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          autocompletion: false,
          editable: true,
          ...props.basicSetup
        }}
        {...props}
      />
    </div>
  );
};

export default CodeViewer;