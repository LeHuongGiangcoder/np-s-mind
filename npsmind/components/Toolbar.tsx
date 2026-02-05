import React from 'react';

type ToolbarProps = {
    onAddNode: () => void;
    onColorChange: (color: string) => void;
    selectedNodeId: string | null;
};

const COLORS = [
    { label: 'White', value: 'white', bg: 'bg-white border-2 border-gray-200' },
    { label: 'Red', value: 'red', bg: 'bg-red-500' },
    { label: 'Orange', value: 'orange', bg: 'bg-orange-400' },
    { label: 'Green', value: 'green', bg: 'bg-green-500' },
    { label: 'Blue', value: 'blue', bg: 'bg-blue-500' },
    { label: 'Purple', value: 'purple', bg: 'bg-purple-500' },
];

export default function Toolbar({ onAddNode, onColorChange, selectedNodeId }: ToolbarProps) {
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 p-2 flex items-center gap-2 z-50">

            {/* Add Node Button */}
            <button
                onClick={onAddNode}
                disabled={!selectedNodeId}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Add Child Node"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {/* Color Picker */}
            <div className="flex items-center gap-1">
                {COLORS.map((color) => (
                    <button
                        key={color.value}
                        onClick={() => onColorChange(color.value)}
                        disabled={!selectedNodeId}
                        className={`w-6 h-6 rounded-full ${color.bg} hover:scale-110 transition-transform disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 ring-2 ring-transparent hover:ring-gray-200`}
                        title={color.label}
                    />
                ))}
            </div>

            {/* Visual indicator if nothing is selected */}
            {!selectedNodeId && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">
                    Select a node to edit
                </div>
            )}
        </div>
    );
}
