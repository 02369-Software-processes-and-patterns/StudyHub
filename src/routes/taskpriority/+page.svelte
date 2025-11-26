<!-- filepath: /Users/jepperohdenielsen/Desktop/Uddannelse/DTU/3. Semester/Software patterns/StudyHub-2.0/src/routes/+page.svelte -->
<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import AddTaskModal from '$lib/components/modal/AddTaskModal.svelte';
    import EditTaskModal from '$lib/components/modal/EditTaskModal.svelte';
    import TaskList from '$lib/components/list/TaskList.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    let isModalOpen = false;
    let isEditOpen = false;
    let taskToEdit: {
        id: string | number;
        name: string;
        effort_hours?: number | null;
        course_id?: string | null;
        deadline?: string | null;
        status?: string;
        priority?: number | null;
    } | null = null;

    async function handleTaskAdded() {
        await invalidateAll();
        isModalOpen = false;
    }

    function openEdit(task: {
        id: string | number;
        name: string;
        effort_hours?: number | null;
        course_id?: string | null;
        deadline?: string | null;
        status?: string;
        priority?: number | null;
    }) {
        taskToEdit = task;
        isEditOpen = true;
    }

    $: highPriorityCount = data.tasks?.filter((t) => t.priority === 1).length ?? 0;
    $: mediumPriorityCount = data.tasks?.filter((t) => t.priority === 2).length ?? 0;
    $: lowPriorityCount = data.tasks?.filter((t) => t.priority === 3).length ?? 0;
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
    <div class="mx-auto max-w-6xl">
        <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
            <div>
                <h1
                    class="mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl leading-tight font-bold text-transparent sm:text-3xl md:mb-3 md:text-4xl"
                >
                    Task Priority
                </h1>
                <p class="text-sm text-gray-600 sm:text-base">
                    Manage your tasks by priority level to focus on what matters most.
                </p>
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
            <div class="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
                <p class="text-xs tracking-wide text-gray-500 uppercase">High Priority</p>
                <p class="mt-2 text-2xl font-bold text-red-600">{highPriorityCount}</p>
            </div>
            <div class="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                <p class="text-xs tracking-wide text-gray-500 uppercase">Medium Priority</p>
                <p class="mt-2 text-2xl font-bold text-orange-600">{mediumPriorityCount}</p>
            </div>
            <div class="rounded-2xl border border-yellow-100 bg-white p-4 shadow-sm">
                <p class="text-xs tracking-wide text-gray-500 uppercase">Low Priority</p>
                <p class="mt-2 text-2xl font-bold text-yellow-600">{lowPriorityCount}</p>
            </div>
        </div>

        {#if data.tasks && data.tasks.length > 0}
            <div class="space-y-3">
                <TaskList tasks={data.tasks} {openEdit} />
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

<EditTaskModal
    bind:isOpen={isEditOpen}
    task={taskToEdit}
    courses={data.courses}
    on:taskUpdated={() => invalidateAll()}
/>