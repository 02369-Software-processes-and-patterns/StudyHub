<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import AddCourseForm from '$lib/components/AddCourseForm.svelte';
	import CourseList from '$lib/components/CourseList.svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	let showAddCourseModal = false;

	async function handleCourseAdded() {
		await invalidateAll();
	}
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">My Courses</h1>
			<p class="text-gray-600 mt-1">Manage your courses and track your workload</p>
		</div>
		<button 
			on:click={() => (showAddCourseModal = true)}
			class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg"
		>
			<span class="text-xl">+</span>
			Add Course
		</button>
	</div>

	<CourseList courses={data.courses} />
</div>

<AddCourseForm bind:showModal={showAddCourseModal} on:courseAdded={handleCourseAdded} />
