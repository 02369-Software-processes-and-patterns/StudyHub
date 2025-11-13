export interface Task {
    id: string;
    name: string;
    effort_hours: number;
    deadline: string;
    completed?: boolean;
}

export interface WorkloadData {
    totalHours: number;
    upcomingWeekHours: number;
    overdueHours: number;
    taskCount: number;
    upcomingTaskCount: number;
    overdueTaskCount: number;
}

export function calculateWorkload(tasks: Task[]): WorkloadData {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    const upcomingWeekTasks = incompleteTasks.filter(task => {
        const deadline = new Date(task.deadline);
        return deadline >= now && deadline <= oneWeekFromNow;
    });
    
    const overdueTasks = incompleteTasks.filter(task => {
        const deadline = new Date(task.deadline);
        return deadline < now;
    });
    
    return {
        totalHours: incompleteTasks.reduce((sum, task) => sum + task.effort_hours, 0),
        upcomingWeekHours: upcomingWeekTasks.reduce((sum, task) => sum + task.effort_hours, 0),
        overdueHours: overdueTasks.reduce((sum, task) => sum + task.effort_hours, 0),
        taskCount: incompleteTasks.length,
        upcomingTaskCount: upcomingWeekTasks.length,
        overdueTaskCount: overdueTasks.length
    };
}