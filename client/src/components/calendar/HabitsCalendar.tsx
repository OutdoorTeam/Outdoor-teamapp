import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface HabitsCalendarProps {
  habitsData: Record<string, number>; // fecha -> número de hábitos completados
}

export function HabitsCalendar({ habitsData }: HabitsCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const habitsCompleted = habitsData[dateStr] || 0;
    
    if (habitsCompleted >= 2) return 'success';
    if (habitsCompleted > 0) return 'warning';
    return 'default';
  };

  const getDayClassName = (date: Date) => {
    const status = getDayStatus(date);
    const isCurrentMonth = isSameMonth(date, currentDate);
    const isToday = isSameDay(date, new Date());
    
    let className = 'w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors cursor-pointer ';
    
    if (!isCurrentMonth) {
      className += 'text-muted-foreground opacity-50 ';
    } else {
      className += 'text-foreground ';
    }
    
    if (isToday) {
      className += 'ring-2 ring-primary ';
    }
    
    if (status === 'success') {
      className += 'bg-green-600 text-white hover:bg-green-700 ';
    } else if (status === 'warning') {
      className += 'bg-yellow-600 text-white hover:bg-yellow-700 ';
    } else {
      className += 'hover:bg-muted ';
    }
    
    return className;
  };

  const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <Card className="bg-card border-border border-2">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-foreground">
          <span className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendario de Hábitos
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-10 flex items-center justify-center text-sm font-bold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Días del calendario */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => (
              <div
                key={date.toISOString()}
                className={getDayClassName(date)}
              >
                {format(date, 'd')}
              </div>
            ))}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded"></div>
              <span className="text-foreground">2+ hábitos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-600 rounded"></div>
              <span className="text-foreground">1 hábito</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted border border-border rounded"></div>
              <span className="text-foreground">Sin hábitos</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
