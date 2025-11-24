<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import AddProjectModal from '$lib/components/modal/AddProjectModal.svelte';
	import ProjectList from '$lib/components/list/ProjectList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let showAddProjectModal = false;

	async function handleProjectAdded() {
		await invalidateAll();
		showAddProjectModal = false;
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">My Projects</h1>
			<p class="mt-2 text-gray-600">View and manage all your collaborative projects</p>
		</div>

		<button
			on:click={() => (showAddProjectModal = true)}
			class="inline-flex items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 hover:shadow-lg sm:self-start"
			aria-haspopup="dialog"
		>
			<span class="text-xl leading-none">+</span>
			<span>New Project</span>
		</button>
	</div>

	<ProjectList projects={data.projects} showViewAll={false} />
</div>

<AddProjectModal 
	bind:showModal={showAddProjectModal} 
	courses={data.courses}
	on:projectAdded={handleProjectAdded}
/>
