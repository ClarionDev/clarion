import { Bot, Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="w-full p-2.5 border-b border-gray-light bg-gray-medium flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className='p-1.5 bg-gray-dark rounded-lg'>
            <Bot className="w-5 h-5 text-accent-blue" />
        </div>
        <h1 className="text-lg font-bold text-text-primary">Clarion</h1>
      </div>
      <div className="flex items-center gap-4 text-text-secondary">
        <button className='p-1 hover:text-text-primary'><Bell size={18} /></button>
        <button className='p-1 hover:text-text-primary'><User size={18} /></button>
      </div>
    </header>
  );
};

export default Header;