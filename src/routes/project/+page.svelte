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

	$: totalProjects = data.projects?.length ?? 0;
	$: activeProjects = data.projects?.filter((p) => p.status === 'active').length ?? 0;
	$: completedProjects = data.projects?.filter((p) => p.status === 'completed').length ?? 0;
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
	<div class="mx-auto max-w-6xl">
		<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
			<div>
				<h1
					class="mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl leading-tight font-bold text-transparent sm:text-3xl md:text-4xl md:mb-3"
				>
					My Projects
				</h1>
				<p class="text-sm text-gray-600 sm:text-base">View and manage all your collaborative projects</p>
			</div>

			<button
				on:click={() => (showAddProjectModal = true)}
				class="inline-flex items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2 text-sm
					   font-semibold text-white shadow-md transition-shadow duration-200 hover:shadow-lg sm:self-start"
				aria-haspopup="dialog"
			>
				<span class="text-xl leading-none">+</span>
				<span>New Project</span>
			</button>
		</header>

		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Total Projects</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{totalProjects}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Active Projects</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{activeProjects}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Completed</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{completedProjects}</p>
			</div>
		</div>

		{#if data.projects && data.projects.length > 0}
			<div class="space-y-3">
				<ProjectList projects={data.projects} showViewAll={false} />
			</div>
		{:else}
			<div class="py-12 text-center">
				<p class="mb-4 text-gray-500">You don't have any projects yet.</p>
				<button
					on:click={() => (showAddProjectModal = true)}
					class="rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 font-semibold text-white shadow"
				>
					Create your first project
				</button>
			</div>
		{/if}
	</div>
</div>

<AddProjectModal 
	bind:showModal={showAddProjectModal} 
	courses={data.courses}
	on:projectAdded={handleProjectAdded}
/>
