<script lang="ts">
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
		<h1 class="mb-2 text-center text-2xl font-bold">Create Your Account</h1>
		<p class="mb-6 text-center text-gray-600">Join StudyHub today</p>

		{#if form?.error}
			<div class="mb-4 rounded bg-red-50 p-3 text-sm text-red-800">
				{form.error}
			</div>
		{/if}

		<form method="POST" action="?/signup" class="flex flex-col gap-4">
			<label class="flex flex-col gap-1 font-medium">
				Full name
				<input
					name="name"
					type="text"
					required
					class="rounded border border-gray-300 p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1 font-medium">
				Email
				<input
					name="email"
					type="email"
					required
					class="rounded border border-gray-300 p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1 font-medium">
				Password
				<input
					name="password"
					type="password"
					required
					minlength="6"
					class="rounded border border-gray-300 p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1 font-medium">
				Phone
				<input
					name="phone"
					type="tel"
					required
					class="rounded border border-gray-300 p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
				/>
			</label>

			<label class="flex flex-col gap-1 font-medium">
				Birthday
				<input
					name="birthday"
					type="date"
					required
					class="rounded border border-gray-300 p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
				/>
			</label>

			<button
				type="submit"
				class="rounded bg-indigo-600 p-3 font-medium text-white transition-colors hover:bg-indigo-700"
			>
				Sign Up
			</button>
		</form>

		<div class="mt-4 text-center text-sm text-gray-600">
			Already have an account?
			<a href="/" class="font-medium text-indigo-600 hover:text-indigo-800"> Sign in </a>
		</div>
	</div>
</div>
