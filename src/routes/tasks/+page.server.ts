import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();

    if (!session) {
        return { tasks: [], courses: [] };
    }

    // Fetch tasks with course names
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
            *,
            course:courses(id, name)
        `)
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

        const formData = await request.formData();
        
        const name = formData.get('name')?.toString();
        const effort_hours = formData.get('effort_hours')?.toString();
        const course_id = formData.get('course_id')?.toString();
        const deadline = formData.get('deadline')?.toString();

        // Validate required fields
        if (!name || !effort_hours || !deadline) {
            return { success: false, error: 'Missing required fields' };
        }

        const { error } = await supabase.from('tasks').insert({
            user_id: session.user.id,
            name: name,
            effort_hours: parseFloat(effort_hours),
            course_id: course_id || null,
            deadline: deadline,
            status: 'pending'
        });

        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    }
};