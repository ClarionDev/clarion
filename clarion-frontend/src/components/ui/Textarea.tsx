import { cn } from "../../lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = ({ className, ...props }: TextareaProps) => {
  return (
    <textarea 
        className={cn(
            'w-full bg-gray-dark border border-gray-light rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm resize-y min-h-[100px]',
            className
        )} 
        {...props} 
    />
  )
}

export default Textarea;