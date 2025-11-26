<script lang="ts">
	type TaskStatus = 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';

	type Member = {
		id: string;
		name: string;
		email: string;
		role: 'Owner' | 'Admin' | 'Member';
	};

	type Task = {
		id: string | number;
		name: string;
		status: TaskStatus;
		deadline?: string | null;
		effort_hours?: number | null;
		assignee?: Member | null;
	};

	export let tasks: Task[] = [];
	export let members: Member[] = [];
	export let onAddTask: (() => void) | null = null;

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

	function isOverdue(deadline?: string | null) {
		if (!deadline) return false;
		return new Date(deadline) < new Date();
	}

	const isOverdueTask = (t: Task) => isOverdue(t.deadline) && t.status !== 'completed';
	const isCompletedTask = (t: Task) => t.status === 'completed';
	const isWorkingTask = (t: Task) => t.status === 'working';

	function getDeadlineClass(task: Task) {
		if (isOverdueTask(task) && isWorkingTask(task)) return 'text-orange-600 font-semibold';
		if (isOverdueTask(task)) return 'text-red-600 font-semibold';
		if (isCompletedTask(task)) return 'text-green-600 font-semibold';
		if (isWorkingTask(task)) return 'text-yellow-600 font-semibold';
		return 'text-gray-500';
	}

	function getRowClass(task: Task) {
		if (isOverdueTask(task) && isWorkingTask(task)) return 'bg-orange-50';
		if (isOverdueTask(task)) return 'bg-red-50';
		if (isCompletedTask(task)) return 'bg-green-50';
		if (isWorkingTask(task)) return 'bg-yellow-50';
		return '';
	}

	function getStatusBadgeClass(status: TaskStatus) {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-700';
			case 'working':
				return 'bg-yellow-100 text-yellow-700';
			case 'on-hold':
				return 'bg-orange-100 text-orange-700';
			case 'todo':
				return 'bg-blue-100 text-blue-700';
			case 'pending':
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusLabel(status: TaskStatus) {
		return statusOptions.find((o) => o.value === status)?.label ?? status;
	}

	function getInitials(name: string): string {
		const parts = name.trim().split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
		}
		return name.substring(0, 2).toUpperCase();
	}

	function getAvatarGradient(memberId: string): string {
		const gradients = [
			'from-purple-500 to-pink-500',
			'from-blue-500 to-cyan-500',
			'from-green-500 to-emerald-500',
			'from-orange-500 to-red-500',
			'from-indigo-500 to-purple-500',
			'from-yellow-500 to-orange-500',
			'from-pink-500 to-rose-500',
			'from-teal-500 to-green-500'
		];
		// Use hash of ID to get consistent color
		let hash = 0;
		for (let i = 0; i < memberId.length; i++) {
			hash = memberId.charCodeAt(i) + ((hash << 5) - hash);
		}
		return gradients[Math.abs(hash) % gradients.length];
	}

	// Handler for assignee change
	async function handleAssigneeChange(taskId: string | number, memberId: string) {
		const formData = new FormData();
		formData.append('task_id', String(taskId));
		formData.append('user_id', memberId || '');

		try {
			const response = await fetch('?/assignTask', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				console.error('Failed to assign task');
			}
		} catch (error) {
			console.error('Error assigning task:', error);
		}
	}
</script>

