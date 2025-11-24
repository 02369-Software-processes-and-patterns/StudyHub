<script lang="ts">
	import { enhance } from '$app/forms';
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	const dispatch = createEventDispatcher();

	export let isOpen = false;
	
	let memberEmail = '';
	let invitedMembers: Array<{ email: string; role: string; name?: string }> = [];
	let searchResults: Array<{ id: string; email: string; name?: string }> = [];
	let showMemberDropdown = false;
	let searchLoading = false;
	let loading = false;
	let error = '';
    let successMessage = '';
    let hasInvited = false; //  variabel til at spore om invitationen lykkedes
	let searchTimeout: number;

	const memberRoles = [
		{ label: 'Member', value: 'Member' },
		{ label: 'Viewer', value: 'Viewer' },
        { label: 'Admin', value: 'Admin' }
	];

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
				const data = await response.json();
				searchResults = (data.users || []).filter((user: any) => !invitedMembers.find(m => m.email === user.email));
				showMemberDropdown = searchResults.length > 0;
			}
		} catch (err) {
			console.error(err);
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
		if (!invitedMembers.find(m => m.email === email)) {
			invitedMembers = [...invitedMembers, { email, role: 'Member', name }];
		}
		memberEmail = '';
		searchResults = [];
		showMemberDropdown = false;
	}

	function removeMember(email: string) {
		invitedMembers = invitedMembers.filter(m => m.email !== email);
	}

    // Denne funktion kører, når du trykker på krydset (eller "Close" knappen)
	function closeModal() {
        if (hasInvited) {
            dispatch('invited');
        }

		isOpen = false;
		invitedMembers = [];
		error = '';
        successMessage = '';
        hasInvited = false; // Nulstil status
        dispatch('close');
	}

    const handleSubmit = () => {
        loading = true;
        error = '';
        successMessage = '';
        
        return async ({ result, update }: { result: any, update: () => Promise<void> }) => {
            loading = false;
            if (result.type === 'success') {
                successMessage = 'Invitation(s) sent successfully!';
                hasInvited = true; // Opdater status til at indikere succesfuld invitation
            } else if (result.type === 'failure') {
                error = result.data?.error || 'An error occurred';
            }
            await update();
        };
    };
</script>

<Modal bind:isOpen title="Invite Others" on:close={closeModal}>
    {#if error}
		<div class="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
			{error}
		</div>
	{/if}

    {#if successMessage}
        <div class="flex flex-col items-center justify-center py-6 text-center space-y-4">
            <div class="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900">Invitations Sent!</h3>
            <p class="text-sm text-gray-500 max-w-xs">Your team members have been invited successfully.</p>
            
            <button 
                on:click={closeModal}
                class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
                Close
            </button>
        </div>
    {/if}

    {#if !successMessage}
	<form 
		method="POST" 
		action="?/inviteMembers"
		use:enhance={handleSubmit}
		class="space-y-4"
	>
		<input type="hidden" name="invitedMembers" value={JSON.stringify(invitedMembers)} />

		<div class="space-y-3">
			<label class="block">
				<span class="text-gray-700 font-medium">Search Students</span>
				<div class="relative mt-1">
					<input 
						type="text" 
						bind:value={memberEmail}
						on:input={handleEmailInput}
						disabled={loading}
						placeholder="Type name or email..."
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"
					/>
					{#if searchLoading}
                        <div class="absolute right-3 top-2.5 text-gray-400">
                            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    {/if}
					{#if showMemberDropdown && searchResults.length > 0}
						<div class="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-48 overflow-auto">
						{#each searchResults as user}
							<button
								type="button"
								on:click={() => addMember(user.email, user.name)}
								class="w-full px-4 py-2 text-left hover:bg-gray-50 transition"
							>
								<div class="font-medium text-gray-900">{user.name || user.email}</div>
								{#if user.name}<div class="text-sm text-gray-500">{user.email}</div>{/if}
							</button>
						{/each}
						</div>
					{/if}
				</div>
			</label>

            {#if invitedMembers.length > 0}
                <div class="space-y-2 bg-gray-50 p-3 rounded-md">
                    {#each invitedMembers as member}
                        <div class="flex items-center gap-2 justify-between">
                            <div class="text-sm">
                                <div class="font-medium">{member.name || member.email}</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <select
                                    bind:value={member.role}
                                    class="text-xs rounded border-gray-300 py-1 px-2"
                                >
                                    {#each memberRoles as role}
                                        <option value={role.value}>{role.label}</option>
                                    {/each}
                                </select>
                                <button type="button" on:click={() => removeMember(member.email)} class="text-red-500 hover:text-red-700">
                                    &times;
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
		</div>

		<div class="flex gap-3 pt-4 border-t border-gray-200">
			<button type="button" on:click={closeModal} class="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
				Cancel
			</button>
			<button 
				type="submit" 
				disabled={loading || invitedMembers.length === 0}
				class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
			>
				{loading ? 'Sending...' : 'Send Invitations'}
			</button>
		</div>
	</form>
    {/if}
</Modal>