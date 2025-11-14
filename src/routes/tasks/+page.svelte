<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import AddTaskModal from '$lib/components/modal/AddTaskModal.svelte';
	import TaskList from '$lib/components/list/TaskList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let isModalOpen = false;

	async function handleTaskAdded() {
		await invalidateAll();
		isModalOpen = false;
	}

	$: totalTasks = data.tasks?.length ?? 0;
	$: pendingTasks = data.tasks?.filter((t) => t.status === 'pending').length ?? 0;

	function fmtDeadline(value?: string) {
		if (!value) return '-';
		const d = new Date(value);
		try {
			return new Intl.DateTimeFormat('da-DK', { dateStyle: 'medium', timeStyle: 'short' }).format(
				d
			);
		} catch {
			return value;
		}
	}

	$: nextDeadline = (() => {
		const withDeadline = (data.tasks ?? []).filter((t) => !!t.deadline);
		if (withDeadline.length === 0) return '-';
		const soonest = withDeadline
			.map((t) => new Date(t.deadline as string))
			.sort((a, b) => a.getTime() - b.getTime())[0];
		return fmtDeadline(soonest.toISOString());
	})();
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
	<div class="mx-auto max-w-6xl">
		<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
			<div>
				<h1
					class="mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl leading-tight font-bold text-transparent sm:text-3xl md:text-4xl md:mb-3"
				>
					My Tasks
				</h1>
				<p class="text-sm text-gray-600 sm:text-base">Plan and track your tasks across courses.</p>
			</div>

			<button
				on:click={() => (isModalOpen = true)}
				class="inline-flex items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2 text-sm
					   font-semibold text-white shadow-md transition-shadow duration-200 hover:shadow-lg sm:self-start"
				aria-haspopup="dialog"
			>
				<span class="text-xl leading-none">+</span>
				<span>Add Task</span>
			</button>
		</header>

		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Next deadline</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{nextDeadline}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Total tasks</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{totalTasks}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Pending</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{pendingTasks}</p>
			</div>
		</div>

		{#if data.tasks && data.tasks.length > 0}
			<div class="space-y-3">
				<TaskList tasks={data.tasks} />
			</div>
		{:else}
			<div class="py-12 text-center">
				<p class="mb-4 text-gray-500">You don't have any tasks yet.</p>
				<button
					on:click={() => (isModalOpen = true)}
					class="rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 font-semibold text-white shadow"
				>
					Add your first task
				</button>
			</div>
		{/if}
	</div>
</div>

<AddTaskModal bind:isOpen={isModalOpen} courses={data.courses} on:taskAdded={handleTaskAdded} />
