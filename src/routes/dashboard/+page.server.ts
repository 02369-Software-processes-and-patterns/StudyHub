import type { PageServerLoad } from './$types';
import { calculateWorkload } from '$lib/utils/workload';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();
    
    if (!session) {
        throw redirect(303, '/');
    }

    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, name, effort_hours, deadline, completed')
        .eq('user_id', session.user.id);

    const workload = calculateWorkload(tasks || []);

    return {
        workload,
        user: session.user
    };
};