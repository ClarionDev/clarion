import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = ({ className, ...props }: InputProps) => {
  return (
    <input 
        className={cn(
            'w-full bg-gray-dark border border-gray-light rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm',
            className
        )} 
        {...props} 
    />
  )
}

export default Input;