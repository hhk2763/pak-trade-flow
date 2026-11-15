// Shown when the vessel-call tables have not been published yet (the site was
// deployed ahead of the ETL release that builds them).
export function DataPending() {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-xl max-w-2xl">
      <h1 className="font-headline-md text-headline-md text-on-surface">
        Vessel-call data is being prepared
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
        This view is built from the vessel-call tables, which are published by the nightly
        pipeline. They will appear here after its next successful run. Daily tonnage is
        available now under Daily Activity.
      </p>
    </div>
  );
}
