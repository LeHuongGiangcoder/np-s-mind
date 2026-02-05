"use client";

import { createMap } from "@/actions/maps";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
    const [maps, setMaps] = useState<Map[]>(initialMaps);
    const [isCreating, setIsCreating] = useState(false);

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

    return (
        <div className="flex h-screen w-full bg-[#FAFAFA] text-[#1A1A1A] font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-gray-200 p-6 flex flex-col gap-6 bg-white shadow-sm">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">np's mind</h1>

                <nav className="flex flex-col gap-2">
                    <button className="flex items-center gap-3 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
                            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        All Maps
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Recent
                    </button>

                    <button className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
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
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">All Maps</h2>
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full bg-gray-100 border-none rounded-xl py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-black/5 transition-all outline-none"
                            />
                        </div>
                    </header>

                    {/* Grid */}
                    <section>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">My Maps</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {maps.map((map) => (
                                <div key={map.id} onClick={() => router.push(`/map/${map.id}`)} className="group cursor-pointer flex flex-col gap-2 rounded-2xl p-2 hover:bg-gray-100 transition-all duration-200">
                                    <div className="aspect-[16/9] w-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden relative group-hover:shadow-md transition-shadow">
                                        {/* Placeholder for thumbnail */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                                        {map.thumbnailUrl && <img src={map.thumbnailUrl} alt={map.title} className="absolute inset-0 w-full h-full object-cover" />}
                                        {!map.thumbnailUrl && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-1">
                                        <h4 className="font-medium text-gray-900 truncate">{map.title}</h4>
                                        <p className="text-xs text-gray-500">Last opened: {new Date(map.lastOpenedAt).toLocaleDateString()}</p>
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
