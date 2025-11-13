<script>
	import Taskbar from '$lib/components/Taskbar.svelte';
	import { goto } from '$app/navigation';

	export let data;
</script>

<div class="container mx-auto max-w-6xl px-4 py-12">
	<!-- Hero Section -->
	<div class="mt-8 mb-16 text-center">
		<h1
			class="mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-5xl font-bold text-gray-900 text-transparent md:text-6xl"
		>
			Welcome to StudyHub
		</h1>
		<p class="mx-auto max-w-2xl text-xl text-gray-600">
			Your central hub for managing tasks, tracking workload, and staying organized.
		</p>
	</div>

	<!-- Task Bar -->
	<div class="mb-16">
		<Taskbar tasks={data.tasks} maxTasks={6} />
	</div>

	<!-- Feature Cards -->
	<div class="mb-16 grid gap-8 md:grid-cols-3">
		<!-- Dashboard Card -->
		<div
			class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl"
		>
			<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100">
				<svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<h2 class="mb-3 text-2xl font-bold text-gray-900">Dashboard</h2>
			<p class="mb-4 text-gray-600">
				Get a comprehensive overview of your study progress and upcoming deadlines.
			</p>
			<button
				on:click={() => void goto('/dashboard')}
				class="inline-flex cursor-pointer items-center border-none bg-transparent font-semibold text-indigo-600 hover:text-indigo-700"
			>
				View Dashboard
				<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- Workload Card -->
		<div
			class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl"
		>
			<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">
				<svg class="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
					/>
				</svg>
			</div>
			<h2 class="mb-3 text-2xl font-bold text-gray-900">Workload</h2>
			<p class="mb-4 text-gray-600">
				Track and manage your course load to maintain a healthy work-life balance.
			</p>
			<button
				on:click={() => void goto('/workload')}
				class="inline-flex cursor-pointer items-center border-none bg-transparent font-semibold text-purple-600 hover:text-purple-700"
			>
				Manage Workload
				<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>

		<!-- Tasks Card -->
		<div
			class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl"
		>
			<div class="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-pink-100">
				<svg class="h-8 w-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
					/>
				</svg>
			</div>
			<h2 class="mb-3 text-2xl font-bold text-gray-900">Tasks</h2>
			<p class="mb-4 text-gray-600">
				Organize and prioritize your assignments to stay on top of everything.
			</p>
			<button
				on:click={() => void goto('/tasks')}
				class="inline-flex cursor-pointer items-center border-none bg-transparent font-semibold text-pink-600 hover:text-pink-700"
			>
				View Tasks
				<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Stats Section -->
	<div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg">
		<h2 class="mb-8 text-center text-3xl font-bold text-gray-900">Your Progress</h2>
		<div class="grid gap-6 md:grid-cols-4">
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-indigo-600">12</div>
				<div class="text-gray-600">Active Tasks</div>
			</div>
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-purple-600">5</div>
				<div class="text-gray-600">Courses</div>
			</div>
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-pink-600">87%</div>
				<div class="text-gray-600">Completion Rate</div>
			</div>
			<div class="text-center">
				<div class="mb-2 text-4xl font-bold text-green-600">24</div>
				<div class="text-gray-600">Days Streak</div>
			</div>
		</div>
	</div>
</div>
