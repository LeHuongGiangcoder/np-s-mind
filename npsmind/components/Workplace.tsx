"use client";
import dagre from 'dagre';
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
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
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { updateMapContent, updateMapTitle, toggleStarMap, deleteMap, createMap } from "@/actions/maps";
import { toPng } from 'html-to-image';
import {
    Home,
    Star,
    Link as LinkIcon,
    Download,
    Trash2,
    Plus,
    X,
    Share2
} from "lucide-react";
import MindMapNode from "./MindMapNode";
import Toolbar from "./Toolbar";

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            position: {
                x: nodeWithPosition.x - 75,
                y: nodeWithPosition.y - 25,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

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
        isStarred: boolean;
    };
};

export default function Workplace({ map }: WorkplaceProps) {
    const router = useRouter();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Local state for UI feedback
    const [isStarred, setIsStarred] = useState(map.isStarred);

    // Sync with prop if it changes (external update)
    useEffect(() => {
        setIsStarred(map.isStarred);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map.isStarred]);

    // Register custom node types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeTypes = useMemo(() => ({ mindmap: MindMapNode as any }), []);

    // Initial state logic
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );






    // --- History Management ---
    const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const recordHistory = useCallback((nds: Node[], eds: Edge[]) => {
        setHistory(prev => {
            const past = prev.slice(0, historyIndex + 1);
            return [...past, { nodes: nds, edges: eds }];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const state = history[newIndex];
            setNodes(state.nodes);
            setEdges(state.edges);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const state = history[newIndex];
            setNodes(state.nodes);
            setEdges(state.edges);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex, setNodes, setEdges]);

    // Initialize History
    // Initialize History
    useEffect(() => {
        if (history.length === 0 && nodes.length > 0) {
            setHistory([{ nodes, edges }]);
            setHistoryIndex(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle Text Edit (for Undo/Redo)
    const handleLabelChange = useCallback((id: string, label: string) => {
        setNodes((nds) => {
            const newNodes = nds.map((n) => {
                if (n.id === id) {
                    return { ...n, data: { ...n.data, label } };
                }
                return n;
            });
            recordHistory(newNodes, edges);
            return newNodes;
        });
    }, [edges, recordHistory, setNodes]);

    // Inject handleLabelChange into nodes
    useEffect(() => {
        setNodes((nds) => nds.map(n => ({
            ...n,
            data: { ...n.data, onLabelChange: handleLabelChange }
        })));
    }, [handleLabelChange, setNodes]);
    // Note: handleLabelChange depends on edges/recordHistory. 
    // If edges change, handleLabelChange changes, forcing a node update. 
    // This is fine, but might be chatty.

    // --- End History Management ---

    // --- Drag and Drop Creation from Edge ---
    const connectingNodeId = useRef<string | null>(null);

    const onConnectStart = useCallback((_: any, { nodeId }: { nodeId: string | null }) => {
        connectingNodeId.current = nodeId;
    }, []);

    const onConnectEnd = useCallback(
        (event: any) => {
            if (!connectingNodeId.current || !rfInstance) return;

            const target = event.target as Element;

            // Check if dropped on pane or background (robust check)
            // We use closest for background to catch internal SVG elements (dots, grid lines)
            const isPane = target.classList.contains('react-flow__pane');
            const isBackground = target.closest('.react-flow__background');

            if (isPane || isBackground) {
                // Calculate position
                const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;
                const position = rfInstance.screenToFlowPosition({ x: clientX, y: clientY });

                // Create New Node
                const newNodeId = `${nodes.length + 1}-${Date.now()}`;
                const newNode: Node = {
                    id: newNodeId,
                    type: 'mindmap',
                    position: {
                        x: position.x,
                        y: position.y,
                    },
                    data: { label: 'New Node', onLabelChange: handleLabelChange },
                    origin: [0.5, 0.5],
                };

                // Create Connection Edge
                const newEdge: Edge = {
                    id: `e${connectingNodeId.current}-${newNodeId}`,
                    source: connectingNodeId.current,
                    target: newNodeId,
                };

                // Update State
                const newNodes = [...nodes, newNode];
                const newEdges = [...edges, newEdge];

                setNodes(newNodes);
                setEdges(newEdges);
                recordHistory(newNodes, newEdges);
            }

            // Allow start of new connection
            connectingNodeId.current = null;
        },
        [rfInstance, nodes, edges, handleLabelChange, recordHistory, setNodes, setEdges]
    );



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

        const newNodeId = `${nodes.length + 1}-${Date.now()}`; // Ensure unique ID
        const newNode = {
            id: newNodeId,
            type: 'mindmap',
            position: {
                x: parentNode.position.x + 200,
                y: parentNode.position.y + (Math.random() * 100 - 50)
            },
            data: { label: 'New Node', onLabelChange: handleLabelChange } // Inject handler
        };

        const newEdge = {
            id: `e${parentNode.id}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
        };

        const newNodes = [...nodes, newNode];
        const newEdges = [...edges, newEdge];

        setNodes(newNodes);
        setEdges(newEdges);
        recordHistory(newNodes, newEdges);
    }, [selectedNodeId, nodes, edges, setNodes, setEdges, recordHistory, handleLabelChange]);

    const handleDeleteNode = useCallback(() => {
        if (!selectedNodeId) return;
        const newNodes = nodes.filter((n) => n.id !== selectedNodeId);
        const newEdges = edges.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId);

        setNodes(newNodes);
        setEdges(newEdges);
        recordHistory(newNodes, newEdges);
        setSelectedNodeId(null);
    }, [selectedNodeId, nodes, edges, setNodes, setEdges, recordHistory]);

    const handleLayout = useCallback(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges
        );
        // Inject handler into layouted nodes just in case (should persist but mapping creates shallow copies)
        const finalNodes = layoutedNodes.map(n => ({ ...n, data: { ...n.data, onLabelChange: handleLabelChange } }));

        setNodes(finalNodes);
        setEdges(layoutedEdges);
        recordHistory(finalNodes, layoutedEdges);

        if (rfInstance) {
            window.requestAnimationFrame(() => rfInstance.fitView({ duration: 800 }));
        }
    }, [nodes, edges, setNodes, setEdges, rfInstance, recordHistory, handleLabelChange]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid conflicts with inputs
            if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

            if (e.key === 'Tab') {
                e.preventDefault();
                handleAddNode();
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleDeleteNode();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAddNode, handleDeleteNode, undo, redo]);

    const handleColorChange = useCallback((color: string) => {
        if (!selectedNodeId) return;

        setNodes((nds) => {
            const newNodes = nds.map((n) => {
                if (n.id === selectedNodeId) {
                    return { ...n, data: { ...n.data, color } };
                }
                return n;
            });
            recordHistory(newNodes, edges);
            return newNodes;
        });
    }, [selectedNodeId, setNodes, edges, recordHistory]);


    // Auto-save logic
    const debouncedNodes = useDebounce(nodes, 1000);
    const debouncedEdges = useDebounce(edges, 1000);

    useEffect(() => {
        const save = async () => {
            if (!rfInstance) return;

            setIsSaving(true);
            const flow = rfInstance.toObject();

            let thumbnail = undefined;
            if (wrapperRef.current) {
                try {
                    thumbnail = await toPng(wrapperRef.current, {
                        cacheBust: true,
                        backgroundColor: '#f9fafb',
                        pixelRatio: 0.5, // Lower resolution for storage efficiency
                    });
                } catch (e) {
                    console.error("Thumbnail generation failed", e);
                }
            }

            await updateMapContent(map.id, flow, thumbnail);
            setIsSaving(false);
        };

        // Only save if initialized
        if (rfInstance) {
            save();
        }
    }, [debouncedNodes, debouncedEdges, map.id, rfInstance]);

    // --- Header Actions ---

    const handleToggleStar = async () => {
        const newState = !isStarred;
        setIsStarred(newState); // Optimistic
        await toggleStarMap(map.id, newState);
        router.refresh();
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    const handleDownload = async () => {
        if (wrapperRef.current === null) {
            return;
        }

        // We target the ReactFlow viewport specifically if possible, or the wrapper
        // The wrapper contains the toolbar/controls too if not careful. 
        // Let's rely on filtering or just capturing the canvas area.
        // Actually, html-to-image on the wrapper usually works. 
        // To exclude controls, we can filter by class or just accept they are there (user might want them).
        // For a clean map, usually we want just the nodes/edges.
        // React Flow has a specific way to export but let's try the simple wrapper first.

        try {
            // Find the viewport div (inner part of react flow) to avoid UI chrome if possible
            // But getting the whole wrapper is safer for styles.
            // Let's just create a png of the wrapper.
            const dataUrl = await toPng(wrapperRef.current, { cacheBust: true, backgroundColor: '#f9fafb' });
            const link = document.createElement('a');
            link.download = `${map.title || 'mindmap'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to download image', err);
            alert("Failed to download image.");
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this map?")) {
            await deleteMap(map.id);
            router.push('/');
        }
    };




    return (
        <div className="h-screen w-screen flex flex-col bg-white">
            {/* Top Bar */}
            <header className="flex flex-col border-b border-gray-200 bg-white z-10 shrink-0 relative shadow-sm">

                {/* Main Header Row */}
                <div className="h-14 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/")}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                            title="Back to Dashboard"
                        >
                            <Home size={20} />
                        </button>

                        {/* Title Input */}
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
                                className="text-lg font-bold text-gray-900 leading-none bg-transparent hover:bg-gray-50 focus:bg-gray-100 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 -ml-2 outline-none transition-all w-64 truncate"
                            />
                            <span className="text-[10px] text-gray-400 mt-0.5 px-0.5 uppercase tracking-wide font-medium">
                                {isSaving ? "Saving..." : "Saved"}
                            </span>
                        </div>
                    </div>

                    {/* Toolbar in center */}
                    <div className="flex-1 flex justify-center mx-4">
                        <Toolbar
                            onAddNode={handleAddNode}
                            onColorChange={handleColorChange}
                            onLayout={handleLayout}
                            selectedNodeId={selectedNodeId}
                            onUndo={undo}
                            onRedo={redo}
                            canUndo={historyIndex > 0}
                            canRedo={historyIndex < history.length - 1}
                        />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleStar}
                            className={`p-2 rounded-lg transition-colors ${isStarred ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                            title={isStarred ? "Unstar" : "Star this map"}
                        >
                            <Star size={20} fill={isStarred ? "currentColor" : "none"} />
                        </button>

                        <div className="h-6 w-px bg-gray-200 mx-1" />

                        <button onClick={handleCopyLink} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                            <LinkIcon size={16} />
                            Copy Link
                        </button>

                        <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                            <Download size={16} />
                            Download
                        </button>

                        <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Map">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>



            </header>

            {/* Canvas */}
            <div className="flex-1 bg-gray-50 relative" ref={wrapperRef}>




                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
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
