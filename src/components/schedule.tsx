"use client"

import * as React from "react"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ADToBS } from "bikram-sambat-js"

interface ScheduleEvent {
  id: string
  title: string
  start: { day: number; hour: number; minute: number }
  end: { day: number; hour: number; minute: number }
  color?: string
}

interface ScheduleProps {
  startDate: Date
  events?: ScheduleEvent[]
  startHour?: number
  endHour?: number
  view?: "week" | "day" | "work-week"
}

export function Schedule({
  startDate = new Date(),
  events = [],
  startHour = 8,
  endHour = 17,
  view: initialView = "week",
}: ScheduleProps) {
  const [view, setView] = useState<"week" | "day" | "work-week">(initialView)

  // Format date range for display
  const formatDateRange = (date: Date, viewType: "week" | "day" | "work-week") => {
    const start = new Date(date)
    const monthNames = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];

    if (viewType === "day") {
      const bsDate = ADToBS(start.toISOString().split('T')[0]);
      const [year, month, day] = bsDate.split('-').map(Number);
      return `${monthNames[month - 1]} ${day}`;
    }

    const end = new Date(date)
    const daysToAdd = viewType === "work-week" ? 4 : 6
    end.setDate(end.getDate() + daysToAdd)

    const startBS = ADToBS(start.toISOString().split('T')[0]);
    const endBS = ADToBS(end.toISOString().split('T')[0]);
    const [startYear, startMonth, startDay] = startBS.split('-').map(Number);
    const [endYear, endMonth, endDay] = endBS.split('-').map(Number);

    return `${monthNames[startMonth - 1]} ${startDay} - ${endDay}`;
  }

  // Generate time slots
  const timeSlots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
    const hour = Math.floor(i / 2) + startHour
    const minute = (i % 2) * 30
    return { hour, minute }
  })

  // Generate days based on view
  const getDays = () => {
    const days = []
    const dayCount = view === "day" ? 1 : view === "work-week" ? 5 : 7
    const startDay = view === "work-week" ? 1 : 0 // Start from Monday for work week

    for (let i = 0; i < dayCount; i++) {
      const day = new Date(startDate)
      day.setDate(day.getDate() + ((i + (view === "work-week" ? startDay : 0)) % 7))
      days.push(day)
    }

    return days
  }

  const days = getDays()

  // Format time (e.g., "9:00 AM")
  const formatTime = (hour: number, minute: number) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: minute > 0 ? "numeric" : undefined,
      hour12: true,
    }).format(new Date().setHours(hour, minute))
  }

  // Check if an event should be displayed in a cell
  const getEventsForCell = (day: number, hour: number, minute: number) => {
    return events.filter((event) => {
      const eventDay = event.start.day
      const eventStartHour = event.start.hour
      const eventStartMinute = event.start.minute
      const eventEndHour = event.end.hour
      const eventEndMinute = event.end.minute

      // Check if event is on this day and overlaps with this time slot
      return (
        eventDay === day &&
        ((eventStartHour === hour && eventStartMinute <= minute) || eventStartHour < hour) &&
        ((eventEndHour === hour && eventEndMinute > minute) || eventEndHour > hour)
      )
    })
  }

  // Calculate event position and height
  const getEventStyle = (event: ScheduleEvent, cellHeight: number) => {
    const startTime = event.start.hour + event.start.minute / 60
    const endTime = event.end.hour + event.end.minute / 60
    const top = (startTime - startHour) * cellHeight * 2
    const height = (endTime - startTime) * cellHeight * 2

    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: event.color || "#e0f2fe",
    }
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-bold">Schedule</h2>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium">{formatDateRange(startDate, view)}</span>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="work-week">Work Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="overflow-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `auto ${days.map(() => "1fr").join(" ")}`,
            minWidth: days.length > 1 ? "768px" : "500px",
          }}
        >
          {/* Header row with days */}
          <div className="sticky top-0 z-10 bg-background border-b h-12"></div>
          {days.map((day, index) => (
            <div
              key={index}
              className="sticky top-0 z-10 bg-background border-b border-l h-12 flex items-center justify-center"
            >
              <div className="text-sm font-medium">
                {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}
              </div>
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((slot, slotIndex) => (
            <React.Fragment key={slotIndex}>
              <div className="border-b py-2 px-2 sticky left-0 bg-background z-10 text-sm text-right pr-3 w-20">
                {formatTime(slot.hour, slot.minute)}
              </div>

              {days.map((_, dayIndex) => (
                <div key={`${slotIndex}-${dayIndex}`} className="border-b border-l h-12 relative">
                  {getEventsForCell(dayIndex, slot.hour, slot.minute).map((event, eventIndex) => {
                    // Only render the event at its start time
                    if (event.start.hour === slot.hour && event.start.minute === slot.minute) {
                      return (
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute left-0 right-0 mx-1 rounded p-1 overflow-hidden text-xs"
                                style={getEventStyle(event, 24)}
                              >
                                <div className="font-medium truncate">
                                  {formatTime(event.start.hour, event.start.minute)} -{" "}
                                  {formatTime(event.end.hour, event.end.minute)} {event.title}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div>
                                <div className="font-bold">{event.title}</div>
                                <div>
                                  {formatTime(event.start.hour, event.start.minute)} -{" "}
                                  {formatTime(event.end.hour, event.end.minute)}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    }
                    return null
                  })}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
