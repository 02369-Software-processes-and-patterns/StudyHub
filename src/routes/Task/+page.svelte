<script lang="ts">
    import AddTaskModal from '$lib/components/AddTaskModal.svelte';
    import { invalidateAll } from '$app/navigation';

    export let data;

    let isModalOpen = false;

    function openModal() {
        isModalOpen = true;
    }

    function handleTaskAdded() {
        invalidateAll();
    }
</script>

<div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Tasks</h1>
        <button
            on:click={openModal}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
            Add Task
        </button>
    </div>

    {#if data.tasks.length === 0}
        <div class="bg-gray-50 rounded-lg p-8 text-center">
            <p class="text-gray-600">No tasks yet. Click "Add Task" to create your first task!</p>
        </div>
    {:else}
        <div class="bg-white shadow-md rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effort (hrs)</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    {#each data.tasks as task}
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.course_id}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.effort_hours}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(task.deadline).toLocaleDateString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {task.status}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}

    <AddTaskModal
        bind:isOpen={isModalOpen}
        courses={data.courses}
        on:taskAdded={handleTaskAdded}
    />
</div>