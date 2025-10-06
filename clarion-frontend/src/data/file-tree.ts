export interface TreeNodeData {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  status?: 'M' | 'A' | 'U';
  content?: string;
  children?: TreeNodeData[];
}

// This static data is no longer used by the application but is kept here for reference or testing.
export const fileTreeData: TreeNodeData[] = [];
