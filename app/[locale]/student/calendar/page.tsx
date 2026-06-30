'use client';
import CalendarView from '@/components/CalendarView';
export default function StudentCalendar() {
  return <CalendarView
    backHref="/student" backLabel="← Back"
    apiPath="/api/student/calendar/events"
    heading="School Calendar"
    gradientFrom="from-blue-700" gradientTo="to-indigo-800"
  />;
}
