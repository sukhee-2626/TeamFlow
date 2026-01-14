import { Task } from "@/types/database";
import { Clock } from "lucide-react/dist/esm/icons/clock";
import { CheckCircle2 } from "lucide-react/dist/esm/icons/check-circle-2";
import { AlertTriangle } from "lucide-react/dist/esm/icons/alert-triangle";
import { ListTodo } from "lucide-react/dist/esm/icons/list-todo";
import { isPast, format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface WorkspaceDashboardProps {
  tasks: Task[];
  currentUserId: string;
}

export function WorkspaceDashboard({ tasks, currentUserId }: WorkspaceDashboardProps) {
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const ongoingCount = tasks.filter(t => t.status === 'ongoing').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => 
    t.status !== 'completed' && isPast(new Date(t.deadline))
  ).length;

  const myTasks = tasks.filter(t => t.assigned_user_id === currentUserId);
  
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5);

  const pieData = [
    { name: 'To Do', value: todoCount, color: '#64748b' },
    { name: 'Done', value: completedCount, color: '#22c55e' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Tasks</span>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{tasks.length}</p>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">In Progress</span>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{ongoingCount}</p>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <p className="text-3xl font-bold text-foreground">{completedCount}</p>
        </div>

        <div className="card-elevated p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-3xl font-bold text-destructive">{overdueCount}</p>
        </div>
      </div>

      {/* Charts and My Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Task Distribution</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No tasks yet
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            My Tasks ({myTasks.length})
          </h3>
          {myTasks.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {myTasks.map(task => (
                <div key={task.id} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(task.deadline), 'MMM d, yyyy')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No tasks assigned to you
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="card-elevated p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Deadlines</h3>
        {upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeadlines.map(task => {
              const deadline = new Date(task.deadline);
              const isOverdue = isPast(deadline);
              
              return (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                      {format(deadline, 'MMM d')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(deadline, 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No upcoming deadlines
          </div>
        )}
      </div>
    </div>
  );
}
