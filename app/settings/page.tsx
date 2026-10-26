import AppSidebar from "@/components/AppSidebar";
import SettingsPanel from "@/components/settings/SettingsPanel";
import SystemFacts from "@/components/settings/SystemFacts";
import { getAllUnits, getProjects } from "@/lib/data";
import { getPrefs } from "@/lib/prefs.server";

// the verified count and the project store change between requests
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [prefs, projects, units] = await Promise.all([
    getPrefs(),
    getProjects(),
    getAllUnits(),
  ]);

  const verifiedCount = units.filter((u) => u.status === "verified").length;
  const connectedDrawings = projects
    .flatMap((p) => p.drawings)
    .filter((d) => d.status === "connected").length;

  return (
    <div className="flex h-screen">
      <AppSidebar active="settings" />
      <div className="min-w-0 flex-1 overflow-auto bg-surface">
        <div className="max-w-[720px] px-6 py-6">
          <h1 className="text-title-lg text-ink">paramètres</h1>
          <SettingsPanel prefs={prefs} />
          <SystemFacts
            projectsCount={projects.length}
            unitsCount={units.length}
            verifiedCount={verifiedCount}
            connectedDrawings={connectedDrawings}
          />
        </div>
      </div>
    </div>
  );
}
