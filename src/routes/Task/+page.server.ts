import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (!session) {
        return { tasks: [], courses: [] };
    }

    // Fetch tasks
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    // Fetch courses
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, name')
        .eq('user_id', session.user.id)
        .order('name');

    if (tasksError) console.error('Error loading tasks:', tasksError);
    if (coursesError) console.error('Error loading courses:', coursesError);

    return {
        tasks: tasks ?? [],
        courses: courses ?? []
    };
};

export const actions: Actions = {
    default: async ({ request, locals: { supabase, safeGetSession } }) => {
        const { session } = await safeGetSession();

        if (!session) {
            return { success: false, error: 'Not authenticated' };
        }

        const formData = await request.json();

        const { error } = await supabase.from('tasks').insert({
            user_id: session.user.id,
            name: formData.name,
            effort_hours: formData.effort_hours,
            course_id: formData.course_id,
            deadline: formData.deadline,
            status: 'pending'
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }
};