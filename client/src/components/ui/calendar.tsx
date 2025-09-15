import * as React from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, parse, isValid } from "date-fns"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// Enhanced Calendar component with built-in date picker functionality
interface DatePickerCalendarProps {
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  variant?: "outline" | "ghost" | "default"
  mode?: "picker" // When mode is "picker", it shows as a date picker with input and popover
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps & DatePickerCalendarProps) {
  const [month, setMonth] = React.useState<Date>(props.month || new Date())
  const [open, setOpen] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = 1955  // Changed from currentYear - 100
    const endYear = currentYear + 10
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  }, [])

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Format date as mm/dd/yyyy for display
  const formatDateForDisplay = (date: Date): string => {
    return format(date, "MM/dd/yyyy")
  }

  // Parse date from various mm/dd/yyyy formats
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null
    
    // Try different mm/dd/yyyy patterns
    const patterns = ["MM/dd/yyyy", "M/d/yyyy", "MM/d/yyyy", "M/dd/yyyy", "MM/dd/yy", "M/d/yy"]
    
    for (const pattern of patterns) {
      const parsed = parse(dateString, pattern, new Date())
      if (isValid(parsed)) return parsed
    }
    
    return null
  }

  // Calculate the month to show in calendar (current selected date or today)
  const getCalendarMonth = React.useCallback((): Date => {
    if (props.value) {
      const date = new Date(props.value)
      if (isValid(date)) {
        return date
      }
    }
    return new Date() // Default to current month if no valid date
  }, [props.value])

  // Update input value when prop value changes
  React.useEffect(() => {
    if (props.mode === "picker" && props.value) {
      const date = new Date(props.value)
      if (isValid(date)) {
        setInputValue(formatDateForDisplay(date))
      }
    } else if (props.mode === "picker") {
      setInputValue("")
    }
  }, [props.value, props.mode])

  // Update calendar month when value changes (for picker mode)
  React.useEffect(() => {
    if (props.mode === "picker") {
      setMonth(getCalendarMonth())
    } else if (props.month) {
      setMonth(props.month)
    }
  }, [props.month, props.mode, getCalendarMonth])

  const handleYearChange = (year: string) => {
    const newDate = new Date(month)
    newDate.setFullYear(parseInt(year))
    setMonth(newDate)
    props.onMonthChange?.(newDate)
  }

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(month)
    newDate.setMonth(parseInt(monthIndex))
    setMonth(newDate)
    props.onMonthChange?.(newDate)
  }

  // Date picker functionality
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Try to parse the date as user types
    const parsedDate = parseDate(newValue)
    if (parsedDate && isValid(parsedDate)) {
      props.onChange?.(parsedDate.toISOString().split('T')[0])
    } else if (newValue === "") {
      props.onChange?.(undefined)
    }
  }

  const handleInputBlur = () => {
    // On blur, try to format the input if it's a valid date
    const parsedDate = parseDate(inputValue)
    if (parsedDate && isValid(parsedDate)) {
      setInputValue(formatDateForDisplay(parsedDate))
      // Fix timezone issue: format date as YYYY-MM-DD without timezone conversion
      const year = parsedDate.getFullYear()
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
      const day = String(parsedDate.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      props.onChange?.(dateString)
    } else if (inputValue && inputValue !== "") {
      // If invalid date, revert to original value or clear
      if (props.value) {
        const date = new Date(props.value)
        if (isValid(date)) {
          setInputValue(formatDateForDisplay(date))
        }
      } else {
        setInputValue("")
        props.onChange?.(undefined)
      }
    }
    setIsEditing(false)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setInputValue(formatDateForDisplay(date))
      // Fix timezone issue: format date as YYYY-MM-DD without timezone conversion
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${day}`
      props.onChange?.(dateString)
    } else {
      setInputValue("")
      props.onChange?.(undefined)
    }
    setOpen(false)
    setIsEditing(false)
  }

  const handleButtonClick = () => {
    // In picker mode, just open the calendar, don't switch to editing
    setOpen(true)
  }

  const handleButtonDoubleClick = () => {
    // Double-click to enable manual editing
    setIsEditing(true)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      // Revert to original value
      if (props.value) {
        const date = new Date(props.value)
        if (isValid(date)) {
          setInputValue(formatDateForDisplay(date))
        }
      } else {
        setInputValue("")
      }
    }
  }

  // If mode is "picker", render as a date picker component
  if (props.mode === "picker") {
    const selectedDate = props.value ? new Date(props.value) : undefined
    const displayText = inputValue || (props.value ? formatDateForDisplay(new Date(props.value)) : "")

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          {isEditing ? (
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder="MM/DD/YYYY"
              className={cn("pr-10", props.className)}
              autoFocus
            />
          ) : (
            <PopoverTrigger asChild>
              <Button
                variant={props.variant || "outline"}
                onClick={handleButtonClick}
                onDoubleClick={handleButtonDoubleClick}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !props.value && "text-muted-foreground",
                  props.className
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {displayText || props.placeholder || "Pick a date"}
              </Button>
            </PopoverTrigger>
          )}
          
          {/* Calendar icon overlay for input mode */}
          {isEditing && (
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          )}
        </div>
        
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={props.disabled}
            month={month}
            onMonthChange={setMonth}
            showOutsideDays={showOutsideDays}
            className={cn("p-3")}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside:
                "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
              ...classNames,
            }}
            components={{
              IconLeft: ({ className, ...props }) => (
                <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
              ),
              IconRight: ({ className, ...props }) => (
                <ChevronRight className={cn("h-4 w-4", className)} {...props} />
              ),
              Caption: ({ displayMonth }) => (
                <div className="flex justify-center items-center gap-2 pt-1 relative w-full">
                  <div className="flex items-center gap-1">
                    <Select
                      value={displayMonth.getMonth().toString()}
                      onValueChange={handleMonthChange}
                    >
                      <SelectTrigger className="h-7 w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={displayMonth.getFullYear().toString()}
                      onValueChange={handleYearChange}
                    >
                      <SelectTrigger className="h-7 w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ),
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )
  }

  // Default calendar mode (existing functionality)
  return (
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
        Caption: ({ displayMonth }) => (
          <div className="flex justify-center items-center gap-2 pt-1 relative w-full">
            <div className="flex items-center gap-1">
              <Select
                value={displayMonth.getMonth().toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="h-7 w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={displayMonth.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="h-7 w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
