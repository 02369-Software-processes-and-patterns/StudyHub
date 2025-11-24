import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

// 1. Henter data til siden (erstatter onMount)
export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();
    // Hvis brugeren ikke er logget ind, returner vi null, så UI kan håndtere det
    if (!session) return { project: null, userRole: null };

    const { uuid } = params;

    // Hent selve projektet
    const { data: project, error: projError } = await supabase
        .from('projects')
        .select(`
            *,
            course:courses(name)
        `)
        .eq('id', uuid)
        .single();

    if (projError) {
        console.error('Error loading project:', projError);
        return { project: null, userRole: null };
    }

    // Hent brugerens rolle i dette projekt (Owner, Admin, Member)
    const { data: memberData } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', uuid)
        .eq('user_id', session.user.id)
        .single();

    return {
        project,
        userRole: memberData?.role ?? null
    };
};

// 2. Håndterer formular-handlinger (actions)
export const actions: Actions = {
    inviteMembers: async ({ request, params, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession();
        if (!session) return fail(401, { error: 'Not authenticated' });

        const projectId = params.uuid;
        const formData = await request.formData();
        const invitedMembersStr = formData.get('invitedMembers') as string;

        if (!invitedMembersStr) {
            return fail(400, { error: 'No members selected' });
        }

        // Tjek om afsenderen faktisk er Owner eller Admin
        const { data: currentMember } = await supabase
            .from('project_members')
            .select('role')
            .eq('project_id', projectId)
            .eq('user_id', session.user.id)
            .single();

        if (!currentMember || !['Owner', 'Admin'].includes(currentMember.role)) {
            return fail(403, { error: 'Only Owners and Admins can invite members.' });
        }

        let invitedMembers: Array<{ email: string; role: string }> = [];
        try {
            invitedMembers = JSON.parse(invitedMembersStr);
        } catch (e) {
            return fail(400, { error: 'Invalid data format' });
        }

        // Find User IDs baseret på emails
        const emails = invitedMembers.map(m => m.email);
        const { data: userData, error: userError } = await supabase.rpc('get_user_ids_by_emails', {
            email_list: emails
        });

        if (userError) {
            console.error('RPC Error:', userError);
            return fail(500, { error: 'Error searching for users' });
        }

        if (!userData || userData.length === 0) {
            return fail(404, { error: 'No users found with these emails' });
        }

        // Klargør data til indsættelse
        const memberInserts = userData.map((user: any) => {
            const invitedMember = invitedMembers.find(m => m.email === user.email);
            return {
                project_id: projectId,
                user_id: user.id,
                role: invitedMember?.role || 'Member'
            };
        });

        // Indsæt i databasen
        const { error: insertError } = await supabase
            .from('project_members')
            .insert(memberInserts);

        if (insertError) {
            if (insertError.code === '23505') { // Unik nøgle fejl (allerede medlem)
                return fail(400, { error: 'One or more users are already in this project.' });
            }
            console.error('Insert Error:', insertError);
            return fail(500, { error: 'Failed to invite members.' });
        }

        return { success: true };
    }
};