<div class="rounded-2xl border border-gray-100 bg-white shadow-lg h-full flex flex-col">
	<!-- Header -->
	<div class="border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-white p-2 shadow-sm">
					<svg
						class="h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<h2 class="text-lg font-bold text-gray-900">Project Tasks</h2>
			</div>

			{#if onAddTask}
				<button
					type="button"
					on:click={onAddTask}
					class="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-medium text-purple-600 shadow-sm transition-colors hover:bg-purple-50"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
					Add Task
				</button>
			{/if}
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 overflow-auto p-6">
		{#if tasks.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div class="rounded-full bg-purple-100 p-4 mb-4">
					<svg
						class="h-8 w-8 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-1">No tasks yet</h3>
				<p class="text-sm text-gray-500 mb-4">Create your first task to get started</p>
				{#if onAddTask}
					<button
						type="button"
						on:click={onAddTask}
						class="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add Task
					</button>
				{/if}
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
							>
								Task
							</th>
							<th
								class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
							>
								Assignee
							</th>
							<th
								class="hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase md:table-cell"
							>
								Deadline
							</th>
							<th
								class="hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sm:table-cell"
							>
								Status
							</th>
							<th
								class="hidden px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase lg:table-cell"
							>
								Effort
							</th>
						</tr>
					</thead>

					<tbody class="divide-y divide-gray-200 bg-white">
						{#each tasks as task (task.id)}
							<tr class="transition hover:bg-gray-50 {getRowClass(task)}">
								<!-- Task name -->
								<td class="px-4 py-4">
									<div class="font-semibold text-gray-900 text-sm">
										{#if isOverdueTask(task) && isWorkingTask(task)}
											<span class="inline-flex items-center gap-1">
												<span class="text-orange-600">⚠️</span>{task.name}
											</span>
										{:else if isOverdueTask(task)}
											<span class="inline-flex items-center gap-1">
												<span class="text-red-600">⚠️</span>{task.name}
											</span>
										{:else if isCompletedTask(task)}
											<span class="inline-flex items-center gap-1">
												<span class="text-green-600">✓</span>{task.name}
											</span>
										{:else if isWorkingTask(task)}
											<span class="inline-flex items-center gap-1">
												<span class="text-yellow-600">⚙️</span>{task.name}
											</span>
										{:else}
											{task.name}
										{/if}
									</div>
									<!-- Mobile: show deadline below task name -->
									<div
										class="mt-0.5 text-xs md:hidden {getDeadlineClass(task)}"
										title={task.deadline}
									>
										{fmtDeadline(task.deadline)}
									</div>
									<!-- Mobile: show status -->
									<div class="mt-1 sm:hidden">
										<span
											class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {getStatusBadgeClass(task.status)}"
										>
											{getStatusLabel(task.status)}
										</span>
									</div>
									<!-- Mobile: show effort -->
									<div class="mt-0.5 text-xs text-gray-500 lg:hidden">
										{#if task.effort_hours != null}
											{task.effort_hours}h estimated
										{/if}
									</div>
								</td>

								<!-- Assignee -->
								<td class="px-4 py-4">
									<div class="relative">
										<select
											class="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-purple-500 focus:ring-purple-500"
											value={task.assignee?.id ?? ''}
											on:change={(e) => handleAssigneeChange(task.id, e.currentTarget.value)}
											aria-label="Assign task to member"
										>
											<option value="">Unassigned</option>
											{#each members as member (member.id)}
												<option value={member.id}>{member.name}</option>
											{/each}
										</select>
										<!-- Avatar overlay -->
										<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
											{#if task.assignee}
												<div
													class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br {getAvatarGradient(task.assignee.id)} text-xs font-bold text-white"
													title={task.assignee.name}
												>
													{getInitials(task.assignee.name)}
												</div>
											{:else}
												<div
													class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-500"
													title="Unassigned"
												>
													<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
														/>
													</svg>
												</div>
											{/if}
										</div>
										<!-- Dropdown arrow -->
										<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
											<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
											</svg>
										</div>
									</div>
								</td>

								<!-- Deadline -->
								<td
									class="hidden px-4 py-4 text-sm md:table-cell {getDeadlineClass(task)}"
									title={task.deadline}
								>
									{fmtDeadline(task.deadline)}
								</td>

								<!-- Status -->
								<td class="hidden px-4 py-4 sm:table-cell">
									<span
										class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium {getStatusBadgeClass(task.status)}"
									>
										{getStatusLabel(task.status)}
									</span>
								</td>

								<!-- Effort hours -->
								<td class="hidden px-4 py-4 text-sm text-gray-700 lg:table-cell">
									{task.effort_hours != null ? `${task.effort_hours} h` : '-'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
