import { ApiService } from "@/lib/api";
import { useCallback, useState } from "react";

export const InspectInfra: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [infraInspection, setInfraInspection] = useState<any>(null);

  const onInfraChange = useCallback(
    async (e: any) => {
      setInfraInspection(null);

      try {
        setLoading(true);
        const res = await ApiService.inspectInfra(e.target.files[0]);

        setInfraInspection(res.data);
      } catch (e) {
        window.alert(e);
      } finally {
        setLoading(false);
      }
    },
    [setInfraInspection]
  );

  return (
    <section className="space-y-4 border bg-gray-100 p-3 rounded-md text-sm">
      <div className="space-y-2">
        <h2 className="font-medium">Inspect infra deployments</h2>
        <p>
          Find it at{" "}
          <code>/deployments/[name]/artifacts/infra_artifacts.zip</code>
        </p>
      </div>

      <input
        type="file"
        className="block w-full max-w-xs"
        onChange={onInfraChange}
      />

      {infraInspection && !loading && (
        <div className="border-t mt-4 pt-4">
          <div className="space-y-2">
            <span className="font-medium">Outputs</span>
            <pre className="border rounded-md p-2 overflow-x-scroll">
              {JSON.stringify(infraInspection["outputs"], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
