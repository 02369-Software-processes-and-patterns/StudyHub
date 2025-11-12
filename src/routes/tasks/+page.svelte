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

    <AddTaskModal
        bind:isOpen={isModalOpen}
        courses={data.courses}
        on:taskAdded={handleTaskAdded}
    />
</div>