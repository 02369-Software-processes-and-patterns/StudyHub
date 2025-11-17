<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { enhance } from '$app/forms';
    import Modal from './Modal.svelte';

    export let isOpen = false;
    export let task = null;
    export let courses: Array<{ id: string; name: string }> = [];

    const dispatch = createEventDispatcher();

    let formData = {
        name: '',
        effort_hours: 0,
        course_id: '',
        deadline: ''
    };

    let errorMessage = '';

    // Load task data when modal opens
    $: if (task && isOpen) {
        formData = {
            name: task.name,
            effort_hours: task.effort_hours,
            course_id: task.course_id ?? '',
            deadline: task.deadline ? task.deadline.slice(0, 16) : ''
        };
    }

    function closeModal() {
        isOpen = false;
        errorMessage = '';
        dispatch('close');
    }
</script>

<Modal bind:isOpen title="Edit Task" on:close={closeModal}>
    {#if errorMessage}
        <div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            Error: {errorMessage}
        </div>
    {/if}

    <form 
        method="POST"
        action={`/tasks/${task?.id}?/edit`} 
        use:enhance={({ cancel }) => {
            return async ({ result, update }) => {
                if (result.type === 'success') {
                    dispatch('taskUpdated');
                    closeModal();
                } else if (result.type === 'failure') {
                    type FailureData = { message?: string };
                    const msg = (result.data as FailureData | undefined)?.message ?? 'Unknown error';
                    errorMessage = msg;
                }
                await update();
            };
        }}
        class="space-y-4"
    >
        <label class="block">
            <span class="text-gray-700 font-medium">Task Name *</span>
            <input
                id="name"
                name="name"
                type="text"
                bind:value={formData.name}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
        </label>

        <label class="block">
            <span class="text-gray-700 font-medium">Effort (hours) *</span>
            <input
                id="effort_hours"
                name="effort_hours"
                type="number"
                min="0"
                step="0.5"
                bind:value={formData.effort_hours}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
        </label>

        <label class="block">
            <span class="text-gray-700 font-medium">Course</span>
            <select
                id="course_id"
                name="course_id"
                bind:value={formData.course_id}
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:border-blue-500 focus:ring focus:ring-blue-200"
            >
                <option value="">None (optional)</option>
                {#each courses as course (course.id)}
                    <option value={course.id}>{course.name}</option>
                {/each}
            </select>
        </label>

        <label class="block">
            <span class="text-gray-700 font-medium">Deadline *</span>
            <input
                id="deadline"
                name="deadline"
                type="datetime-local"
                bind:value={formData.deadline}
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm px-3 py-2 border focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
        </label>

        <div class="flex gap-3 pt-4 border-t border-gray-200">
            <button
                type="button"
                on:click={closeModal}
                class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
                Cancel
            </button>
            <button
                type="submit"
                class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
                Save changes
            </button>
        </div>
    </form>
</Modal>
