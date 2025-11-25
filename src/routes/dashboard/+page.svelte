<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import TaskList from '$lib/components/list/TaskList.svelte';
	import CourseList from '$lib/components/list/CourseList.svelte';
	import WorkloadList from '$lib/components/list/WorkloadList.svelte';
	import EditTaskModal from '$lib/components/modal/EditTaskModal.svelte';
	import EditCourseModal from '$lib/components/modal/EditCourseModal.svelte';

	export let data;

	const DASHBOARD_TASK_LIMIT = 5;

	// Compute dashboard tasks: up to 5 upcoming incomplete tasks, filled with completed tasks if needed
	$: dashboardTasks = (() => {
		// Get incomplete tasks sorted by deadline (soonest first)
		const incompleteTasks = data.tasks
			.filter(task => task.status !== 'completed')
			.sort((a, b) => {
				const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Infinity;
				const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Infinity;
				return aDeadline - bDeadline;
			})
			.slice(0, DASHBOARD_TASK_LIMIT);

		const remainingSlots = DASHBOARD_TASK_LIMIT - incompleteTasks.length;

		if (remainingSlots <= 0) {
			return incompleteTasks;
		}

		// Fill remaining slots with completed tasks (most recent deadline first)
		const completedTasks = data.tasks
			.filter(task => task.status === 'completed')
			.sort((a, b) => {
				const aDeadline = a.deadline ? new Date(a.deadline).getTime() : 0;
				const bDeadline = b.deadline ? new Date(b.deadline).getTime() : 0;
				return bDeadline - aDeadline;
			})
			.slice(0, remainingSlots);

		return [...incompleteTasks, ...completedTasks];
	})();

	// Task edit state
	let isTaskEditOpen = false;
	let taskToEdit: { id: string | number; name: string; effort_hours?: number | null; course_id?: string | null; deadline?: string | null; } | null = null;

	// Course edit state
	let isCourseEditOpen = false;
	let courseToEdit: {
		id: string | number;
		name: string;
		ects_points: number;
		start_date?: string | null;
		end_date?: string | null;
		lecture_weekdays?: number[] | string | null;
	} | null = null;

	function openTaskEdit(task: typeof taskToEdit) {
		taskToEdit = task;
		isTaskEditOpen = true;
	}

	function openCourseEdit(course: typeof courseToEdit) {
		courseToEdit = course;
		isCourseEditOpen = true;
	}
</script>

<div class="container mx-auto max-w-8xl px-4 py-12">
	<!-- Hero Section -->
	<div class="mt-4 mb-8 text-center md:mt-8 md:mb-16">
		<h1
			class="mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-gray-900 text-transparent sm:text-4xl md:text-5xl lg:text-6xl"
		>
			Welcome to StudyHub
		</h1>
		<p class="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg md:text-xl px-4">
			Your central hub for managing tasks, tracking workload, and staying organized.
		</p>
	</div>

	<!-- Workload bar chart-->
	<div class="mb-16 overflow-hidden">
		<WorkloadList tasks={data.tasks} />
	</div>

	<!-- Task Bar and Courses -->
	<div class="mb-16 grid gap-8 md:grid-cols-3">
		<!-- Upcoming Tasks -->
		<div class="md:col-span-2">
			<TaskList 
				tasks={dashboardTasks} 
				maxTasks={DASHBOARD_TASK_LIMIT} 
				preserveOrder={true} 
				showFilters={false}
				totalTasksOverride={data.tasks.length}
				openEdit={openTaskEdit} 
			/>
		</div>

		<!-- My Courses -->
		<div class="md:col-span-1">
			<CourseList courses={data.courses} maxCourses={5} showStartDate={false} openEdit={openCourseEdit} on:delete={() => invalidateAll()} />
		</div>
	</div>

	<!-- Stats Section -->
	<div class="rounded-2xl border border-gray-100 bg-white p-4 shadow-lg sm:p-6 md:p-8">
		<h2 class="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl md:mb-8">Your Progress in the semester</h2>
		<div class="grid gap-4 grid-cols-3 md:gap-6">
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-indigo-600">{data.tasks.filter(task => task.status !== 'completed').length}</div>
				<div class="text-gray-600">Active Tasks</div>
			</div>
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-purple-600">{data.courses.length}</div>
				<div class="text-gray-600">Courses</div>
			</div>
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-pink-600">
					{data.tasks.length > 0 ? Math.round((data.tasks.filter(task => task.status === 'completed').length / data.tasks.length) * 100) : 0}%
				</div>
				<div class="text-gray-600">Completion Rate</div>
			</div>
		</div>
	</div>
</div>

<EditTaskModal
	bind:isOpen={isTaskEditOpen}
	task={taskToEdit}
	courses={data.courses}
	on:taskUpdated={() => invalidateAll()}
/>

<EditCourseModal
	bind:isOpen={isCourseEditOpen}
	course={courseToEdit}
	on:courseUpdated={() => invalidateAll()}
/>
