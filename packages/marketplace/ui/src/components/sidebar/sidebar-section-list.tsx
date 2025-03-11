import { cn } from "@/lib/utils"
import React, { useMemo, useState } from "react"
import {
  SidebarListButton,
  SidebarListButtonProps,
} from "./sidebar-list-button"
import { Ellipsis } from "lucide-react"
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet"

interface Item {
  id: bigint
  item: React.ReactElement<typeof SidebarListButton>
}

interface SidebarSectionListProps {
  id: string
  items: Item[]
  title?: React.ReactNode
  shortTitle?: string
  maxItems?: number
  className?: string
}

export function SidebarSectionList({
  id,
  items,
  title,
  shortTitle,
  maxItems,
  className,
}: SidebarSectionListProps) {
  const [isOpenViewAll, setIsOpenViewAll] = useState(false)

  const [itemsToShow, viewAllItems] = useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return [items, []]
    }

    let sectionItems = [...items]
    const selectedItemIdx = sectionItems.findIndex(
      (item) => (item.item.props as SidebarListButtonProps).isSelected
    )

    if (selectedItemIdx >= maxItems) {
      if (selectedItemIdx >= items.length - (maxItems - 1)) {
        sectionItems = sectionItems.slice(-maxItems)
      } else {
        sectionItems = [
          sectionItems[selectedItemIdx],
          ...sectionItems.slice(0, selectedItemIdx),
          ...sectionItems.slice(selectedItemIdx + 1),
        ]
      }
    }

    const itemsToShow = sectionItems.slice(0, maxItems)
    const viewAllItems = items
    return [itemsToShow, viewAllItems]
  }, [items, maxItems])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && (
        <p className={cn("text-xs font-normal text-gray-700", className)}>
          {title}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {itemsToShow.map(({ id, item }) => (
          <li key={id}>{item}</li>
        ))}
        {viewAllItems.length > (maxItems || 0) && (
          <li key={`sidebar-section-list-view-more-${id}`}>
            <SidebarListButton
              onClick={() => setIsOpenViewAll(true)}
              className="w-full"
            >
              <div className="flex items-center gap-2 w-full p-2">
                <Ellipsis className="h-[20px] w-[20px] text-gray-700" />
                <span className="truncate text-sm text-gray-500 hover:text-black transition">
                  View all {shortTitle}
                </span>
              </div>
            </SidebarListButton>
          </li>
        )}
      </ul>
      <ViewAllSidebar
        title={title}
        isOpen={isOpenViewAll}
        onOpenChange={(open) => setIsOpenViewAll(open)}
      >
        <ul className="flex flex-col gap-2" key={id}>
          {viewAllItems.map(({ id, item }) => (
            <li key={id}>{item}</li>
          ))}
        </ul>
      </ViewAllSidebar>
    </div>
  )
}

interface ViewAllSidebarProps {
  isOpen: boolean
  title: React.ReactNode
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
}

function ViewAllSidebar({
  isOpen,
  title,
  onOpenChange,
  children,
}: ViewAllSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[320px] py-20 px-8">
        <div className="flex flex-col h-full w-full">
          <p className="text-xs font-normal text-gray-700">All {title}</p>
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
            <ul className="space-y-2">
              {React.Children.map(children, (child) => (
                <li>
                  <SheetClose asChild>
                    <button
                      onClick={() => onOpenChange(false)}
                      className="w-full text-left p-2 rounded-lg transition"
                    >
                      {child}
                    </button>
                  </SheetClose>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
