<script lang="ts">
    type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

    interface Task {
        id: string | number;
        name: string;
        status: TaskStatus;
        deadline?: string | null;
        effort_hours?: number | null;
        [key: string]: any;
    }

    interface DayData {
        date: Date;
        label: string;
        overdue: number;
        incomplete: number;
        completed: number;
    }

    interface WeekData {
        weekNumber: number;
        label: string;
        overdue: number;
        incomplete: number;
        completed: number;
    }

    export let tasks: Task[] = [];

    let viewMode: 'week' | 'month' | 'custom' = 'week';
    let customStartDate = '';
    let customEndDate = '';
    let showCustomDatePicker = false;
    let weekOffset = 0;
    let monthOffset = 0;
    let weekData: DayData[] = [];
    let monthData: WeekData[] = [];

    function getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getStartOfMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function getEndOfMonth(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    function getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    }

    // --- FIXED LOGIC BELOW ---
    function isTaskOverdue(task: Task, now: Date): boolean {
        if (!task.deadline || task.status === 'completed') return false;
        const deadline = new Date(task.deadline);
        return deadline < now;
    }

    function isTaskIncomplete(task: Task, now: Date): boolean {
        if (!task.deadline || task.status === 'completed') return false;
        const deadline = new Date(task.deadline);
        return deadline >= now;
    }

    function isTaskCompleted(task: Task): boolean {
        return task.status === 'completed';
    }

    function calculateWeekData(): DayData[] {
        const now = new Date();
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + (weekOffset * 7));
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

            let overdue = 0, incomplete = 0, completed = 0;
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

    function calculateMonthData(): WeekData[] {
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

    function calculateCustomData(): WeekData[] {
        if (!customStartDate || !customEndDate) {
            return [];
        }

        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);

        if (startDate > endDate) {
            return [];
        }

        const weeksMap = new Map<number, WeekData>();

        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
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

        const now = new Date();

        tasks.forEach((task) => {
            if (!task.deadline) return;

            const taskDate = new Date(task.deadline);
            if (taskDate >= startDate && taskDate <= endDate) {
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

    $: {
        weekOffset;
        weekData = calculateWeekData();
    }
    $: {
        monthOffset;
        monthData = calculateMonthData();
    }
    $: customData = customStartDate && customEndDate ? calculateCustomData() : [];
    $: displayData = viewMode === 'week' ? weekData : viewMode === 'month' ? monthData : customData;
    $: maxValue = Math.max(
        ...displayData.map((d) => d.overdue + d.incomplete + d.completed),
        1
    );

    function getBarHeight(value: number): number {
        return (value / maxValue) * 100;
    }

    function getTotal(data: DayData | WeekData): number {
        return data.overdue + data.incomplete + data.completed;
    }
	
	$: currentMonthTargetDate = (() => {
		const d = new Date();
		d.setMonth(d.getMonth() + monthOffset);
		return d;
	})();
	$: monthStart = getStartOfMonth(currentMonthTargetDate);
	$: monthEnd = getEndOfMonth(currentMonthTargetDate);


	$: currentWeekTargetDate = (() => {
		const d = new Date();
		d.setDate(d.getDate() + (weekOffset * 7));
		return d;
	})();
	$: weekStart = getStartOfWeek(currentWeekTargetDate);
	$: weekEnd = (() => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + 6);
		return d;
	})();

    $: totalOverdue = displayData.reduce((sum, d) => sum + d.overdue, 0);
    $: totalIncomplete = displayData.reduce((sum, d) => sum + d.incomplete, 0);
    $: totalCompleted = displayData.reduce((sum, d) => sum + d.completed, 0);
</script>


<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm min-h-[550px]">
    <div class="mb-6">
        <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-800">Workload Overview</h2>
            
            <div class="flex gap-2">
                <button
                    type="button"
                    on:click={() => { viewMode = 'week'; weekOffset = 0; }}
                    class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {viewMode === 'week'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                >
                    Week
                </button>
                <button
                    type="button"
                    on:click={() => { viewMode = 'month'; monthOffset = 0; }}
                    class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {viewMode === 'month'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                >
                    Month
                </button>
                <button
                    type="button"
                    on:click={() => { viewMode = 'custom'; showCustomDatePicker = !showCustomDatePicker; }}
                    class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {viewMode === 'custom'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                >
                    Custom
                </button>
            </div>
        </div>
        
        <!-- Week/Month Navigation -->
        {#if viewMode === 'week' || viewMode === 'month'}
            <div class="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <button
                    type="button"
                    on:click={() => viewMode === 'week' ? weekOffset-- : monthOffset--}
                    class="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-300"
                >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                </button>
                
                <div class="text-sm font-medium text-gray-700">
					{#if viewMode === 'week'}
						{weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
					{:else if viewMode === 'month'}
						{monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ({monthStart.toLocaleDateString('en-US', { day: 'numeric' })} - {monthEnd.toLocaleDateString('en-US', { day: 'numeric' })})
					{:else}
						{@const targetDate = new Date()}
						{@const _ = targetDate.setMonth(targetDate.getMonth() + monthOffset)}
						{targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					{/if}
				</div>
				
                <button
                    type="button"
                    on:click={() => viewMode === 'week' ? weekOffset++ : monthOffset++}
                    class="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-300"
                >
                    Next
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
            
            {#if viewMode === 'week' && weekOffset !== 0 || viewMode === 'month' && monthOffset !== 0}
                <button
                    type="button"
                    on:click={() => { weekOffset = 0; monthOffset = 0; }}
                    class="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                    Return to current {viewMode}
                </button>
            {/if}
        {/if}
        
        <!-- Custom Date Range Picker -->
        {#if viewMode === 'custom'}
            <div class="mt-4 flex flex-wrap gap-4 items-end rounded-lg bg-gray-50 p-4">
                <div class="flex-1 min-w-[200px]">
                    <label for="start-date" class="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        id="start-date"
                        type="date"
                        bind:value={customStartDate}
                        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <div class="flex-1 min-w-[200px]">
                    <label for="end-date" class="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        id="end-date"
                        type="date"
                        bind:value={customEndDate}
                        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                {#if customStartDate && customEndDate}
                    <div class="text-sm text-gray-600">
                        {customData.length} week{customData.length !== 1 ? 's' : ''}
                    </div>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Legend -->
    <div class="mb-6 flex flex-wrap gap-4 text-sm">
        <div class="flex items-center gap-2">
            <div class="h-4 w-4 rounded bg-red-500"></div>
            <span class="text-gray-700">Overdue (hours)</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="h-4 w-4 rounded bg-yellow-500"></div>
            <span class="text-gray-700">Incomplete (hours)</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="h-4 w-4 rounded bg-green-500"></div>
            <span class="text-gray-700">Completed (hours)</span>
        </div>
    </div>

    <!-- Bar Chart -->
    <div class="ml-8 flex h-64 items-end gap-2 border-b border-l border-gray-300">
        {#each displayData as data}
            {@const total = data.overdue + data.incomplete + data.completed}
            <div class="flex flex-1 flex-col items-center gap-1">
                <!-- Bar stack -->
                <div class="relative flex w-full flex-col items-center justify-end" style="height: 256px;">
                    {#if total > 0}
                        <div class="relative flex w-full max-w-[60px] flex-col items-center">
                            <!-- Completed (bottom) -->
							{#if data.completed > 0}
								<div
									class="w-full 
										{data.incomplete === 0 && data.overdue === 0 ? 'rounded-md' : 'rounded-t-md'}
										shadow-lg ring-1 ring-black/10
										bg-gradient-to-t from-green-500 to-green-400
										transition-all hover:brightness-110"
									style="height: {getBarHeight(data.completed)}px;"
									title="Completed: {data.completed}"
								></div>
							{/if}
							<!-- Incomplete (middle) -->
							{#if data.incomplete > 0}
								<div
									class="w-full 
										{data.completed === 0 && data.overdue === 0 ? 'rounded-md' : ''}
										{data.overdue === 0 ? 'rounded-b-md' : ''}
										shadow-lg ring-1 ring-black/10
										bg-gradient-to-t from-yellow-500 to-yellow-300
										transition-all hover:brightness-110"
									style="height: {getBarHeight(data.incomplete)}px;"
									title="Incomplete: {data.incomplete}"
								></div>
							{/if}
							<!-- Overdue (top) -->
							{#if data.overdue > 0}
								<div
									class="w-full 
										{data.completed === 0 && data.incomplete === 0 ? 'rounded-md' : 'rounded-b-md'}
										shadow-lg ring-1 ring-black/10
										bg-gradient-to-t from-red-500 to-red-400
										transition-all hover:brightness-110"
									style="height: {getBarHeight(data.overdue)}px;"
									title="Overdue: {data.overdue}"
								></div>
							{/if}
                            <!-- Total label on top of bar -->
                            <div class="absolute -top-6 text-xs font-semibold text-gray-700">
                                {total}
                            </div>
                        </div>
                    {:else}
                        <div class="h-0 w-full max-w-[60px]"></div>
                    {/if}
                </div>
                <!-- X-axis label -->
                <div class="mt-2 text-center text-xs font-medium text-gray-600">
                    {data.label}
                </div>
            </div>
        {/each}
    </div>
</div>

<!-- Summary stats -->
<div class="mt-1 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-1">
    <div class="text-center">
        <div class="text-lg font-bold text-red-600">{totalOverdue}h</div>
        <div class="text-xs text-gray-600">Overdue</div>
    </div>
    <div class="text-center">
        <div class="text-lg font-bold text-yellow-600">{totalIncomplete}h</div>
        <div class="text-xs text-gray-600">Incomplete</div>
    </div>
    <div class="text-center">
        <div class="text-lg font-bold text-green-600">{totalCompleted}h</div>
        <div class="text-xs text-gray-600">Completed</div>
    </div>
</div>