"use client";

import { useCallback, useEffect, useState } from "react";
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { updateMapContent } from "@/actions/maps";

// Debounce helper
function useDebounce(value: any, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

type WorkplaceProps = {
    map: {
        id: string;
        title: string;
        content: any;
    };
};

export default function Workplace({ map }: WorkplaceProps) {
    const router = useRouter();

    // Initial state from DB or default
    const initialNodes = map.content?.nodes || [
        { id: "1", position: { x: 0, y: 0 }, data: { label: "Central Idea" }, type: "input" },
    ];
    const initialEdges = map.content?.edges || [];
    const initialViewport = map.content?.viewport || { x: 0, y: 0, zoom: 1 };

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeDoubleClick = useCallback((event: any, node: Node) => {
        const newLabel = window.prompt("Enter new label:", node.data.label as string);
        if (newLabel !== null) {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === node.id) {
                        return { ...n, data: { ...n.data, label: newLabel } };
                    }
                    return n;
                })
            );
        }
    }, [setNodes]);

    // Auto-save logic
    const debouncedNodes = useDebounce(nodes, 1000);
    const debouncedEdges = useDebounce(edges, 1000);

    useEffect(() => {
        const save = async () => {
            if (!rfInstance) return;

            setIsSaving(true);
            const flow = rfInstance.toObject();
            await updateMapContent(map.id, flow);
            setIsSaving(false);
        };

        // Only save if initialized
        if (rfInstance) {
            save();
        }
    }, [debouncedNodes, debouncedEdges, map.id, rfInstance]);

    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            {/* Top Bar */}
            <header className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="font-semibold text-gray-900 leading-none">{map.title}</h1>
                        <span className="text-xs text-gray-400 mt-1">
                            {isSaving ? "Saving..." : "Saved to cloud"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                        Share
                    </button>
                </div>
            </header>

            {/* Canvas */}
            <div className="flex-1 bg-gray-50 relative">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDoubleClick={onNodeDoubleClick}
                        onInit={setRfInstance}
                        defaultViewport={initialViewport}
                        fitView
                        className="bg-gray-50"
                    >
                        <Controls className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden" showInteractive={false} />
                        <Background color="#ccc" gap={20} size={1} />
                        <Panel position="top-right" className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                            <p className="text-xs text-gray-500">Double click to edit node</p>
                        </Panel>
                    </ReactFlow>
                </ReactFlowProvider>
            </div>
        </div>
    );
}
