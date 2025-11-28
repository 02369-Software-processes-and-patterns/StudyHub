<script lang="ts">
	import {
		calculateWeekData,
		calculateMonthData,
		calculateCustomData,
		calculateSummaryTotals,
		getStartOfWeek
	} from '$lib/utility/workloadCalculation';
	import type { WorkloadTask, DayData, WeekData } from '$lib/types';

	export let tasks: WorkloadTask[] = [];

	let viewMode: 'week' | 'month' | 'custom' = 'week';
	let customStartDate = '';
	let customEndDate = '';
	let weekOffset = 0;
	let monthOffset = 0;
	let weekData: DayData[] = [];
	let monthData: WeekData[] = [];

	// Reactive statements to recalculate data when offset changes
	$: weekData = calculateWeekData(tasks, weekOffset);
	$: monthData = calculateMonthData(tasks, monthOffset);
	$: customData =
		customStartDate && customEndDate
			? calculateCustomData(tasks, customStartDate, customEndDate)
			: [];
	$: displayData = viewMode === 'week' ? weekData : viewMode === 'month' ? monthData : customData;
	$: maxValue = Math.max(...displayData.map((d) => d.overdue + d.incomplete + d.completed), 1);

	function getBarHeight(value: number): number {
		return (value / maxValue) * 100;
	}

	// These date computations are derived from primitive reactive values (weekOffset, monthOffset)
	// and don't need SvelteDate since they're recomputed on each reactive update
	/* eslint-disable svelte/prefer-svelte-reactivity */
	$: currentWeekTargetDate = (() => {
		const d = new Date();
		d.setDate(d.getDate() + weekOffset * 7);
		return d;
	})();
	$: weekStart = getStartOfWeek(currentWeekTargetDate);
	$: weekEnd = (() => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + 6);
		return d;
	})();

	$: currentMonthTargetDate = (() => {
		const d = new Date();
		d.setMonth(d.getMonth() + monthOffset);
		return d;
	})();
	/* eslint-enable svelte/prefer-svelte-reactivity */
	$: monthStart = (() => {
		return new Date(currentMonthTargetDate.getFullYear(), currentMonthTargetDate.getMonth(), 1);
	})();
	$: monthEnd = (() => {
		return new Date(currentMonthTargetDate.getFullYear(), currentMonthTargetDate.getMonth() + 1, 0);
	})();

	$: summaryTotals = calculateSummaryTotals(displayData);
	$: totalOverdue = summaryTotals.totalOverdue;
	$: totalIncomplete = summaryTotals.totalIncomplete;
	$: totalCompleted = summaryTotals.totalCompleted;
</script>

