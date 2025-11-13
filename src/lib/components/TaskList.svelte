<script lang="ts">
	import { enhance } from '$app/forms';

	type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

	type CourseRef = {
		id: string | number;
		name: string;
	};

	type Task = {
		id: string | number;
		name: string;
		status: TaskStatus;
		deadline?: string | null;
		effort_hours?: number | null;
		course?: CourseRef | null;
	};

	export let tasks: Task[] = [];

	const statusOptions = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'todo', label: 'To do' },
		{ value: 'on-hold', label: 'On-hold' },
		{ value: 'working', label: 'Working' },
		{ value: 'completed', label: 'Completed' }
	] as const satisfies ReadonlyArray<{ value: TaskStatus; label: string }>;

	function fmtDeadline(value?: string | null) {
		if (!value) return '-';
		const d = new Date(value);
		try {
			return new Intl.DateTimeFormat('da-DK', {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'Europe/Copenhagen'
			}).format(d);
		} catch {
			return value;
		}
	}
</script>

{#if tasks.length > 0}
	<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Deadline</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Title</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Course</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Status</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Remaining time estimate</th
					>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Edit</th
					>
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200 bg-white">
				{#each tasks as task (task.id)}
					<tr class="transition hover:bg-gray-50">
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
							<span title={task.deadline}>{fmtDeadline(task.deadline)}</span>
						</td>

						<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
							{task.name}
						</td>

						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
							{task.course?.name ?? '-'}
						</td>

						<td class="px-6 py-4 text-sm whitespace-nowrap">
							<form method="POST" action="?/updateTask" use:enhance>
								<input type="hidden" name="task_id" value={task.id} />
								<select
									name="status"
									class="rounded-md border-gray-300 bg-white px-3 py-1 pr-8 text-sm focus:border-violet-500 focus:ring-violet-500"
									on:change={(e) => e.currentTarget.form?.requestSubmit()}
									aria-label="Change task status"
								>
									{#each statusOptions as opt (opt.value)}
										<option value={opt.value} selected={task.status === opt.value}>
											{opt.label}
										</option>
									{/each}
								</select>
							</form>
						</td>

						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-700">
							{task.effort_hours != null ? `${task.effort_hours} h` : '-'}
						</td>

						<td class="px-6 py-4 text-sm whitespace-nowrap">
							<button type="button" class="text-indigo-600 hover:text-indigo-900" title="Edit task">
								✏️
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow">
		<div class="mb-4 text-6xl">📚</div>
		<h2 class="mb-2 text-2xl font-bold text-gray-900">No tasks yet</h2>
		<p class="text-gray-600">Get started by adding your first task to track your workload.</p>
	</div>
{/if}
