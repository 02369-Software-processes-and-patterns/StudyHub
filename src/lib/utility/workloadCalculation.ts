type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

export interface Task {
	id: string | number;
	name: string;
	status: TaskStatus;
	deadline?: string | null;
	effort_hours?: number | null;
	[key: string]: any;
}

export interface DayData {
	date: Date;
	label: string;
	overdue: number;
	incomplete: number;
	completed: number;
}

export interface WeekData {
	weekNumber: number;
	label: string;
	overdue: number;
	incomplete: number;
	completed: number;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

/**
 * Get the start of the month for a given date
 */
export function getStartOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the end of the month for a given date
 */
export function getEndOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Get ISO week number for a given date
 */
export function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Check if a task is overdue (deadline has passed and not completed)
 */
export function isTaskOverdue(task: Task, now: Date): boolean {
	if (!task.deadline || task.status === 'completed') return false;
	const deadline = new Date(task.deadline);
	return deadline < now;
}

/**
 * Check if a task is incomplete (deadline not passed and not completed)
 */
export function isTaskIncomplete(task: Task, now: Date): boolean {
	if (!task.deadline || task.status === 'completed') return false;
	const deadline = new Date(task.deadline);
	return deadline >= now;
}

/**
 * Check if a task is completed
 */
export function isTaskCompleted(task: Task): boolean {
	return task.status === 'completed';
}

/**
 * Calculate workload by day for a specific week
 * @param tasks - Array of tasks to analyze
 * @param weekOffset - Number of weeks from current week (0 = current, -1 = previous, 1 = next)
 * @returns Array of daily workload data
 */
export function calculateWeekData(tasks: Task[], weekOffset: number = 0): DayData[] {
	const now = new Date();
	const targetDate = new Date(now);
	targetDate.setDate(now.getDate() + weekOffset * 7);
	const startOfWeek = getStartOfWeek(targetDate);
	const weekData: DayData[] = [];

	for (let i = 0; i < 7; i++) {
		const date = new Date(startOfWeek);
		date.setDate(startOfWeek.getDate() + i);

		const dateStr = date.toISOString().split('T')[0];
		const dayTasks = tasks.filter((task) => {
			if (!task.deadline) return false;
			// Only match date part (ignore time)
			return task.deadline.slice(0, 10) === dateStr;
		});

		const label = date.toLocaleDateString('en-US', { weekday: 'short' });

		let overdue = 0,
			incomplete = 0,
			completed = 0;
		dayTasks.forEach((t) => {
			const hours = t.effort_hours || 0;
			if (isTaskCompleted(t)) completed += hours;
			else if (isTaskOverdue(t, now)) overdue += hours;
			else if (isTaskIncomplete(t, now)) incomplete += hours;
		});

		weekData.push({
			date,
			label,
			overdue,
			incomplete,
			completed
		});
	}

	return weekData;
}

/**
 * Calculate workload by week for a specific month
 * @param tasks - Array of tasks to analyze
 * @param monthOffset - Number of months from current month (0 = current, -1 = previous, 1 = next)
 * @returns Array of weekly workload data
 */
export function calculateMonthData(tasks: Task[], monthOffset: number = 0): WeekData[] {
	const now = new Date();
	const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
	const startOfMonth = getStartOfMonth(targetDate);
	const endOfMonth = getEndOfMonth(targetDate);

	const weeksMap = new Map<number, WeekData>();

	let currentDate = new Date(startOfMonth);
	while (currentDate <= endOfMonth) {
		const weekNum = getWeekNumber(currentDate);
		if (!weeksMap.has(weekNum)) {
			weeksMap.set(weekNum, {
				weekNumber: weekNum,
				label: `Week ${weekNum}`,
				overdue: 0,
				incomplete: 0,
				completed: 0
			});
		}
		currentDate.setDate(currentDate.getDate() + 1);
	}

	tasks.forEach((task) => {
		if (!task.deadline) return;

		const taskDate = new Date(task.deadline);
		if (taskDate >= startOfMonth && taskDate <= endOfMonth) {
			const weekNum = getWeekNumber(taskDate);
			const weekData = weeksMap.get(weekNum);
			const hours = task.effort_hours || 0;
			if (!weekData) return;
			if (isTaskCompleted(task)) weekData.completed += hours;
			else if (isTaskOverdue(task, now)) weekData.overdue += hours;
			else if (isTaskIncomplete(task, now)) weekData.incomplete += hours;
		}
	});

	return Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * Calculate workload by week for a custom date range
 * @param tasks - Array of tasks to analyze
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns Array of weekly workload data
 */
export function calculateCustomData(
	tasks: Task[],
	startDate: string,
	endDate: string
): WeekData[] {
	if (!startDate || !endDate) {
		return [];
	}

	const start = new Date(startDate);
	const end = new Date(endDate);

	if (start > end) {
		return [];
	}

	const weeksMap = new Map<number, WeekData>();

	let currentDate = new Date(start);
	while (currentDate <= end) {
		const weekNum = getWeekNumber(currentDate);
		if (!weeksMap.has(weekNum)) {
			weeksMap.set(weekNum, {
				weekNumber: weekNum,
				label: `W${weekNum}`,
				overdue: 0,
				incomplete: 0,
				completed: 0
			});
		}
		currentDate.setDate(currentDate.getDate() + 1);
	}

	const now = new Date();

	tasks.forEach((task) => {
		if (!task.deadline) return;

		const taskDate = new Date(task.deadline);
		if (taskDate >= start && taskDate <= end) {
			const weekNum = getWeekNumber(taskDate);
			const weekData = weeksMap.get(weekNum);
			const hours = task.effort_hours || 0;
			if (!weekData) return;
			if (isTaskCompleted(task)) weekData.completed += hours;
			else if (isTaskOverdue(task, now)) weekData.overdue += hours;
			else if (isTaskIncomplete(task, now)) weekData.incomplete += hours;
		}
	});

	return Array.from(weeksMap.values()).sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * Calculate total hours for a data point
 */
export function getTotal(data: DayData | WeekData): number {
	return data.overdue + data.incomplete + data.completed;
}

/**
 * Calculate summary totals for an array of data
 */
export function calculateSummaryTotals(data: (DayData | WeekData)[]): {
	totalOverdue: number;
	totalIncomplete: number;
	totalCompleted: number;
} {
	return {
		totalOverdue: data.reduce((sum, d) => sum + d.overdue, 0),
		totalIncomplete: data.reduce((sum, d) => sum + d.incomplete, 0),
		totalCompleted: data.reduce((sum, d) => sum + d.completed, 0)
	};
}