<div class="min-h-[550px] rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:p-6">
	<div class="mb-6">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<h2 class="text-xl font-semibold text-gray-800">Workload Overview</h2>

			<div class="flex gap-2">
				<button
					type="button"
					on:click={() => {
						viewMode = 'week';
						weekOffset = 0;
					}}
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {viewMode === 'week'
						? 'bg-indigo-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					Week
				</button>
				<button
					type="button"
					on:click={() => {
						viewMode = 'month';
						monthOffset = 0;
					}}
					class="rounded-lg px-4 py-2 text-sm font-medium transition-colors {viewMode === 'month'
						? 'bg-indigo-600 text-white'
						: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
				>
					Month
				</button>
				<button
					type="button"
					on:click={() => {
						viewMode = 'custom';
					}}
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
					on:click={() => (viewMode === 'week' ? weekOffset-- : monthOffset--)}
					class="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Previous
				</button>

				<div class="text-sm font-medium text-gray-700">
					{#if viewMode === 'week'}
						{weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString(
							'en-US',
							{ month: 'short', day: 'numeric', year: 'numeric' }
						)}
					{:else if viewMode === 'month'}
						{monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ({monthStart.toLocaleDateString(
							'en-US',
							{ day: 'numeric' }
						)} - {monthEnd.toLocaleDateString('en-US', { day: 'numeric' })})
					{:else}
						{@const targetDate = (() => {
							const d = new Date();
							d.setMonth(d.getMonth() + monthOffset);
							return d;
						})()}
						{targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
					{/if}
				</div>

				<button
					type="button"
					on:click={() => (viewMode === 'week' ? weekOffset++ : monthOffset++)}
					class="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
				>
					Next
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>

			{#if viewMode === 'week' || viewMode === 'month'}
				<div style="height:2rem" class="flex items-center">
					{#if (viewMode === 'week' && weekOffset !== 0) || (viewMode === 'month' && monthOffset !== 0)}
						<button
							type="button"
							on:click={() => {
								weekOffset = 0;
								monthOffset = 0;
							}}
							class="text-sm font-medium text-indigo-600 hover:text-indigo-700"
						>
							Return to current {viewMode}
						</button>
					{:else}
						<div style="height:2rem"></div>
					{/if}
				</div>
			{/if}
		{/if}

		<!-- Custom Date Range Picker -->
		{#if viewMode === 'custom'}
			<div class="mt-4 flex flex-wrap items-end gap-4 rounded-lg bg-gray-50 p-4">
				<div class="min-w-[200px] flex-1">
					<label for="start-date" class="mb-1 block text-sm font-medium text-gray-700">
						Start Date
					</label>
					<input
						id="start-date"
						type="date"
						bind:value={customStartDate}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
					/>
				</div>
				<div class="min-w-[200px] flex-1">
					<label for="end-date" class="mb-1 block text-sm font-medium text-gray-700">
						End Date
					</label>
					<input
						id="end-date"
						type="date"
						bind:value={customEndDate}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
	<div class="relative -mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
		<div style="min-width: {displayData.length * 50}px;">
			<!-- Y-axis labels -->
			<div
				class="absolute top-0 left-0 flex h-64 flex-col justify-between bg-white pr-2 text-xs text-gray-500"
			>
				<span>{maxValue}h</span>
				<span>{Math.round(maxValue * 0.75)}h</span>
				<span>{Math.round(maxValue * 0.5)}h</span>
				<span>{Math.round(maxValue * 0.25)}h</span>
				<span>0h</span>
			</div>

			<!-- Chart area -->
			<div
				class="ml-6 flex h-64 items-end gap-1 border-b border-l border-gray-300 sm:ml-8 sm:gap-2"
			>
				{#each displayData as data (data.label)}
					{@const total = data.overdue + data.incomplete + data.completed}
					<div class="flex flex-1 flex-col items-center gap-1">
						<!-- Bar stack -->
						<div
							class="relative flex w-full flex-col items-center justify-end"
							style="height: 256px;"
						>
							{#if total > 0}
								<div class="relative flex w-full max-w-[60px] flex-col items-center">
									<!-- Completed (bottom) -->
									{#if data.completed > 0}
										<div
											class="w-full
										{data.incomplete === 0 && data.overdue === 0 ? 'rounded-md' : 'rounded-t-md'}
										bg-gradient-to-t from-green-500 to-green-400
										shadow-lg ring-1 ring-black/10
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
										bg-gradient-to-t from-yellow-500 to-yellow-300
										shadow-lg ring-1 ring-black/10
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
										bg-gradient-to-t from-red-500 to-red-400
										shadow-lg ring-1 ring-black/10
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
	</div>

	<!-- Summary stats -->
	<div class="mt-6 grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
		<div class="text-center">
			<div class="text-2xl font-bold text-red-600">{totalOverdue}h</div>
			<div class="text-sm text-gray-600">Overdue</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-bold text-yellow-600">{totalIncomplete}h</div>
			<div class="text-sm text-gray-600">Incomplete</div>
		</div>
		<div class="text-center">
			<div class="text-2xl font-bold text-green-600">{totalCompleted}h</div>
			<div class="text-sm text-gray-600">Completed</div>
		</div>
	</div>
</div>
