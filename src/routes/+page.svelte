<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
		<h1 class="mb-2 text-center text-2xl font-bold">Welcome to StudyHub</h1>
		<p class="mb-6 text-center text-gray-600">Sign in to continue</p>

		{#if form?.error}
			<div class="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">
				{form.error}
			</div>
		{/if}

		<form method="POST" action="?/login" class="flex flex-col gap-4">
			<label class="flex flex-col gap-1 font-medium">
				Email
				<input
					name="email"
					type="email"
					required
					class="rounded border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
				/>
			</label>
			<label class="flex flex-col gap-1 font-medium">
				Password
				<input
					name="password"
					type="password"
					required
					class="rounded border border-gray-300 p-2 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="rounded bg-green-600 p-3 font-medium text-white transition-colors hover:bg-green-700"
			>
				Login
			</button>
		</form>

		<a
			href="/signup"
			class="mt-4 block rounded bg-gray-100 p-3 text-center font-medium text-gray-800 transition-colors hover:bg-gray-200"
		>
			Sign up
		</a>
	</div>
</div>
