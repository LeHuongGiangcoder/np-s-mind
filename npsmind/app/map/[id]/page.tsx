import { getMap } from "@/actions/maps";
import Workplace from "@/components/Workplace";
import { redirect } from "next/navigation";

export default async function MapPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getMap(id);

    if (!result.success || !result.data) {
        redirect("/");
    }

    return <Workplace map={result.data} />;
}
