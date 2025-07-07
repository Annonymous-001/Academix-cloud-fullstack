"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ADToBS } from "bikram-sambat-js"

interface TimelineEvent {
  id: string
  title: string
  description?: string
  date: Date
  startTime: string
  endTime: string
  duration: number // in minutes
  color?: string
  category?: string // allow category
  type?: string // allow type
}

interface TimelineScheduleProps {
  events: TimelineEvent[]
  initialDate?: Date
}

export function TimelineSchedule({ events, initialDate = new Date() }: TimelineScheduleProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [view, setView] = useState<"day" | "3day">("day")

  // Format date for display
  const formatDate = (date: Date) => {
    const bsDate = ADToBS(date.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    const monthNames = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];
    const weekDays = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];
    const weekDay = weekDays[date.getDay()];
    return `${weekDay}, ${monthNames[month - 1]} ${day}`;
  }

  // Navigate to previous/next day
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() - 3)
    }
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else {
      newDate.setDate(newDate.getDate() + 3)
    }
    setCurrentDate(newDate)
  }

  // Get days to display based on view
  const getDaysToDisplay = () => {
    const days = []
    const daysToShow = view === "day" ? 1 : 3

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() + i)
      days.push(date)
    }

    return days
  }

  // Convert time string to minutes from midnight
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Convert minutes to time string
  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`
  }

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = []
    for (let i = 7; i <= 19; i++) {
      slots.push(i * 60) // Hours in minutes
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  function isOverlap(a: { startTime: string, endTime: string }, b: { startTime: string, endTime: string }) {
    const [aStart, aEnd] = [a.startTime, a.endTime].map(t => new Date(`2000-01-01T${t}`));
    const [bStart, bEnd] = [b.startTime, b.endTime].map(t => new Date(`2000-01-01T${t}`));
    return aStart < bEnd && aEnd > bStart;
  }

  // Get events for a specific day, but keep lessons and events separate
  const getEventsAndLessonsForDay = (date: Date) => {
    const all = events.filter((event) => {
      const eventDate = new Date(event.date)
      return eventDate.toDateString() === date.toDateString()
    })
    // Assume lessons have category 'class' or type 'lesson', events have other category/type
    const lessons = all.filter(e => e.category === 'class' || e.type === 'lesson')
    const others = all.filter(e => !(e.category === 'class' || e.type === 'lesson'))
    // Sort by start time
    lessons.sort((a, b) => a.startTime.localeCompare(b.startTime))
    others.sort((a, b) => a.startTime.localeCompare(b.startTime))
    return { lessons, others }
  }

  // Calculate position and height for an event
  const calculateEventStyle = (event: TimelineEvent) => {
    const startMinutes = timeToMinutes(event.startTime)
    const endMinutes = startMinutes + event.duration

    const startTime = 7 * 60 // 7 AM in minutes
    const totalMinutes = 12 * 60 // 12 hours in minutes

    const top = ((startMinutes - startTime) / totalMinutes) * 100
    const height = (event.duration / totalMinutes) * 100

    return {
      top: `${top}%`,
      height: `${height}%`,
      backgroundColor: event.color || "#e0f2fe",
      borderLeft: `3px solid ${event.color ? event.color.replace("fe", "9c") : "#93c5fd"}`,
    }
  }

  const days = getDaysToDisplay()

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Timeline</h2>

          <div className="flex items-center space-x-4">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="3day">3 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="text-lg font-medium">
            {view === "day" ? formatDate(currentDate) : `${formatDate(days[0])} - ${formatDate(days[days.length - 1])}`}
          </h3>

          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex border rounded-lg overflow-hidden h-[600px]">
          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r bg-gray-50">
            <div className="h-12 border-b flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <div className="relative h-[calc(100%-3rem)]">
              {timeSlots.map((minutes, index) => (
                <div
                  key={index}
                  className="absolute w-full text-xs text-gray-500 text-right pr-2"
                  style={{ top: `${(index / (timeSlots.length - 1)) * 100}%`, transform: "translateY(-50%)" }}
                >
                  {minutesToTime(minutes)}
                </div>
              ))}
            </div>
          </div>

          {/* Days columns */}
          <div className="flex-1 flex">
            {days.map((day, dayIndex) => {
              const { lessons, others } = getEventsAndLessonsForDay(day)
              const renderedIds = new Set<string>()
              const rows: React.ReactNode[] = []
              for (let i = 0; i < others.length; ++i) {
                const event = others[i]
                if (renderedIds.has(event.id)) continue
                const lesson = lessons.find(lesson => isOverlap(event, lesson) && !renderedIds.has(lesson.id))
                if (lesson) {
                  // Render split
                  rows.push(
                    <div key={event.id + '-' + lesson.id} className="absolute left-1 right-1 flex gap-2" style={{top: calculateEventStyle(event).top, height: calculateEventStyle(event).height}}>
                      <div className="flex-1 rounded-sm p-2 overflow-hidden text-xs shadow-sm" style={{backgroundColor: event.color || '#e0f2fe', borderLeft: `3px solid ${event.color ? event.color.replace('fe','9c') : '#93c5fd'}`}}>
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs opacity-80 truncate">{event.startTime} - {event.endTime}</div>
                        {event.description && <div className="text-xs mt-1 line-clamp-2">{event.description}</div>}
                      </div>
                      <div className="flex-1 rounded-sm p-2 overflow-hidden text-xs shadow-sm" style={{backgroundColor: lesson.color || '#e0f2fe', borderLeft: `3px solid ${lesson.color ? lesson.color.replace('fe','9c') : '#93c5fd'}`}}>
                        <div className="font-medium truncate">{lesson.title}</div>
                        <div className="text-xs opacity-80 truncate">{lesson.startTime} - {lesson.endTime}</div>
                        {lesson.description && <div className="text-xs mt-1 line-clamp-2">{lesson.description}</div>}
                      </div>
                    </div>
                  )
                  renderedIds.add(event.id)
                  renderedIds.add(lesson.id)
                } else {
                  // Render event alone
                  rows.push(
                    <div key={event.id} className="absolute left-1 right-1 rounded-sm p-2 overflow-hidden text-xs shadow-sm" style={calculateEventStyle(event)}>
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-xs opacity-80 truncate">{event.startTime} - {event.endTime}</div>
                      {event.description && <div className="text-xs mt-1 line-clamp-2">{event.description}</div>}
                    </div>
                  )
                  renderedIds.add(event.id)
                }
              }
              // Render remaining lessons
              for (let i = 0; i < lessons.length; ++i) {
                const lesson = lessons[i]
                if (renderedIds.has(lesson.id)) continue
                rows.push(
                  <div key={lesson.id} className="absolute left-1 right-1 rounded-sm p-2 overflow-hidden text-xs shadow-sm" style={calculateEventStyle(lesson)}>
                    <div className="font-medium truncate">{lesson.title}</div>
                    <div className="text-xs opacity-80 truncate">{lesson.startTime} - {lesson.endTime}</div>
                    {lesson.description && <div className="text-xs mt-1 line-clamp-2">{lesson.description}</div>}
                  </div>
                )
                renderedIds.add(lesson.id)
              }
              return (
                <div key={dayIndex} className={cn("flex-1 relative", dayIndex < days.length - 1 && "border-r")}>
                  {/* Day header */}
                  <div className="h-12 border-b flex items-center justify-center bg-gray-50 sticky top-0">
                    <div className="text-sm font-medium">{formatDate(day)}</div>
                  </div>

                  {/* Time grid */}
                  <div className="relative h-[calc(100%-3rem)]">
                    {timeSlots.map((_, index) => (
                      <div
                        key={index}
                        className={cn("absolute w-full border-b border-gray-100", index === 0 && "border-t")}
                        style={{
                          top: `${(index / (timeSlots.length - 1)) * 100}%`,
                          height: `${100 / (timeSlots.length - 1)}%`,
                        }}
                      />
                    ))}
                    {rows}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
