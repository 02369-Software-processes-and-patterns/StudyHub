<script lang="ts">
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';
	import type { TaskStatus } from '$lib/server/db';

	export let isOpen = false;
	export let task: {
		id: string | number;
		name: string;
		effort_hours?: number | null;
		course_id?: string | null;
		deadline?: string | null;
		status?: TaskStatus;
		priority?: number | null;
	} | null = null;
	export let courses: Array<{ id: string; name: string }> = [];

	const dispatch = createEventDispatcher();

	let editName = '';
	let editEffortHours: number | null = null;
	let editCourseId = '';
	let editDeadline = '';
	let editStatus: TaskStatus = 'pending';
	let editPriority: number | null = 2;

	$: if (task && isOpen) {
		editName = task.name;
		editEffortHours = task.effort_hours ?? null;
		editCourseId = task.course_id || '';
		editDeadline = task.deadline ? formatDatetimeLocal(task.deadline) : '';
		editStatus = task.status || 'pending';
		editPriority = task.priority ?? 2;
	}

	function formatDatetimeLocal(isoString: string): string {
		try {
			const date = new Date(isoString);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			return `${year}-${month}-${day}T${hours}:${minutes}`;
		} catch {
			return '';
		}
	}

	function handleClose() {
		isOpen = false;
	}
</script>

<Modal bind:isOpen title="Edit Task" on:close={handleClose}>
	<form
		method="POST"
		action="?/updateTask"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					handleClose();
					dispatch('taskUpdated');
				}
			};
		}}
	>
		<input type="hidden" name="task_id" value={task?.id} />

		<div class="space-y-4">
			<div>
				<label for="edit-task-name" class="mb-1 block text-sm font-medium text-gray-700">
					Task Name
				</label>
				<input
					id="edit-task-name"
					type="text"
					name="name"
					bind:value={editName}
					required
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="edit-effort-hours" class="mb-1 block text-sm font-medium text-gray-700">
					Effort (hours)
				</label>
				<input
					id="edit-effort-hours"
					type="number"
					name="effort_hours"
					bind:value={editEffortHours}
					min="0"
					step="0.5"
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="edit-deadline" class="mb-1 block text-sm font-medium text-gray-700">
					Deadline
				</label>
				<input
					id="edit-deadline"
					type="datetime-local"
					name="deadline"
					bind:value={editDeadline}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="edit-course" class="mb-1 block text-sm font-medium text-gray-700">
					Course
				</label>
				<select
					id="edit-course"
					name="course_id"
					bind:value={editCourseId}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
				>
					<option value="">No course</option>
					{#each courses as course (course.id)}
						<option value={course.id}>{course.name}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="edit-status" class="mb-1 block text-sm font-medium text-gray-700">
					Status
				</label>
				<select
					id="edit-status"
					name="status"
					bind:value={editStatus}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
				>
					<option value="pending">Pending</option>
					<option value="todo">To Do</option>
					<option value="on-hold">On Hold</option>
					<option value="working">Working</option>
					<option value="completed">Completed</option>
				</select>
			</div>

			<div>
				<label for="edit-priority" class="mb-1 block text-sm font-medium text-gray-700">
					Priority
				</label>
				<select
					id="edit-priority"
					name="priority"
					bind:value={editPriority}
					class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-violet-500 focus:ring-2 focus:ring-violet-500 focus:outline-none"
				>
					<option value={1}>High Priority</option>
					<option value={2}>Medium Priority</option>
					<option value={3}>Low Priority</option>
				</select>
			</div>
		</div>

		<div class="mt-6 flex gap-3">
			<button
				type="button"
				on:click={handleClose}
				class="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 font-medium text-white hover:shadow-lg"
			>
				Save Changes
			</button>
		</div>
	</form>
</Modal>
