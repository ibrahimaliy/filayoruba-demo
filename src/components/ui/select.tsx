"use client"

import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"

function Select<Value, Multiple extends boolean | undefined = false>(
  props: SelectPrimitive.Root.Props<Value, Multiple>
) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({ className, children, ...props }: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-xs outline-none hover:border-[#FED501] focus-visible:border-[#FED501] focus-visible:ring-2 focus-visible:ring-[#FED501]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDownIcon className="size-3.5 text-[#FED501] opacity-80" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("truncate font-semibold", className)}
      {...props}
    />
  )
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={4} className="z-50">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "w-(--anchor-width) min-w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl outline-none animate-scale-up",
            className
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-pointer items-center rounded-lg py-2 pr-8 pl-2.5 text-xs font-semibold outline-none select-none text-slate-700 data-highlighted:bg-[#000000] data-highlighted:text-white data-disabled:pointer-events-none data-disabled:opacity-50 transition-colors",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 text-[#FED501]">
        <CheckIcon className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
