import Dashboard from "@/components/dashboard/Dashboard";
import { getProjects } from "@/lib/data";

// the in-memory project store changes between requests, so never prerender
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await getProjects();
  return <Dashboard projects={projects} />;
}
