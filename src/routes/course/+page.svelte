<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import AddCourseModal from '$lib/components/modal/course/AddCourseModal.svelte';
	import EditCourseModal from '$lib/components/modal/course/EditCourseModal.svelte';
	import CourseList from '$lib/components/list/CourseList.svelte';
	import type { PageData } from './$types';
	import type { CourseForEdit } from '$lib/types';

	export let data: PageData;

	let showAddCourseModal = false;
	let isEditOpen = false;
	let courseToEdit: CourseForEdit | null = null;

	async function handleCourseAdded() {
		await invalidateAll();
		showAddCourseModal = false;
	}

	async function handleCourseDeleted() {
		await invalidateAll();
	}

	async function handleCourseUpdated() {
		await invalidateAll();
		isEditOpen = false;
	}

	function openEdit(course: CourseForEdit) {
		courseToEdit = course;
		isEditOpen = true;
	}

	$: totalECTS = data.courses?.reduce((sum, course) => sum + (course.ects_points || 0), 0) ?? 0;

	$: totalCourses = data.courses?.length ?? 0;

	$: activeCourses =
		data.courses?.filter((c) => {
			if (!c.end_date) return true;
			return new Date(c.end_date) >= new Date();
		}).length ?? 0;
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
	<div class="mx-auto max-w-6xl">
		<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between md:mb-8">
			<div>
				<h1
					class="mb-2 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-2xl leading-tight font-bold text-transparent sm:text-3xl md:mb-3 md:text-4xl"
				>
					My Courses
				</h1>
				<p class="text-sm text-gray-600 sm:text-base">
					Manage your courses and track your workload
				</p>
			</div>

			<button
				on:click={() => (showAddCourseModal = true)}
				class="inline-flex items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2 text-sm
                       font-semibold text-white shadow-md transition-shadow duration-200 hover:shadow-lg sm:self-start"
				aria-haspopup="dialog"
			>
				<span class="text-xl leading-none">+</span>
				<span>Add Course</span>
			</button>
		</header>

		<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Total Courses</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{totalCourses}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Active Courses</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{activeCourses}</p>
			</div>
			<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
				<p class="text-xs tracking-wide text-gray-500 uppercase">Total ECTS</p>
				<p class="mt-2 text-2xl font-bold text-gray-900">{totalECTS}</p>
			</div>
		</div>

		{#if data.courses && data.courses.length > 0}
			<div class="space-y-3">
				<CourseList courses={data.courses} {openEdit} on:delete={handleCourseDeleted} />
			</div>
		{:else}
			<div class="py-12 text-center">
				<p class="mb-4 text-gray-500">You don't have any courses yet.</p>
				<button
					on:click={() => (showAddCourseModal = true)}
					class="rounded-md bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 font-semibold text-white shadow"
				>
					Add your first course
				</button>
			</div>
		{/if}
	</div>
</div>

<AddCourseModal bind:isOpen={showAddCourseModal} on:courseAdded={handleCourseAdded} />

<EditCourseModal
	bind:isOpen={isEditOpen}
	course={courseToEdit}
	on:courseUpdated={handleCourseUpdated}
/>
