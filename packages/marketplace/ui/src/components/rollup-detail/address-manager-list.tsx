import { CopyableInfoBox } from "../copyable-info-box";

const addressManagers = Array(12).fill({
  value: "0xDc64a14...F6C9",
  label: "Address Manager",
});

export function AddressManagerList() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {addressManagers.map((item, index) => (
        <CopyableInfoBox
          key={index}
          value={item.value}
          shortValue={item.value}
          label={item.label}
        />
      ))}
    </div>
  );
}
