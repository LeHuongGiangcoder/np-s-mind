import React from 'react';
import {
    PlusSquare,
    Palette,
    Workflow,
    Braces,
    FileText,
    Link,
    MousePointer2
} from "lucide-react";

type ToolbarProps = {
    onAddNode: () => void;
    onColorChange: (color: string) => void;
    onLayout: () => void;
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

export default function Toolbar({ onAddNode, onColorChange, onLayout, selectedNodeId }: ToolbarProps) {
    // We can use a popover for colors or just keep it simple.
    // Let's toggle color picker visibility or keep it inline? 
    // Design shows a "Palette" icon. Maybe hovering/clicking it reveals colors.
    // For now, let's keep it expanded but add the other tools.

    // Actually the design screenshot showed: [ + ] [ Palette ] [ Tree ] [ { } ] [ Note ] [ Link ]
    // And selecting Palette opened the colors below.
    // Let's try to mimic that structure slightly better.

    const [showColors, setShowColors] = React.useState(false);

    return (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-1.5 flex items-center gap-1">

                {/* Add Node */}
                <button
                    onClick={onAddNode}
                    disabled={!selectedNodeId}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Add Child Node"
                >
                    <PlusSquare size={20} />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Color Picker Toggle */}
                <button
                    onClick={() => setShowColors(!showColors)}
                    disabled={!selectedNodeId}
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-all ${showColors ? 'bg-gray-100 text-blue-600' : 'text-gray-700'} disabled:opacity-30`}
                    title="Change Color"
                >
                    <Palette size={20} />
                </button>

                {/* Auto Layout */}
                <button
                    onClick={onLayout}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-all"
                    title="Auto Layout"
                >
                    <Workflow size={20} />
                </button>

                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Placeholders for future features */}
                <button
                    disabled={!selectedNodeId}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Add Summary (Coming Soon)"
                >
                    <Braces size={20} />
                </button>
                <button
                    disabled={!selectedNodeId}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Add Note (Coming Soon)"
                >
                    <FileText size={20} />
                </button>
                <button
                    disabled={!selectedNodeId}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Add Link (Coming Soon)"
                >
                    <Link size={20} />
                </button>
            </div>

            {/* Color Picker Dropdown */}
            {showColors && selectedNodeId && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 grid grid-cols-4 gap-2 animate-in slide-in-from-top-2 duration-200">
                    {COLORS.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => { onColorChange(color.value); setShowColors(false); }}
                            className={`w-8 h-8 rounded-full ${color.bg} hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-gray-200`} // Larger touch targets
                            title={color.label}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
