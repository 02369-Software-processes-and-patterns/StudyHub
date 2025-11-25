<script lang="ts">
	import { goto } from '$app/navigation';

	export let title: string;
	export let totalCount: number | null = null;
	export let displayCount: number | null = null;
	export let showViewAll: boolean = true;
	export let viewAllUrl: string = '';
</script>

<div class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
	<div
		class="mb-4 flex flex-col gap-3 p-4 pb-0 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-6"
	>
		<h2 class="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">{title}</h2>
		{#if showViewAll && totalCount !== null && displayCount !== null && totalCount > displayCount}
			<button
				on:click={() => void goto(viewAllUrl)}
				class="inline-flex cursor-pointer items-center border-none bg-transparent text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:text-base"
			>
				View All ({totalCount})
				<svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		{/if}
	</div>
	<slot />
</div>
