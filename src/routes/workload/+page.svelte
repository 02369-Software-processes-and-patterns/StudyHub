<script lang="ts">
	import WorkloadList from '$lib/components/list/WorkloadList.svelte';
    import WorkloadOverview from '$lib/components/list/WorkloadList.svelte';
	import type { PageData } from './$types';

    export let data: PageData;

	$: tasks = data.tasks ?? [];
	$: totalTasks = tasks.length;
	$: incompleteTasks = tasks.filter((t: any) => t.status !== 'completed').length;
	$: completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
	<div class="mx-auto max-w-7xl">
		<header class="mb-6 md:mb-8">
			<h1
				class="mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl leading-tight font-bold text-transparent sm:text-3xl md:text-4xl md:mb-3"
			>
				Workload Overview
			</h1>
			<p class="text-sm text-gray-600 sm:text-base">
				Visualize your task distribution and manage your workload effectively.
			</p>
		</header>

		<!-- Summary Stats -->
		<div class="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <p class="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Total Tasks</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{totalTasks}</p>
            </div>
            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <p class="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Incomplete</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{incompleteTasks}</p>
            </div>
            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <p class="text-gray-600 text-xs font-semibold mb-1 uppercase tracking-wide">Completed</p>
                <p class="text-3xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{completedTasks}</p>
            </div>
        </div>

		<!-- Workload Chart -->
		{#if tasks.length > 0}
			<WorkloadList tasks={tasks} />
		{:else}
			<div class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
				<p class="mb-4 text-gray-500">No tasks to display.</p>
				<p class="text-sm text-gray-400">Add tasks with deadlines to see your workload visualization.</p>
			</div>
		{/if}
	</div>
</div>