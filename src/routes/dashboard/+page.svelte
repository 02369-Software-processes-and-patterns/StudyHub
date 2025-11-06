<script>
</script>

<div class="container mx-auto px-4 py-12 max-w-6xl">
	<!-- Hero Section -->
	<div class="text-center mb-16 mt-8">
		<h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
			Welcome to StudyHub
		</h1>
		<p class="text-xl text-gray-600 max-w-2xl mx-auto">
			Your central hub for managing tasks, tracking workload, and staying organized.
		</p>
	</div>

	<!-- Feature Cards -->
	<div class="grid md:grid-cols-3 gap-8 mb-16">
		<!-- Dashboard Card -->
		<div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
			<div class="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
				<svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold text-gray-900 mb-3">Dashboard</h2>
			<p class="text-gray-600 mb-4">
				Get a comprehensive overview of your study progress and upcoming deadlines.
			</p>
			<a href="/dashboard" class="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center">
				View Dashboard
				<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>

		<!-- Workload Card -->
		<div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
			<div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
				<svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold text-gray-900 mb-3">Workload</h2>
			<p class="text-gray-600 mb-4">
				Track and manage your course load to maintain a healthy work-life balance.
			</p>
			<a href="/workload" class="text-purple-600 font-semibold hover:text-purple-700 inline-flex items-center">
				Manage Workload
				<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>

		<!-- Tasks Card -->
		<div class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow border border-gray-100">
			<div class="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
				<svg class="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold text-gray-900 mb-3">Tasks</h2>
			<p class="text-gray-600 mb-4">
				Organize and prioritize your assignments to stay on top of everything.
			</p>
			<a href="/tasks" class="text-pink-600 font-semibold hover:text-pink-700 inline-flex items-center">
				View Tasks
				<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>

	<!-- Stats Section -->
	<div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
		<h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Your Progress</h2>
		<div class="grid md:grid-cols-4 gap-6">
			<div class="text-center">
				<div class="text-4xl font-bold text-indigo-600 mb-2">12</div>
				<div class="text-gray-600">Active Tasks</div>
			</div>
			<div class="text-center">
				<div class="text-4xl font-bold text-purple-600 mb-2">5</div>
				<div class="text-gray-600">Courses</div>
			</div>
			<div class="text-center">
				<div class="text-4xl font-bold text-pink-600 mb-2">87%</div>
				<div class="text-gray-600">Completion Rate</div>
			</div>
			<div class="text-center">
				<div class="text-4xl font-bold text-green-600 mb-2">24</div>
				<div class="text-gray-600">Days Streak</div>
			</div>
		</div>
	</div>
</div>