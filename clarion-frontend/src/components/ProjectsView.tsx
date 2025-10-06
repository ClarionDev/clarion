import { useAppStore } from '../store/store';
import { FolderGit, Plus, Search, FolderOpen, Trash2 } from 'lucide-react';
import Button from './ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { Project, deleteProject } from '../lib/api';
    
const ProjectsView = () => {
    const { projects, openProject, setCurrentProject, loadProjects } = useAppStore();
    const safeProjects = projects || [];

    const handleOpenProject = (project: Project) => {
        setCurrentProject(project);
        useAppStore.getState().setActiveView('file-tree');
    }

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this project from the list?")) {
            await deleteProject(projectId);
            await loadProjects();
        }
    }

    return (
        <div className='h-full w-full bg-gray-dark/30 rounded-lg overflow-hidden flex flex-col'>
            <div className="p-6 border-b border-gray-light flex-shrink-0 bg-gray-medium/30">
                <div className='flex justify-between items-start'>
                    <div>
                        <h2 className="text-2xl font-bold">Projects</h2>
                        <p className='text-text-secondary mt-1 max-w-2xl'>Manage and open your recent development projects.</p>
                    </div>
                    <Button onClick={() => openProject()}>
                        <FolderOpen size={18} className='mr-2'/> Open a Project
                    </Button>
                </div>
            </div>
    
            <div className='p-4 border-b border-gray-light flex justify-between items-center'>
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input 
                        type="text" 
                        placeholder="Search projects..." 
                        className="w-full bg-gray-dark border border-gray-light/50 rounded-md py-2 pl-9 pr-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue text-sm"/>
                </div>
                <div>
                    <p className='text-sm text-text-secondary'>{safeProjects.length} project(s)</p>
                </div>
            </div>
    
            <div className="flex-grow overflow-y-auto p-6 bg-gray-dark/50">
                {safeProjects.length > 0 ? (
                    <div className="space-y-3">
                        {safeProjects.map(project => (
                            <div key={project.id} onClick={() => handleOpenProject(project)} className='bg-gray-medium/50 border border-gray-light rounded-lg p-4 flex items-center justify-between group hover:border-accent-blue/50 transition-colors cursor-pointer'>
                                <div className='flex items-center gap-4'>
                                    <FolderGit className='w-8 h-8 text-text-secondary'/>
                                    <div>
                                        <h3 className='font-semibold text-text-primary'>{project.name}</h3>
                                        <p className='text-sm text-text-secondary font-mono truncate max-w-md' title={project.path}>{project.path}</p>
                                        <p className='text-xs text-text-secondary mt-1'>Last opened {formatDistanceToNow(new Date(project.lastOpenedAt), { addSuffix: true })}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                    <Button size="icon" variant="destructive" onClick={(e) => handleDeleteProject(e, project.id)}><Trash2 size={16}/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='flex flex-col items-center justify-center h-full text-text-secondary text-center rounded-lg border-2 border-dashed border-gray-light/50'>
                        <FolderOpen size={48} className='mb-4 text-gray-light'/>
                        <h3 className='text-lg font-semibold text-text-primary'>No Recent Projects</h3>
                        <p className='max-w-xs mt-1'>Open a folder to get started and it will appear here.</p>
                        <Button onClick={() => openProject()} size="sm" className='mt-6'>
                            <Plus size={16} className='mr-2'/> Open Your First Project
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsView;
