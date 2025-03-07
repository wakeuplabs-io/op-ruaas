import { DeploymentValue } from "../deployment-value";

const addressManagers = Array(12).fill({
  value: "0xDc64a14...F6C9",
  label: "Address Manager",
});

export function AddressManagerList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {addressManagers.map((item, index) => (
        <DeploymentValue
          key={index}
          value={item.value}
          description={item.label}
        />
      ))}
    </div>
  );
}
