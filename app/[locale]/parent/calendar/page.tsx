'use client';
import CalendarView from '@/components/CalendarView';
export default function ParentCalendar() {
  return <CalendarView
    backHref="/parent" backLabel="← Back"
    apiPath="/api/parent/calendar/events"
    heading="School Calendar"
    gradientFrom="from-indigo-700" gradientTo="to-violet-800"
  />;
}
