import { Order, RollupItem } from "@/types"
import { SidebarSectionList } from "./sidebar-section-list"
import { RollupListButton } from "./rollup-list-button"

interface RollupListProps {
  name: string
  rollups: Order[]
  selectedId?: bigint
  onSelect: (id: bigint) => void
}

interface ContentProps {
  name: string
  rollups: RollupItem[]
  selectedId?: bigint
  onSelect: (id: bigint) => void
}

export function RollupList({ name, rollups, selectedId, onSelect }: RollupListProps) {
  return (
    <div className="flex flex-col gap-2">
      <Content 
        name={name} 
        rollups={rollups.map(rollup => ({
          id: rollup.id,
          name: rollup.setupMetadata.name,
        }))} 
        selectedId={selectedId} 
        onSelect={onSelect}
      />
    </div>
  )
}

function Content({ name, rollups, selectedId, onSelect }: ContentProps) {
  if (rollups.length === 0) return <EmptyState />
  const title = `${name} rollups`

  return (
    <SidebarSectionList
      id="rollups"
      title={title}
      shortTitle="Rollups"
      items={rollups.map((rollup) => ({
        id: rollup.id,
        item: (
          <RollupListButton
            rollup={rollup}
            isSelected={rollup.id === selectedId}
            onClick={() => onSelect(rollup.id)}
          />
        ),
      }))}
      maxItems={3}
    />
  )
}

function EmptyState() {
  return <p className="text-center text-sm text-gray-700">There are no categories yet.</p>
}
