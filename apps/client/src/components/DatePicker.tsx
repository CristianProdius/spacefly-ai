"use client";

import { useState, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, startOfDay } from "date-fns";
import { Popover } from "@base-ui/react/popover";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  placeholder?: string;
  id?: string;
}

function toDate(iso: string): Date {
  return parse(iso, "yyyy-MM-dd", new Date());
}

function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export default function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Select date",
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = value ? toDate(value) : undefined;
  const disabled = minDate ? { before: toDate(minDate) } : undefined;
  const defaultMonth = selected || (minDate ? toDate(minDate) : startOfDay(new Date()));

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        onChange(toISO(date));
        setOpen(false);
      }
    },
    [onChange],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        className={cn(
          "flex w-full items-center gap-2 pl-10 pr-4 py-3 border border-border rounded-lg",
          "text-left text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          !value && "text-muted",
        )}
      >
        <Calendar className="absolute left-3 w-5 h-5 text-muted" />
        {value ? format(toDate(value), "MMM d, yyyy") : placeholder}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={4}>
          <Popover.Popup className="bg-white border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-3 z-50">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              defaultMonth={defaultMonth}
              disabled={disabled}
              classNames={{
                root: "text-sm",
                months: "flex flex-col",
                month: "space-y-3",
                month_caption: "flex justify-center items-center h-8",
                caption_label: "text-sm font-medium text-foreground",
                nav: "flex items-center justify-between absolute inset-x-0 top-0 px-1",
                button_previous:
                  "size-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-subtle transition-colors",
                button_next:
                  "size-8 flex items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-subtle transition-colors",
                weekdays: "grid grid-cols-7 mb-1",
                weekday: "text-muted text-xs font-medium text-center w-9",
                weeks: "space-y-1",
                week: "grid grid-cols-7",
                day: "text-center",
                day_button: cn(
                  "size-9 rounded-md text-sm transition-colors",
                  "hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30",
                ),
                selected:
                  "!bg-primary !text-white hover:!bg-primary rounded-md",
                today: "bg-subtle text-foreground font-semibold rounded-md",
                outside: "text-muted opacity-50",
                disabled: "text-muted !opacity-30 pointer-events-none",
                hidden: "invisible",
              }}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
