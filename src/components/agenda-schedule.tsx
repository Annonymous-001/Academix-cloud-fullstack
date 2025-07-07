"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ADToBS } from "bikram-sambat-js"

interface AgendaEvent {
  id: string
  title: string
  description?: string
  date: Date
  startTime: string
  endTime: string
  location?: string
  color?: string
  priority?: "low" | "medium" | "high"
  category?: string
  type?: string
}

interface AgendaScheduleProps {
  events: AgendaEvent[]
  initialDate?: Date
  daysToShow?: number
}

export function AgendaSchedule({ events, initialDate = new Date(), daysToShow = 5 }: AgendaScheduleProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)

  // Navigate to previous/next period
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - daysToShow)
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + daysToShow)
    setCurrentDate(newDate)
  }

  // Get date range for display
  const getDateRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)
    end.setDate(end.getDate() + daysToShow - 1)

    const startBS = ADToBS(start.toISOString().split('T')[0]);
    const endBS = ADToBS(end.toISOString().split('T')[0]);
    const [startYear, startMonth, startDay] = startBS.split('-').map(Number);
    const [endYear, endMonth, endDay] = endBS.split('-').map(Number);
    const monthNames = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];

    return `${monthNames[startMonth - 1]} ${startDay} - ${monthNames[endMonth - 1]} ${endDay}`;
  }

  // Get days to display
  const getDaysToDisplay = () => {
    const days = []

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(currentDate)
      date.setDate(date.getDate() + i)
      days.push(date)
    }

    return days
  }

  // Format date for display
  const formatDate = (date: Date) => {
    const bsDate = ADToBS(date.toISOString().split('T')[0]);
    const [year, month, day] = bsDate.split('-').map(Number);
    const monthNames = [
      'बैशाख', 'जेठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
      'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];
    const weekDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
    const weekDay = weekDays[date.getDay()];
    return `${weekDay}, ${monthNames[month - 1]} ${day}`;
  }

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

  // Get priority color
  const getPriorityColor = (priority?: "low" | "medium" | "high") => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-300"
    }
  }

  // Check if a day has any events
  const hasEvents = (date: Date) => {
    return getEventsAndLessonsForDay(date).others.length > 0
  }

  const days = getDaysToDisplay()

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>Agenda</span>
          </h2>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium px-2">{getDateRange()}</span>

            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {days.map((day, dayIndex) => {
            const { lessons, others } = getEventsAndLessonsForDay(day)
            // Track which events/lessons have been rendered
            const renderedIds = new Set<string>()
            // Build rows: if overlap, render together; else, render alone
            const rows: React.ReactNode[] = []
            for (let i = 0; i < others.length; ++i) {
              const event = others[i]
              if (renderedIds.has(event.id)) continue
              // Find overlapping lesson
              const lesson = lessons.find(lesson => isOverlap(event, lesson) && !renderedIds.has(lesson.id))
              if (lesson) {
                // Render split card
                rows.push(
                  <div key={event.id + '-' + lesson.id} className="flex gap-2">
                    <Card className="flex-1 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-1" style={{ backgroundColor: event.color || "#6366f1" }}></div>
                          <div className="flex-1 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-16 text-center">
                                <div className="text-sm font-medium">{event.startTime}</div>
                                <Separator className="my-1" />
                                <div className="text-sm text-gray-500">{event.endTime}</div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{event.title}</h4>
                                  {event.priority && (
                                    <div className={cn("w-2 h-2 rounded-full", getPriorityColor(event.priority))}></div>
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                                )}
                                {event.location && (
                                  <p className="text-xs text-gray-500 mt-1 italic">📍 {event.location}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="flex-1 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-1" style={{ backgroundColor: lesson.color || "#6366f1" }}></div>
                          <div className="flex-1 p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-16 text-center">
                                <div className="text-sm font-medium">{lesson.startTime}</div>
                                <Separator className="my-1" />
                                <div className="text-sm text-gray-500">{lesson.endTime}</div>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{lesson.title}</h4>
                                  {lesson.priority && (
                                    <div className={cn("w-2 h-2 rounded-full", getPriorityColor(lesson.priority))}></div>
                                  )}
                                </div>
                                {lesson.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.description}</p>
                                )}
                                {lesson.location && (
                                  <p className="text-xs text-gray-500 mt-1 italic">📍 {lesson.location}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
                renderedIds.add(event.id)
                renderedIds.add(lesson.id)
              } else {
                // Render event alone
                rows.push(
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-1" style={{ backgroundColor: event.color || "#6366f1" }}></div>
                        <div className="flex-1 p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-16 text-center">
                              <div className="text-sm font-medium">{event.startTime}</div>
                              <Separator className="my-1" />
                              <div className="text-sm text-gray-500">{event.endTime}</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{event.title}</h4>
                                {event.priority && (
                                  <div className={cn("w-2 h-2 rounded-full", getPriorityColor(event.priority))}></div>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                              )}
                              {event.location && (
                                <p className="text-xs text-gray-500 mt-1 italic">📍 {event.location}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
                renderedIds.add(event.id)
              }
            }
            // Render remaining lessons that were not paired
            for (let i = 0; i < lessons.length; ++i) {
              const lesson = lessons[i]
              if (renderedIds.has(lesson.id)) continue
              rows.push(
                <Card key={lesson.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-1" style={{ backgroundColor: lesson.color || "#6366f1" }}></div>
                      <div className="flex-1 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className="text-sm font-medium">{lesson.startTime}</div>
                            <Separator className="my-1" />
                            <div className="text-sm text-gray-500">{lesson.endTime}</div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{lesson.title}</h4>
                              {lesson.priority && (
                                <div className={cn("w-2 h-2 rounded-full", getPriorityColor(lesson.priority))}></div>
                              )}
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{lesson.description}</p>
                            )}
                            {lesson.location && (
                              <p className="text-xs text-gray-500 mt-1 italic">📍 {lesson.location}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
              renderedIds.add(lesson.id)
            }

            return (
              <div key={dayIndex}>
                <div className="flex items-center gap-4 mb-2">
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center w-14 h-14 rounded-full border-2",
                      day.toDateString() === new Date().toDateString()
                        ? "border-primary bg-primary/10"
                        : "border-gray-200",
                      hasEvents(day) ? "ring-2 ring-primary/20" : "",
                    )}
                  >
                    <span className="text-xs font-medium">
                      {new Intl.DateTimeFormat("en-US", { month: "short" }).format(day)}
                    </span>
                    <span className="text-xl font-bold">
                      {new Intl.DateTimeFormat("en-US", { day: "numeric" }).format(day)}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-medium">{formatDate(day)}</h3>
                    <p className="text-sm text-gray-500">
                      {hasEvents(day)
                        ? `${others.length} event${others.length !== 1 ? "s" : ""}`
                        : "No events scheduled"}
                    </p>
                  </div>
                </div>

                {rows.length > 0 ? (
                  <div className="pl-7 border-l-2 border-gray-200 ml-7 space-y-3">{rows}</div>
                ) : (
                  <div className="pl-7 border-l-2 border-gray-200 ml-7 py-4">
                    <p className="text-sm text-gray-500 italic">Free day</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
