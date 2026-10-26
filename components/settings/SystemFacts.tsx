import Link from "next/link";

/**
 * Every screen the app serves, each one reachable from here. The simulated
 * AutoCAD screen only exists for one retrieved unit, so it is listed with the
 * unit it needs rather than as a bare path that would 404.
 */
const ROUTES = [
  "/",
  "/library",
  "/office-dna",
  "/settings",
  "/p/P-2022-04/units",
  "/p/P-2022-04/schedule",
  "/p/P-2022-04/office-dna",
  "/p/P-2022-04/office-dna/au-jsl-501",
  "/p/P-2022-04/office-dna/compare?a=u501&b=au-jsl-501",
  "/p/P-2022-04/drawings",
  "/p/P-2022-04/building",
  "/sim/autocad/retrieve?unit=au-jsl-501&code=P-2019-03",
  "/login",
];

export default function SystemFacts({
  projectsCount,
  unitsCount,
  verifiedCount,
  connectedDrawings,
}: {
  projectsCount: number;
  unitsCount: number;
  verifiedCount: number;
  connectedDrawings: number;
}) {
  return (
    <div className="mt-8 border-t border-line pt-6">
      <h2 className="label-11 text-ink-3">système</h2>

      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-body">
        <dt className="text-ink-2">projets</dt>
        <dd className="text-right font-mono text-ink">{projectsCount}</dd>

        <dt className="text-ink-2">unités indexées</dt>
        <dd className="text-right font-mono text-ink">{unitsCount}</dd>

        <dt className="text-ink-2">unités vérifiées</dt>
        <dd className="text-right font-mono text-ink">{verifiedCount}</dd>

        <dt className="text-ink-2">dessins connectés</dt>
        <dd className="text-right font-mono text-ink">{connectedDrawings}</dd>

        <dt className="text-ink-2">source de données</dt>
        <dd className="text-right font-mono text-meta text-ink-3">
          fixtures/units.seed.json, fixtures/archive.seed.json
        </dd>
      </dl>

      <h2 className="label-11 mt-6 text-ink-3">routes</h2>
      <div className="mt-3 flex flex-col gap-1">
        {ROUTES.map((route) => (
          <Link
            key={route}
            href={route}
            className="font-mono text-meta text-ink-2 transition-colors duration-[80ms] hover:text-ink"
          >
            {route}
          </Link>
        ))}
      </div>
    </div>
  );
}
