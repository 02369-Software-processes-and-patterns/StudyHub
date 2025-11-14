<script lang="ts">
	export let icon: string = '📚';
	export let title: string;
	export let description: string;
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow">
	<div class="mb-4 text-6xl">{icon}</div>
	<h2 class="mb-2 text-2xl font-bold text-gray-900">{title}</h2>
	<p class="text-gray-600">{description}</p>
</div>
