<script lang="ts">
	import WorkloadList from '$lib/components/list/WorkloadList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	$: tasks = data.tasks ?? [];
	$: totalTasks = tasks.length;
	$: incompleteTasks = tasks.filter((t) => t.status !== 'completed').length;
	$: completedTasks = tasks.filter((t) => t.status === 'completed').length;
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
	<div class="mx-auto max-w-6xl">
		<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
			<div>
				<h1
					class="mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl leading-tight font-bold text-transparent sm:text-3xl md:mb-3 md:text-4xl"
				>
					Workload Overview
				</h1>
				<p class="text-sm text-gray-600 sm:text-base">
					Visualize your task distribution and manage your workload effectively.
				</p>
			</div>
		</header>

		<!-- Statistikbokse -->
		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Total Tasks</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{totalTasks}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Incomplete</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{incompleteTasks}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Completed</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{completedTasks}</p>
			</div>
		</div>

		<!-- Workload Chart -->
		{#if tasks.length > 0}
			<WorkloadList {tasks} />
		{:else}
			<!-- Hvis der ikke er nogen opgaver så vises der intet display -->
			<div class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
				<p class="mb-4 text-gray-500">No tasks to display.</p>
				<p class="text-sm text-gray-400">
					Add tasks with deadlines to see your workload visualization.
				</p>
			</div>
		{/if}
	</div>
</div>
