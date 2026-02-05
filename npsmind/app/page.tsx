import { getMaps } from "@/actions/maps";
import Dashboard from "@/components/Dashboard";

export default async function Home() {
  const { data: maps } = await getMaps();

  return (
    <main className="min-h-screen bg-gray-50">
      <Dashboard initialMaps={maps || []} />
    </main>
  );
}
