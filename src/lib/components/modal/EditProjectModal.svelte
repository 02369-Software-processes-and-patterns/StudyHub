<script lang="ts">
    import { enhance } from '$app/forms';
    import { createEventDispatcher } from 'svelte';
    import Modal from './Modal.svelte';

    const dispatch = createEventDispatcher();

    export let isOpen = false;
    type ProjectWithCourse = {
        id: string | number;
        name: string;
        description?: string | null;
        status?: string | null;
        course_id?: string | number | null;
        course?: { name?: string | null } | null;
    };

    // Projektet der redigeres (forudfylder felter)
    export let project: ProjectWithCourse | null = null;

    let loading = false;
    let error = '';

    // Lokale formværdier (bindes til inputs)
    let formData = {
        name: '',
        description: '',
        status: 'planning',
        course_id: '',
        course_name: ''
    };

    // Tilladte statusværdier
    const statusOptions = [
        { label: 'Planning', value: 'planning' },
        { label: 'Active', value: 'active' },
        { label: 'On Hold', value: 'on-hold' },
        { label: 'Completed', value: 'completed' }
    ];

    // Når modalen åbnes, forudfyld felter fra project
    $: if (isOpen && project) {
        formData = {
            name: project.name ?? '',
            description: project.description ?? '',
            status: project.status ?? 'planning',
            course_id: project.course_id ? String(project.course_id) : '',
            course_name: project.course?.name ?? ''
        };
    }

    // Luk modal og nulstil fejl
    function closeModal() {
        isOpen = false;
        error = '';
        dispatch('close');
    }
</script>

<Modal bind:isOpen title="Edit Project" on:close={closeModal}>
    {#if error}
        <!-- Server/valideringsfejl vises her -->
        <div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
        </div>
    {/if}

    <form
        method="POST"
        action="?/updateProject"
        use:enhance={() => {
            loading = true;
            error = '';
            return async ({ result, update }) => {
                if (result.type === 'success') {
                    // Fortæl forælderen at projektet blev opdateret (så den kan invalidate/reload)
                    dispatch('projectUpdated');
                    closeModal();
                } else if (result.type === 'failure') {
                    const d = result.data as { error?: string } | undefined;
                    error = d?.error || 'Failed to update project';
                }
                loading = false;
                // Opdater siden hvis nødvendigt (holder data i sync)
                await update();
            };
        }}
        class="space-y-4"
    >
        <!-- Bruges af server action hvis den vil krydstjekke -->
        <input type="hidden" name="project_id" value={project?.id} />
        <input type="hidden" name="course_id" value={formData.course_id} />

        <!-- Projektets navn -->
        <label class="block">
            <span class="font-medium text-gray-700">Project Name *</span>
            <input
                type="text"
                name="name"
                bind:value={formData.name}
                required
                disabled={loading}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
        </label>

        <!-- Beskrivelse -->
        <label class="block">
            <span class="font-medium text-gray-700">Description</span>
            <textarea
                name="description"
                rows="4"
                bind:value={formData.description}
                disabled={loading}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
        </label>

        <!-- Statusvælger -->
        <label class="block">
            <span class="font-medium text-gray-700">Status</span>
            <select
                name="status"
                bind:value={formData.status}
                disabled={loading}
                class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
                <option value="">(none)</option>
                {#each statusOptions as opt (opt.value)}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>
        </label>

        <!-- Kursusnavn -->
        <label class="block">
            <span class="font-medium text-gray-700">Course Name</span>
            <input
                type="text"
                name="course_name"
                bind:value={formData.course_name}
                disabled
                class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 shadow-sm"
            />
        </label>

        <!-- Handlinger -->
        <div class="flex gap-3 border-t border-gray-200 pt-4">
            <button
                type="button"
                on:click={closeModal}
                disabled={loading}
                class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                type="submit"
                disabled={loading}
                class="flex-1 rounded-md bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </form>
</Modal>