"use client";

import { createMap, deleteMap, duplicateMap, toggleStarMap, updateMapTitle } from "@/actions/maps";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, useRef } from "react";

type Map = {
    id: string;
    title: string;
    createdAt: Date;
    updatedAt: Date;
    lastOpenedAt: Date;
    isStarred: boolean;
    thumbnailUrl: string | null;
};

export default function Dashboard({ initialMaps }: { initialMaps: Map[] }) {
    const router = useRouter();
    const [maps, setMaps] = useState<Map[]>(initialMaps); // Should sync with server data roughly or re-fetch? initialMaps is static. 
    // Better to use optimistic updates or router.refresh() which re-renders server component pass prop.
    // But for now let's just use router.refresh() after actions and rely on prop update.
    // Actually, prop won't update automatically unless parent re-renders. 
    // Simplest: useEffect to sync prop to state? Or just use router.refresh() and let Next.js handle it?
    // Let's rely on router.refresh() triggering a re-render of page.tsx -> new initialMaps -> we need useEffect to update state if we assume page reloads.
    // But page reload might be full page. 
    // Let's stick to: Actions return success -> router.refresh().

    useEffect(() => {
        setMaps(initialMaps);
    }, [initialMaps]);


    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<'all' | 'recent' | 'starred'>('all');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const filteredMaps = useMemo(() => {
        let result = maps;

        // 1. Filter by Tab
        if (filter === 'recent') {
            // Sort by lastOpenedAt descending (already default?) 
            // Let's just say "Recent" means last 7 days? Or just default sort.
            // The design implies "Recent" is a filter/view.
            // Let's just return all for now but re-sorted if needed. "Recent" usually implies "Last Opened".
            result = [...result].sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime());
        } else if (filter === 'starred') {
            result = result.filter(m => m.isStarred);
        }

        // 2. Search
        if (searchQuery) {
            result = result.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        return result;
    }, [maps, filter, searchQuery]);


    const handleCreateNew = async () => {
        setIsCreating(true);
        const result = await createMap("Untitled Map");
        if (result.success && result.data) {
            router.push(`/map/${result.data.id}`);
        } else {
            alert("Failed to create map");
            setIsCreating(false);
        }
    };

    const handleAction = async (e: React.MouseEvent, action: () => Promise<any>) => {
        e.stopPropagation(); // prevent card click
        setActiveMenuId(null);
        await action();
        // router.refresh() handled in actions usually
    };

    const handleRename = async (id: string, currentTitle: string) => {
        const newTitle = window.prompt("Rename map:", currentTitle);
        if (newTitle && newTitle !== currentTitle) {
            await updateMapTitle(id, newTitle);
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#FAFAFA] text-[#1A1A1A] font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 p-6 flex flex-col gap-6 bg-white shadow-sm">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">np's mind</h1>

                <nav className="flex flex-col gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={filter === 'all' ? "text-gray-900" : "text-gray-500"}>
                            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        All Maps
                    </button>

                    <button
                        onClick={() => setFilter('recent')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'recent' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={filter === 'recent' ? "text-gray-900" : "text-gray-500"}>
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Recent
                    </button>

                    <button
                        onClick={() => setFilter('starred')}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'starred' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={filter === 'starred' ? "text-gray-900" : "text-gray-500"}>
                            <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Starred
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto flex flex-col gap-8">

                    {/* Header */}
                    <header>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">
                            {filter === 'all' ? 'All Maps' : filter === 'recent' ? 'Recent Maps' : 'Starred Maps'}
                        </h2>
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 border-none rounded-xl py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                            />
                        </div>
                    </header>

                    {/* Grid */}
                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            {searchQuery ? `Search Results for "${searchQuery}"` : 'My Maps'}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMaps.map((map) => (
                                <div key={map.id} onClick={() => router.push(`/map/${map.id}`)} className="group cursor-pointer flex flex-col gap-2 rounded-2xl p-2 hover:bg-gray-100 transition-all duration-200 relative">
                                    <div className="aspect-[16/9] w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative group-hover:shadow-md transition-shadow">
                                        {/* Placeholder for thumbnail */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                                        {map.thumbnailUrl && <img src={map.thumbnailUrl} alt={map.title} className="absolute inset-0 w-full h-full object-cover" />}
                                        {!map.thumbnailUrl && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" /></svg>
                                            </div>
                                        )}

                                        {/* Star indicator */}
                                        {map.isStarred && (
                                            <div className="absolute top-2 left-2 text-yellow-500">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg>
                                            </div>
                                        )}

                                        {/* Menu Trigger */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === map.id ? null : map.id); }}
                                                className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm text-gray-700 backdrop-blur-sm"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-1 relative">
                                        <h4 className="font-medium text-gray-900 truncate pr-6">{map.title}</h4>
                                        <p className="text-xs text-gray-500">Last opened: {new Date(map.lastOpenedAt).toLocaleDateString()}</p>

                                        {/* Dropdown Menu */}
                                        {activeMenuId === map.id && (
                                            <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                                <button onClick={(e) => handleAction(e, () => updateMapTitle(map.id, map.title))} className="hidden" /> {/* Placeholder for types */}

                                                <button onClick={(e) => { e.stopPropagation(); handleRename(map.id, map.title); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    Rename
                                                </button>
                                                <button onClick={(e) => handleAction(e, () => duplicateMap(map.id))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                                    Duplicate
                                                </button>
                                                <button onClick={(e) => handleAction(e, () => toggleStarMap(map.id, !map.isStarred))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={map.isStarred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={map.isStarred ? "text-yellow-500" : ""}><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" /></svg>
                                                    {map.isStarred ? "Unstar" : "Add to starred"}
                                                </button>
                                                <div className="h-px bg-gray-100 my-1" />
                                                <button onClick={(e) => handleAction(e, () => deleteMap(map.id))} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                                    Move to trash
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </main>

            {/* Floating Action Button */}
            <button
                onClick={handleCreateNew}
                disabled={isCreating}
                className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100"
            >
                {isCreating ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        Create New
                    </>
                )}
            </button>
        </div>
    );
}
