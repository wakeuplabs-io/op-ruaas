import { cn } from "@/lib/utils"
import React, {
  useEffect,
  useMemo,
  useState,
  Children,
  isValidElement,
} from "react"
import {
  SidebarListButton,
  SidebarListButtonProps,
} from "./sidebar-list-button"
import { Ellipsis, Search, ArrowLeft } from "lucide-react"
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet"

function extractTextFromNode(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (Array.isArray(node)) {
    return node.map((child) => extractTextFromNode(child)).join("")
  }
  if (isValidElement(node)) {
    return extractTextFromNode(node.props.children)
  }
  return ""
}

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
  const [startIndex, setStartIndex] = useState(0)

  const selectedItemIdx = useMemo(() => {
    return items.findIndex(
      (i) => (i.item.props as SidebarListButtonProps).isSelected
    )
  }, [items])

  useEffect(() => {
    if (!maxItems || items.length <= maxItems) {
      setStartIndex(0)
      return
    }
    if (selectedItemIdx === -1) return

    if (selectedItemIdx < startIndex) {
      setStartIndex(selectedItemIdx)
      return
    }
    if (selectedItemIdx >= startIndex + maxItems) {
      setStartIndex(selectedItemIdx - maxItems + 1)
    }
  }, [selectedItemIdx, maxItems, items.length, startIndex])

  const itemsToShow = useMemo(() => {
    if (!maxItems || items.length <= maxItems) {
      return items
    }
    const clampedStart = Math.max(0, Math.min(startIndex, items.length - maxItems))
    return items.slice(clampedStart, clampedStart + maxItems)
  }, [items, maxItems, startIndex])

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title && <p className="text-xs font-normal text-gray-700">{title}</p>}

      <ul className="flex flex-col pt-2">
        {itemsToShow.map(({ id, item }) => (
          <li key={id}>{item}</li>
        ))}

        {maxItems && items.length > maxItems && (
          <li key={`sidebar-section-list-view-more-${id}`}>
            <SidebarListButton onClick={() => setIsOpenViewAll(true)} className="w-full">
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
          {items.map(({ id, item }) => (
            <li key={id}>{item}</li>
          ))}
        </ul>
      </ViewAllSidebar>
    </div>
  )
}

interface ViewAllSidebarProps {
  isOpen: boolean
  title?: React.ReactNode
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
}

function ViewAllSidebar({
  isOpen,
  title,
  onOpenChange,
  children,
}: ViewAllSidebarProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const allChildren = useMemo(() => {
    return Children.toArray(children)
  }, [children])

  const filteredChildren = useMemo(() => {
    if (!allChildren.length) return []

    return allChildren.map((child) => {
      if (!isValidElement(child)) return child

      const ulChildren = Children.toArray(
        (child as React.ReactElement).props.children
      )

      const filteredLis = ulChildren.filter((li) => {
        if (!isValidElement(li)) return true
        const text = extractTextFromNode((li as React.ReactElement).props.children.props.rollup.name)
        return text.toLowerCase().includes(searchTerm.toLowerCase())
      })

      return React.cloneElement(child as React.ReactElement<any>, {
        children: filteredLis,
      })
    })
  }, [allChildren, searchTerm])


  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[320px] py-20 px-8">
        <div className="flex flex-col gap-2 w-full mb-2">
          <div className="flex items-center justify-between">
            <SheetClose asChild>
              <button onClick={() => onOpenChange(false)} className="p-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </SheetClose>

            <div className="relative flex items-center">
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  showSearch ? "w-40" : "w-0"
                )}
              >
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-100 placeholder-gray-400 text-black w-full px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <button onClick={() => setShowSearch((prev) => !prev)} className="p-1">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Título */}
          <p className="text-xs font-normal text-gray-700">All {title}</p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {filteredChildren}
        </div>
      </SheetContent>
    </Sheet>
  )
}
