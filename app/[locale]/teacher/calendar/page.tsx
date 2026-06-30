'use client';
import CalendarView from '@/components/CalendarView';
export default function TeacherCalendar() {
  return <CalendarView
    backHref="/teacher" backLabel="← Back"
    apiPath="/api/teacher/calendar/events"
    heading="School Calendar"
    gradientFrom="from-slate-700" gradientTo="to-slate-800"
  />;
}
