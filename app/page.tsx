import Dashboard from "@/components/dashboard/Dashboard";
import { getProjects } from "@/lib/data";

export default async function DashboardPage() {
  const projects = await getProjects();
  return <Dashboard projects={projects} />;
}
