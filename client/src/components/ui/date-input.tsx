import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parse, isValid } from "date-fns"

interface DateInputProps {
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  variant?: "outline" | "ghost" | "default"
}

export function DateInput({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  disabled,
  className,
  variant = "outline"
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Format date as mm/dd/yyyy
  const formatDate = (date: Date): string => {
    return format(date, "MM/dd/yyyy")
  }

  // Parse date from mm/dd/yyyy format
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null
    
    // Try parsing mm/dd/yyyy format
    const parsed = parse(dateString, "MM/dd/yyyy", new Date())
    if (isValid(parsed)) return parsed
    
    // Try parsing m/d/yyyy format (single digits)
    const parsed2 = parse(dateString, "M/d/yyyy", new Date())
    if (isValid(parsed2)) return parsed2
    
    // Try parsing mm/d/yyyy format
    const parsed3 = parse(dateString, "MM/d/yyyy", new Date())
    if (isValid(parsed3)) return parsed3
    
    // Try parsing m/dd/yyyy format
    const parsed4 = parse(dateString, "M/dd/yyyy", new Date())
    if (isValid(parsed4)) return parsed4
    
    return null
  }

  // Update input value when prop value changes
  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (isValid(date)) {
        setInputValue(formatDate(date))
      }
    } else {
      setInputValue("")
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Try to parse the date as user types
    const parsedDate = parseDate(newValue)
    if (parsedDate && isValid(parsedDate)) {
      // Convert to ISO string for the form
      onChange?.(parsedDate.toISOString().split('T')[0])
    } else if (newValue === "") {
      onChange?.(undefined)
    }
  }

  const handleInputBlur = () => {
    // On blur, try to format the input if it's a valid date
    const parsedDate = parseDate(inputValue)
    if (parsedDate && isValid(parsedDate)) {
      setInputValue(formatDate(parsedDate))
      onChange?.(parsedDate.toISOString().split('T')[0])
    } else if (inputValue && inputValue !== "") {
      // If invalid date, clear the input
      setInputValue("")
      onChange?.(undefined)
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setInputValue(formatDate(date))
      onChange?.(date.toISOString().split('T')[0])
    }
    setOpen(false)
  }

  const selectedDate = value ? new Date(value) : undefined

  return (
    <div className="flex">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className={cn("rounded-r-none", className)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={variant}
            className="rounded-l-none border-l-0 px-3"
            type="button"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={disabled}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}