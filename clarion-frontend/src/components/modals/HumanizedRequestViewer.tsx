import { useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/Accordion';
import CodeViewer from '../ui/CodeViewer';

interface HumanizedRequestViewerProps {
  jsonString: string;
}

const HumanizedRequestViewer = ({ jsonString }: HumanizedRequestViewerProps) => {
  const parsedData = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonString);
      // Safely extract data with fallbacks
      const systemMessage = parsed.input?.find((msg: any) => msg.role === 'system')?.content || 'Not provided in this request.';
      const userMessage = parsed.input?.find((msg: any) => msg.role === 'user')?.content || 'Not provided in this request.';
      const parameters = {
        model: parsed.model,
        temperature: parsed.temperature,
        top_p: parsed.top_p,
        max_output_tokens: parsed.max_output_tokens,
        reasoning_effort: parsed.reasoning?.effort,
      };
      const outputSchema = parsed.text?.format?.schema || { info: 'No structured output schema provided for this request.' };
      
      return { systemMessage, userMessage, parameters, outputSchema, error: null };
    } catch (e) {
      return { 
        systemMessage: '', userMessage: '', parameters: {}, outputSchema: {}, 
        error: `Could not parse request JSON: ${(e as Error).message}` 
      };
    }
  }, [jsonString]);

  if (parsedData.error) {
    return (
      <div className="p-4 text-red-400 bg-red-500/10 rounded-md">
        <p className="font-bold">Error</p>
        <p>{parsedData.error}</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <Accordion type="multiple" defaultValue={['item-2', 'item-3']} className="w-full space-y-2">
        <AccordionItem value="item-1" className="border border-gray-light rounded-md bg-gray-dark/50">
          <AccordionTrigger className="p-3">Model & Parameters</AccordionTrigger>
          <AccordionContent>
            <CodeViewer content={JSON.stringify(parsedData.parameters, null, 2)} readOnly />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="border border-gray-light rounded-md bg-gray-dark/50">
          <AccordionTrigger className="p-3">System Prompt</AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-gray-dark rounded-b-md">
                <pre className="whitespace-pre-wrap text-sm font-sans">{parsedData.systemMessage}</pre>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="border border-gray-light rounded-md bg-gray-dark/50">
          <AccordionTrigger className="p-3">User Prompt & Codebase Context</AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-gray-dark rounded-b-md max-h-[40vh] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans">{parsedData.userMessage}</pre>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4" className="border border-gray-light rounded-md bg-gray-dark/50">
          <AccordionTrigger className="p-3">Output Schema</AccordionTrigger>
          <AccordionContent>
             <CodeViewer content={JSON.stringify(parsedData.outputSchema, null, 2)} readOnly />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default HumanizedRequestViewer;