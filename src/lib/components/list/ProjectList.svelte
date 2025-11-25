<script lang="ts">
	import { goto } from '$app/navigation';
	import ListCard from './ListCard.svelte';

	type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
	type CourseRef = { id: string | number; name: string };
	type Project = {
		id: string | number;
		name: string;
		description: string;
		status: ProjectStatus;
		created_at?: string;
		course?: CourseRef | null;
		role?: string;
	};

	export let projects: Project[] = [];
	export let showViewAll: boolean = true;
	// Mulighed for at begrænse antal projekter (f.eks. på dashboard)
	export let maxProjects: number | null = null;

	type StatusFilter = ProjectStatus | 'all';
	type CourseFilter = 'all' | string;

	let nameQuery = '';
	let statusFilter: StatusFilter = 'all';
	let courseFilter: CourseFilter = 'all';

	const statusOptions = [
		{ value: 'planning', label: 'Planning' },
		{ value: 'active', label: 'Active' },
		{ value: 'on-hold', label: 'On-hold' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'archived', label: 'Archived' }
	] as const satisfies ReadonlyArray<{ value: ProjectStatus; label: string }>;

	// Build course options from projects
	$: courseOptions = Array.from(
		new Map(projects.filter((p) => p.course).map((p) => [p.course!.id, p.course!])).values()
	) as CourseRef[];

	// Clear all filters
	function clearFilters() {
		nameQuery = '';
		statusFilter = 'all';
		courseFilter = 'all';
	}

	function fmtDate(value?: string) {
		if (!value) return '-';
		const d = new Date(value);
		try {
			return new Intl.DateTimeFormat('da-DK', {
				dateStyle: 'medium',
				timeZone: 'Europe/Copenhagen'
			}).format(d);
		} catch {
			return value;
		}
	}

	const isCompletedProject = (p: Project) => p.status === 'completed';
	const isActiveProject = (p: Project) => p.status === 'active';
	const isOnHoldProject = (p: Project) => p.status === 'on-hold';

	function getStatusClass(project: Project) {
		if (isCompletedProject(project)) return 'bg-green-100 text-green-800';
		if (isActiveProject(project)) return 'bg-blue-100 text-blue-800';
		if (isOnHoldProject(project)) return 'bg-yellow-100 text-yellow-800';
		if (project.status === 'planning') return 'bg-gray-100 text-gray-800';
		if (project.status === 'archived') return 'bg-purple-100 text-purple-800';
		return 'bg-gray-100 text-gray-800';
	}

	function getRowClass(project: Project) {
		if (isCompletedProject(project)) return 'bg-green-50';
		if (isActiveProject(project)) return 'bg-blue-50';
		if (isOnHoldProject(project)) return 'bg-yellow-50';
		return '';
	}

	// 1) Filtrering
	$: filteredProjects = projects.filter((project) => {
		const matchesName = nameQuery
			? project.name.toLowerCase().includes(nameQuery.trim().toLowerCase()) ||
				project.description.toLowerCase().includes(nameQuery.trim().toLowerCase())
			: true;
		const matchesStatus = statusFilter === 'all' ? true : project.status === statusFilter;
		const matchesCourse =
			courseFilter === 'all' ? true : project.course && String(project.course.id) === courseFilter;
		return matchesName && matchesStatus && matchesCourse;
	});

	// 2) Sortering (nyeste først)
	$: sortedProjects = (() => {
		const sorted = [...filteredProjects].sort((a, b) => {
			const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
			const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
			return bTime - aTime; // newest first
		});

		return sorted.slice(0, maxProjects ?? filteredProjects.length);
	})();

	$: totalProjects = projects.length;

	// Håndter klik på rækken
	function handleRowClick(projectId: string | number) {
		goto(`/project/${projectId}`);
	}
</script>

<ListCard
	title="My Projects"
	totalCount={totalProjects}
	displayCount={sortedProjects.length}
	{showViewAll}
	viewAllUrl="/project"
>
	<div class="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
		<div class="pl-2 text-xs text-gray-500 sm:pl-4">
			Showing {sortedProjects.length} of {totalProjects} projects
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<input
				type="text"
				placeholder="Search project…"
				class="w-40 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				bind:value={nameQuery}
			/>

			<select
				bind:value={statusFilter}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				aria-label="Filter by status"
			>
				<option value="all">Status</option>
				{#each statusOptions as opt (opt.value)}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>

			<select
				bind:value={courseFilter}
				class="rounded-md border border-gray-300 bg-white px-2 py-1 pr-8 text-xs focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
				aria-label="Filter by course"
			>
				<option value="all">Courses</option>
				{#each courseOptions as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>

			<button
				type="button"
				on:click={clearFilters}
				class="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 sm:text-sm"
			>
				Clear
			</button>
		</div>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Project</th
					>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:table-cell sm:px-4 md:px-6 md:py-3"
						>Course</th
					>
					<th
						class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3"
						>Status</th
					>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 lg:table-cell"
						>Role</th
					>
					<th
						class="hidden px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase sm:px-4 md:px-6 md:py-3 lg:table-cell"
						>Created</th
					>
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-200 bg-white">
				{#if sortedProjects.length > 0}
					{#each sortedProjects as project (project.id)}
						<tr
							class="cursor-pointer transition hover:bg-gray-50 {getRowClass(project)}"
							on:click={() => handleRowClick(project.id)}
							tabindex="0"
							aria-label={'View project ' + project.name}
						>
							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<div class="font-semibold text-gray-900 sm:text-sm">
									{project.name}
								</div>
								<div class="mt-1 line-clamp-2 text-xs text-gray-600">
									{project.description}
								</div>
								<div class="mt-0.5 text-xs text-gray-500 sm:hidden">
									{project.course?.name ?? ''}
									{#if project.role}
										• {project.role}
									{/if}
								</div>
							</td>

							<td
								class="hidden px-2 py-2 text-xs text-gray-700 sm:table-cell sm:px-4 sm:text-sm md:px-6 md:py-4"
							>
								{project.course?.name ?? '-'}
							</td>

							<td class="px-2 py-2 text-xs sm:px-4 md:px-6 md:py-4">
								<span
									class="inline-flex rounded-full px-2 py-1 text-xs leading-5 font-semibold {getStatusClass(
										project
									)}"
								>
									{statusOptions.find((s) => s.value === project.status)?.label ?? project.status}
								</span>
							</td>

							<td
								class="hidden px-2 py-2 text-xs text-gray-700 capitalize sm:px-4 sm:text-sm md:px-6 md:py-4 lg:table-cell"
							>
								{project.role ?? '-'}
							</td>

							<td
								class="hidden px-2 py-2 text-xs text-gray-500 sm:px-4 sm:text-sm md:px-6 md:py-4 lg:table-cell"
							>
								{fmtDate(project.created_at)}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">
							No projects found.
							{#if nameQuery || statusFilter !== 'all' || courseFilter !== 'all'}
								Try adjusting your filters.
							{/if}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</ListCard>
