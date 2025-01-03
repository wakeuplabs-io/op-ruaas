import { ApiService } from "@/lib/api";
import { useCallback, useState } from "react";

export const InspectContracts: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [contractsInspection, setContractsInspection] = useState<any>(null);

  const onContractsChange = useCallback(async (e: any) => {
    setContractsInspection(null);

    try {
      setLoading(true);
      const res = await ApiService.inspectContracts(e.target.files[0]);

      setContractsInspection(res.data);
    } catch (e) {
      window.alert(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section className="space-y-4 border bg-gray-100 p-3 rounded-md text-sm">
      <div className="space-y-2">
        <h2 className="font-medium">Inspect contracts deployments</h2>
        <p>
          Find it at{" "}
          <code>/deployments/[name]/artifacts/contracts_artifacts.zip</code>
        </p>
      </div>

      <input
        type="file"
        className="block w-full max-w-xs"
        onChange={onContractsChange}
      />

      {contractsInspection && !loading && (
        <div className="border-t mt-4 pt-4 space-y-4">
          <div className="space-y-2">
            <span className="font-medium">Addresses</span>
            <pre className="border rounded-md p-2 overflow-x-scroll">
              {JSON.stringify(contractsInspection["addresses"], null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <span className="font-medium">Deploy config</span>
            <pre className="border rounded-md p-2 overflow-x-scroll">
              {JSON.stringify(contractsInspection["deploy-config"], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
