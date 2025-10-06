import CodeMirror, { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';

interface EditorProps extends Omit<ReactCodeMirrorProps, 'value' | 'onChange' | 'extensions' | 'theme'> {
  content: string;
  onChange?: (value: string) => void;
}

const Editor = ({ content, readOnly = false, onChange, ...props }: EditorProps) => {
  return (
    <CodeMirror
      value={content}
      height="100%"
      extensions={[javascript({ jsx: true, typescript: true })]}
      theme={oneDark}
      readOnly={readOnly}
      onChange={onChange}
      style={{ height: '100%' }}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        autocompletion: false,
      }}
      {...props}
    />
  );
};

export default Editor;
