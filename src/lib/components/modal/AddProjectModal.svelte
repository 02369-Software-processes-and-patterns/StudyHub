<script lang="ts">
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	const dispatch = createEventDispatcher();

	export let showModal = false;
	export let courses: Array<{ id: string; name: string }> = [];

	let name = '';
	let description = '';
	let course_id = '';
	let status = 'planning';
	let loading = false;
	let error = '';
	let memberEmail = '';
	let invitedMembers: Array<{ email: string; role: string; name?: string }> = [];
	let showMemberDropdown = false;
	let searchResults: Array<{ id: string; email: string; name?: string }> = [];
	let searchLoading = false;

	const statusOptions = [
		{ label: 'Planning', value: 'planning' },
		{ label: 'In Progress', value: 'in_progress' },
		{ label: 'Completed', value: 'completed' },
		{ label: 'On Hold', value: 'on hold' }
	];

	const memberRoles = [
		{ label: 'Member', value: 'Member' },
		{ label: 'Viewer', value: 'Viewer' },
		{ label: 'Admin', value: 'Admin' }
	];

	let searchTimeout: number;

	async function searchUsers(query: string) {
		if (query.length < 2) {
			searchResults = [];
			showMemberDropdown = false;
			return;
		}

		searchLoading = true;
		try {
			const response = await fetch(`/api/search-users?query=${encodeURIComponent(query)}`);
			if (response.ok) {
				const data: { users?: Array<{ id: string; email: string; name?: string }> } =
					await response.json();
				// Filter out already invited members
				const invitedEmails = invitedMembers.map((m) => m.email);
				searchResults = (data.users || []).filter((user) => !invitedEmails.includes(user.email));
				showMemberDropdown = searchResults.length > 0;
			} else {
				searchResults = [];
				showMemberDropdown = false;
			}
		} catch (err) {
			console.error('Error searching users:', err);
			searchResults = [];
			showMemberDropdown = false;
		} finally {
			searchLoading = false;
		}
	}

	function handleEmailInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			searchUsers(memberEmail);
		}, 300) as unknown as number;
	}

	function addMember(email: string, name?: string) {
		if (!invitedMembers.find((m) => m.email === email)) {
			invitedMembers = [...invitedMembers, { email, role: 'Member', name }];
		}
		memberEmail = '';
		searchResults = [];
		showMemberDropdown = false;
	}

	function removeMember(email: string) {
		invitedMembers = invitedMembers.filter((m) => m.email !== email);
	}

	function updateMemberRole(email: string, role: string) {
		invitedMembers = invitedMembers.map((m) => (m.email === email ? { ...m, role } : m));
	}

	function closeModal() {
		showModal = false;
		name = '';
		description = '';
		course_id = '';
		status = 'planning';
		memberEmail = '';
		invitedMembers = [];
		searchResults = [];
		showMemberDropdown = false;
		error = '';
	}
</script>

<Modal bind:isOpen={showModal} title="Create New Project" on:close={closeModal}>
	{#if error}
		<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
			Error: {error}
		</div>
	{/if}

	<form
		method="POST"
		action="?/addProject"
		use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				if (result.type === 'success') {
					closeModal();
					dispatch('projectAdded');
				} else if (result.type === 'failure') {
					type FailureData = { error?: string };
					error = (result.data as FailureData | undefined)?.error || 'An error occurred';
				}
				loading = false;
				await update();
			};
		}}
		class="space-y-4"
	>
		<input type="hidden" name="invitedMembers" value={JSON.stringify(invitedMembers)} />
		<label class="block">
			<span class="font-medium text-gray-700">Project Name *</span>
			<input
				type="text"
				name="name"
				bind:value={name}
				required
				disabled={loading}
				placeholder="Enter project name"
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
			/>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Description *</span>
			<textarea
				name="description"
				bind:value={description}
				required
				disabled={loading}
				rows="3"
				placeholder="Describe your project..."
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
			></textarea>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Related Course (Optional)</span>
			<select
				name="course_id"
				bind:value={course_id}
				disabled={loading}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
			>
				<option value="">No course selected</option>
				{#each courses as course (course.id)}
					<option value={course.id}>
						{course.name}
					</option>
				{/each}
			</select>
		</label>

		<label class="block">
			<span class="font-medium text-gray-700">Status</span>
			<select
				name="status"
				bind:value={status}
				disabled={loading}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
			>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>
						{option.label}
					</option>
				{/each}
			</select>
		</label>

		<div class="space-y-3">
			<label class="block">
				<span class="font-medium text-gray-700">Invite Members (Optional)</span>
				<div class="relative mt-1">
					<input
						type="text"
						bind:value={memberEmail}
						on:input={handleEmailInput}
						on:focus={() => {
							if (searchResults.length > 0) showMemberDropdown = true;
						}}
						disabled={loading}
						placeholder="Type name or email to search..."
						class="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
					/>
					{#if searchLoading}
						<div class="absolute top-2.5 right-3">
							<svg
								class="h-5 w-5 animate-spin text-gray-400"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						</div>
					{/if}
					{#if showMemberDropdown && searchResults.length > 0}
						<div
							class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
						>
							{#each searchResults as user (user.id)}
								<button
									type="button"
									on:click={() => addMember(user.email, user.name)}
									class="w-full px-4 py-2 text-left transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
								>
									<div class="font-medium text-gray-900">{user.name || user.email}</div>
									{#if user.name}
										<div class="text-sm text-gray-500">{user.email}</div>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</label>

			{#if invitedMembers.length > 0}
				<div class="space-y-2">
					<p class="text-sm text-gray-600">Invited Members ({invitedMembers.length})</p>
					<div class="max-h-48 space-y-2 overflow-y-auto pr-1">
						{#each invitedMembers as member (member.email)}
							<div class="flex items-center gap-2 rounded-md bg-gray-50 p-2">
								<div class="flex-1">
									<div class="text-sm font-medium text-gray-900">{member.name || member.email}</div>
									{#if member.name}
										<div class="text-xs text-gray-500">{member.email}</div>
									{/if}
								</div>
								<select
									value={member.role}
									on:change={(e) => updateMemberRole(member.email, e.currentTarget.value)}
									disabled={loading}
									class="appearance-none rounded border-gray-300 bg-white px-2 py-1 text-center text-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
									style="background-image: none;"
								>
									{#each memberRoles as role (role.value)}
										<option value={role.value}>{role.label}</option>
									{/each}
								</select>
								<button
									type="button"
									on:click={() => removeMember(member.email)}
									disabled={loading}
									class="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
									title="Remove member"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										></path>
									</svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
		<div class="flex gap-3 border-t border-gray-200 pt-4">
			<button
				type="button"
				on:click={closeModal}
				disabled={loading}
				class="flex-1 rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={loading}
				class="flex-1 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Create Project'}
			</button>
		</div>
	</form>
</Modal>
