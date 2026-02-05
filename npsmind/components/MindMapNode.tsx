import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { useState, useRef, useEffect, useCallback } from 'react';

export type MindMapNodeData = {
    label: string;
    color?: string; // hex or class name
    isRoot?: boolean;
};

export default function MindMapNode({ id, data, isConnectable }: NodeProps<any>) {
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(data.label);
    const inputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent ReactFlow's onNodeDoubleClick
        setIsEditing(true);
        setEditValue(data.label);
    };

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if (editValue !== data.label) {
            setNodes((nodes) =>
                nodes.map((n) => {
                    if (n.id === id) {
                        return { ...n, data: { ...n.data, label: editValue } };
                    }
                    return n;
                })
            );
        }
    }, [editValue, data.label, id, setNodes]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <div
            onDoubleClick={handleDoubleClick}
            className={`px-4 py-2 rounded-xl shadow-sm border-2 min-w-[120px] text-center transition-all ${getNodeStyle(data.color as string)}`}
        >
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-2 !bg-gray-400" />

            {isEditing ? (
                <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none outline-none text-center w-full text-inherit font-inherit p-0"
                />
            ) : (
                <div className="pointer-events-none">
                    {data.label}
                </div>
            )}

            <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-2 !bg-gray-400" />
        </div>
    );
}
