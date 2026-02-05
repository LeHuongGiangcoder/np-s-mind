import { Handle, Position, NodeProps } from '@xyflow/react';

export type MindMapNodeData = {
    label: string;
    color?: string; // hex or class name
    isRoot?: boolean;
};

export default function MindMapNode({ data, isConnectable }: NodeProps<any>) {
    // Default styles based on color or type
    const isRoot = data.isRoot;

    // Map internal colors to Tailwind classes or styles
    const getNodeStyle = (color?: string) => {
        switch (color) {
            case 'red': return 'bg-red-500 text-white border-red-600';
            case 'orange': return 'bg-orange-400 text-white border-orange-500';
            case 'blue': return 'bg-blue-500 text-white border-blue-600';
            case 'green': return 'bg-green-500 text-white border-green-600';
            case 'purple': return 'bg-purple-500 text-white border-purple-600';
            default: return isRoot ? 'bg-white border-blue-500 text-gray-900 font-bold text-lg' : 'bg-white border-gray-200 text-gray-700';
        }
    };

    return (
        <div className={`px-4 py-2 rounded-xl shadow-sm border-2 min-w-[120px] text-center transition-all ${getNodeStyle(data.color as string)}`}>
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 !bg-gray-400" />

            <div className="pointer-events-none">
                {data.label}
            </div>

            <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 !bg-gray-400" />
        </div>
    );
}
