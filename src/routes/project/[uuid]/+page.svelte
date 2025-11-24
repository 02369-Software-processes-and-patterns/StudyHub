<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/client';

	let project: any = null;
	let loading = true;
	let error: string | null = null;

	// Get uuid from route params
	let uuid: string = '';
	$: uuid = $page.params.uuid;

	onMount(async () => {
		loading = true;
		error = null;
		const { data, error: err } = await supabase
			.from('projects')
			.select('id, name, description, status, created_at, course:courses(id, name)')
			.eq('id', uuid)
			.single();
		if (err) {
			error = err.message;
		} else {
			project = data;
		}
		loading = false;
	});
</script>

{#if loading}
	<div class="p-8 text-center text-gray-500">Loading project…</div>
{:else if error}
	<div class="p-8 text-center text-red-500">{error}</div>
{:else if project}
	<div class="max-w-2xl mx-auto p-8">
		<h1 class="text-2xl font-bold mb-2">{project.name}</h1>
		<div class="mb-4 text-gray-600">{project.description}</div>
		<div class="mb-2">
			<span class="font-semibold">Status:</span> {project.status}
		</div>
		<div class="mb-2">
			<span class="font-semibold">Course:</span> {project.course?.name ?? '-'}
		</div>
		<div class="mb-2 text-gray-500 text-sm">
			<span class="font-semibold">Created:</span> {project.created_at}
		</div>
	</div>
{:else}
	<div class="p-8 text-center text-gray-500">Project not found.</div>
{/if}
