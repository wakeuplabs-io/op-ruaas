import { RollupItem } from "@/types";
import { SidebarSectionList } from "./sidebar-section-list";
import { RollupListButton } from "./rollup-list-button";
import { useState } from "react";

export function ItemList(props: ContentProps) {
  return (
    <Container>
      <Content {...props} />
    </Container>
  );
}

function Container(props: { children: React.ReactNode }) {
  return <div className='flex flex-col gap-2'>{props.children} </div>;
}

interface ContentProps {
  name: string;
  rollups: RollupItem[];
}

function Content({ name, rollups }: ContentProps) {
  const [selectedRollup, setSelectedRollup] = useState<bigint>();
  if (rollups.length === 0) return <EmptyState />;
  const title = `${name} rollups`
  return (
    <SidebarSectionList
      id='rollups'
      title={title}
      shortTitle='Rollups'
      items={rollups.map((rollup) => ({
        id: rollup.id,
        item: (
          <RollupListButton
            rollup={rollup}
            isSelected={selectedRollup === rollup.id}
            onClick={() => setSelectedRollup(rollup.id)}
          />
        ),
      }))}
      maxItems={3}
    />
  );
}

function EmptyState() {
  return <p className='text-center text-sm'>There are no categories yet.</p>;
}
