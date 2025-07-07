"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ADToBS } from "bikram-sambat-js"

interface Event {
  id: string
  title: string
  description?: string
  date: Date
  startTime: string
  endTime: string
  category?: string
  color?: string
}

interface CardScheduleProps {
  events: Event[]
  initialDate?: Date
}

export function CardSchedule({ events, initialDate = new Date() }: CardScheduleProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [view, setView] = useState<"day" | "week" | "month">("week")

  // Format date for display
  const formatDate = (date: Date) => {
    const bsDate = ADToBS(date.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    const monthNames = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }

  // Navigate to previous/next period
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  // Get date range for display
  const getDateRange = () => {
    if (view === "day") {
      return formatDate(currentDate)
    }

    if (view === "week") {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      startOfWeek.setDate(startOfWeek.getDate() - day)

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const startBS = ADToBS(startOfWeek.toISOString().split('T')[0]);
      const endBS = ADToBS(endOfWeek.toISOString().split('T')[0]);
      const [startYear, startMonth, startDay] = startBS.split('-').map(Number);
      const [endYear, endMonth, endDay] = endBS.split('-').map(Number);
      const monthNames = [
        'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
        'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
      ];

      return `${monthNames[startMonth - 1]} ${startDay} - ${monthNames[endMonth - 1]} ${endDay}`;
    }

    const bsDate = ADToBS(currentDate.toISOString().split('T')[0]);
    const [year, month] = bsDate.split('-').map(Number);
    const monthNames = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  // Filter events based on current view
  const getFilteredEvents = () => {
    return events
      .filter((event) => {
        const eventDate = new Date(event.date)

        if (view === "day") {
          return eventDate.toDateString() === currentDate.toDateString()
        }

        if (view === "week") {
          const startOfWeek = new Date(currentDate)
          const day = startOfWeek.getDay()
          startOfWeek.setDate(startOfWeek.getDate() - day)

          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(endOfWeek.getDate() + 6)

          return eventDate >= startOfWeek && eventDate <= endOfWeek
        }

        // Month view
        return eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear()
      })
      .sort((a, b) => {
        // Sort by date first, then by start time
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)

        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }

        return a.startTime.localeCompare(b.startTime)
      })
  }

  // Get category color
  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      meeting: "bg-blue-100 text-blue-800",
      class: "bg-purple-100 text-purple-800",
      personal: "bg-green-100 text-green-800",
      deadline: "bg-red-100 text-red-800",
    }

    return colors[category?.toLowerCase() || ""] || "bg-gray-100 text-gray-800"
  }

  // Format day of week
  const formatDayOfWeek = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
  }

  // Format day
  const formatDay = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(date)
  }

  const filteredEvents = getFilteredEvents()

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Schedule</h2>

          <div className="flex items-center space-x-4">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-lg font-medium">{getDateRange()}</h3>

          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {view === "week" && (
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date(currentDate)
              const day = date.getDay()
              date.setDate(date.getDate() - day + i)

              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-sm text-gray-500">{formatDayOfWeek(date)}</div>
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${date.toDateString() === new Date().toDateString() ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {formatDay(date)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="space-y-3">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-2" style={{ backgroundColor: event.color || "#6366f1" }}></div>
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                        </div>
                        {event.category && <Badge className={getCategoryColor(event.category)}>{event.category}</Badge>}
                      </div>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <span>
                            {new Intl.DateTimeFormat("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            }).format(new Date(event.date))}
                          </span>
                          <span className="mx-2">•</span>
                          <span>
                            {event.startTime} - {event.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No events scheduled for this period</div>
          )}
        </div>
      </div>
    </div>
  )
}
