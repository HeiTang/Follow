import { useEntryActions } from "@renderer/hooks/useEntryActions"
import { useUpdateEntry } from "@renderer/hooks/useUpdateEntry"
import { showNativeMenu } from "@renderer/lib/native-menu"
import type { EntriesResponse, EntryResponse } from "@renderer/lib/types"
import { cn } from "@renderer/lib/utils"
import { apiFetch } from "@renderer/queries/api-fetch"
import { feedActions, useFeedStore } from "@renderer/store"
import { useMutation } from "@tanstack/react-query"
import { useHover } from "@use-gesture/react"
import { useEffect, useRef, useState } from "react"

export function EntryItemWrapper({
  entry,
  children,
  view,
  hoverToRead,
}: {
  entry: EntriesResponse[number] | EntryResponse
  children: React.ReactNode
  view?: number
  hoverToRead: boolean
}) {
  const { items } = useEntryActions({
    view,
    entry,
  })

  const activeEntry = useFeedStore((state) => state.activeEntry)

  const updateEntry = useUpdateEntry({
    entryId: entry?.entries.id,
    feedId: entry?.feeds.id,
  })

  const read = useMutation({
    mutationFn: async () =>
      apiFetch("/reads", {
        method: "POST",
        body: {
          entryId: entry?.entries.id,
        },
      }),
    onSuccess: () => {
      updateEntry({
        read: true,
      })
    },
  })

  const itemRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  useHover(
    (state) => {
      if (hoverToRead && state.active) {
        read.mutate()
      }
      setHovered(state.active)
    },
    {
      target: itemRef,
      enabled: !entry.read,
    },
  )
  useEffect(() => {
    if (hoverToRead && hovered) {
      read.mutate()
    }
  }, [hoverToRead, hovered, read])

  if (!entry?.entries.url || view === undefined) return children

  return (
    <div
      key={entry.entries.id}
      className={cn(
        "rounded-md transition-colors",
        activeEntry === entry.entries.id && "bg-native-active/50",
        entry.read && "text-foreground/80",
      )}
      ref={itemRef}
      onClick={(e) => {
        e.stopPropagation()
        feedActions.setActiveEntry(entry.entries.id)
      }}
      onDoubleClick={() =>
        entry.entries.url && window.open(entry.entries.url, "_blank")}
      onContextMenu={(e) => {
        e.preventDefault()
        showNativeMenu(
          items
            .filter((item) => !item.disabled)
            .map((item) => ({
              type: "text",
              label: item.name,
              click: item.onClick,
            })),
          e,
        )
      }}
    >
      {children}
    </div>
  )
}
