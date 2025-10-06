import { cn } from "../../lib/utils";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = ({ className, ...props }: LabelProps) => {
  return (
    <label 
        className={cn("text-sm font-medium text-text-primary mb-2 block", className)} 
        {...props} 
    />
  )
}

export default Label;