"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
    OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { updateMapContent, updateMapTitle } from "@/actions/maps";
import MindMapNode from "./MindMapNode";
import Toolbar from "./Toolbar";

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

    // Register custom node types
    const nodeTypes = useMemo(() => ({ mindmap: MindMapNode as any }), []);

    // Initial state logic: Ensure nodes have the correct type 'mindmap' if they are old data
    // or default to 'mindmap' for new nodes.
    const processInitialNodes = (nodes: any[]) => {
        if (!nodes || nodes.length === 0) {
            return [{ id: "1", position: { x: 0, y: 0 }, data: { label: "Central Idea", isRoot: true }, type: "mindmap" }];
        }
        return nodes.map(n => ({ ...n, type: 'mindmap' }));
    };

    // map.content is the relation object (row), which has a 'content' column with the JSON
    const mapData = map.content?.content || {};

    const initialNodes = processInitialNodes(mapData.nodes);
    const initialEdges = mapData.edges || [];
    const initialViewport = mapData.viewport || { x: 0, y: 0, zoom: 1 };

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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

    // Handle Selection
    const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
        if (nodes.length > 0) {
            setSelectedNodeId(nodes[0].id);
        } else {
            setSelectedNodeId(null);
        }
    }, []);

    // Toolbar Actions
    const handleAddNode = useCallback(() => {
        if (!selectedNodeId) return;

        const parentNode = nodes.find(n => n.id === selectedNodeId);
        if (!parentNode) return;

        const newNodeId = `${nodes.length + 1}`;
        // Simple positioning logic: slightly offset from parent
        // Ideally this would be smarter (e.g. check for existing children and fan out)
        const newNode = {
            id: newNodeId,
            type: 'mindmap',
            position: {
                x: parentNode.position.x + 200,
                y: parentNode.position.y + (Math.random() * 100 - 50)
            },
            data: { label: 'New Node' }
        };

        const newEdge = {
            id: `e${parentNode.id}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [...eds, newEdge]);
    }, [selectedNodeId, nodes, setNodes, setEdges]);

    const handleColorChange = useCallback((color: string) => {
        if (!selectedNodeId) return;

        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === selectedNodeId) {
                    return { ...n, data: { ...n.data, color } };
                }
                return n;
            })
        );
    }, [selectedNodeId, setNodes]);


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
            <header className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white z-10 shrink-0 relative">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/")}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex flex-col justify-center">
                        <input
                            type="text"
                            defaultValue={map.title}
                            onBlur={(e) => {
                                if (e.target.value !== map.title) {
                                    updateMapTitle(map.id, e.target.value);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.currentTarget.blur();
                                }
                            }}
                            className="font-semibold text-gray-900 leading-none bg-transparent hover:bg-gray-50 focus:bg-gray-50 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 -ml-2 outline-none transition-all w-64 truncate"
                        />
                        <span className="text-xs text-gray-400 mt-0.5 px-0.5">
                            {isSaving ? "Saving..." : "Saved to cloud"}
                        </span>
                    </div>
                </div>

                {/* Floating Toolbar - Injected into Header area or Absolute in Canvas? 
              Design shows it floating near top. Let's put it absolute over canvas for true floating feel,
              or centered in header if that's the "Top Center" design. 
              The plan said "Floating Toolbar" and "Top Header". Let's put it in the canvas area. 
          */}

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                        Share
                    </button>
                </div>
            </header>

            {/* Canvas */}
            <div className="flex-1 bg-gray-50 relative">

                {/* Toolbar Positioned Absolute Top Center of Canvas */}
                <Toolbar
                    onAddNode={handleAddNode}
                    onColorChange={handleColorChange}
                    selectedNodeId={selectedNodeId}
                />

                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDoubleClick={onNodeDoubleClick}
                        onSelectionChange={onSelectionChange}
                        onInit={setRfInstance}
                        nodeTypes={nodeTypes}
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
