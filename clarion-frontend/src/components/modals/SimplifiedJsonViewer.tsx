import { useMemo } from 'react';
import CodeViewer from '../ui/CodeViewer';

interface SimplifiedJsonViewerProps {
  jsonString: string;
}

const SimplifiedJsonViewer = ({ jsonString }: SimplifiedJsonViewerProps) => {
  const simplifiedJsonString = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);

      // --- Extract Core Components from the Raw Request ---

      const system_prompt = parsed.input?.find((msg: any) => msg.role === 'system')?.content || 'Not provided.';
      
      const userContent = parsed.input?.find((msg: any) => msg.role === 'user')?.content || '';
      
      const output_schema = parsed.text?.format?.schema || { info: 'No structured output schema provided for this request.' };
      
      // --- Split User Content into Prompt and Codebase ---
      // This logic relies on the backend's markdown formatting.
      const taskMarker = "## User's Task\n";
      const codebaseMarker = "## Codebase Context\n";
      let prompt = '';
      let codebase_context = '';

      const taskIndex = userContent.indexOf(taskMarker);
      if (taskIndex !== -1) {
        const codebasePart = userContent.substring(0, taskIndex).trim();
        prompt = userContent.substring(taskIndex + taskMarker.length).trim();
        
        if (codebasePart.startsWith(codebaseMarker)) {
            codebase_context = codebasePart.substring(codebaseMarker.length).trim();
        } else {
            codebase_context = codebasePart; // Fallback if marker is missing
        }
      } else {
        prompt = userContent; // If no markers, assume all content is the prompt
        codebase_context = "No codebase context was provided in the prompt.";
      }
      
      // --- Construct the New, Simplified Object ---
      const simplifiedObject = {
        system_prompt,
        prompt,
        codebase_context,
        output_schema,
      };

      return JSON.stringify(simplifiedObject, null, 2);
    } catch (e) {
      return JSON.stringify({ 
        error: "Failed to parse and simplify the raw JSON request.", 
        details: (e as Error).message 
      }, null, 2);
    }
  }, [jsonString]);

  return <CodeViewer content={simplifiedJsonString} readOnly showCopyButton />;
};

export default SimplifiedJsonViewer;