<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { enhance } from '$app/forms';

    export let isOpen = false;
    export let courses: Array<{ id: string; name: string }> = [];

    const dispatch = createEventDispatcher();

    let formData = {
        name: '',
        effort_hours: 0,
        course_id: '',
        deadline: ''
    };

    let errorMessage = '';

    function closeModal() {
        isOpen = false;
        errorMessage = '';
        dispatch('close');
    }

    function resetForm() {
        formData = {
            name: '',
            effort_hours: 0,
            course_id: '',
            deadline: ''
        };
    }
</script>

{#if isOpen}
    <div class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div class="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md pointer-events-auto border border-gray-200">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-2xl font-bold text-gray-800">Add New Task</h2>
                <button
                    on:click={closeModal}
                    class="text-gray-500 hover:text-gray-700 text-2xl"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>

            {#if errorMessage}
                <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    Error creating task: {errorMessage}
                    <button 
                        on:click={() => errorMessage = ''}
                        class="float-right text-red-700 hover:text-red-900"
                    >
                        Close
                    </button>
                </div>
            {/if}

            <form 
                method="POST" 
                action="/tasks"
                use:enhance={({ cancel }) => {
                    return async ({ result, update }) => {
                        if (result.type === 'success') {
                            dispatch('taskAdded');
                            closeModal();
                            resetForm();
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
                <div>
                    <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                        Task Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        bind:value={formData.name}
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter task name"
                    />
                </div>

                <div>
                    <label for="effort_hours" class="block text-sm font-medium text-gray-700 mb-1">
                        Effort (hours)
                    </label>
                    <input
                        id="effort_hours"
                        name="effort_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        bind:value={formData.effort_hours}
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter estimated hours"
                    />
                </div>

                <div>
                    <label for="course_id" class="block text-sm font-medium text-gray-700 mb-1">
                        Course
                    </label>
                    <select
                        id="course_id"
                        name="course_id"
                        bind:value={formData.course_id}
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">None (optional)</option>
                        {#each courses as course}
                            <option value={course.id}>{course.name}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label for="deadline" class="block text-sm font-medium text-gray-700 mb-1">
                        Deadline
                    </label>
                    <input
                        id="deadline"
                        name="deadline"
                        type="datetime-local"
                        bind:value={formData.deadline}
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div class="flex gap-3 pt-4">
                    <button
                        type="button"
                        on:click={closeModal}
                        class="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Add Task
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}