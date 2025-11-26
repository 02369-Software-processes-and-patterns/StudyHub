import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import {
    getTasksWithCourse,
    getCourseOptions,
    getAuthenticatedUser,
    createTask,
    updateTask,
    deleteTask,
    parseTaskUpdateForm,
    parseTaskCreateForm
} from '$lib/server/db';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
    try {
        const authResult = await getAuthenticatedUser(supabase);
        if (authResult.error) {
            return { tasks: [], courses: [] };
        }

        // Fetch tasks and courses in parallel
        const [tasksResult, coursesResult] = await Promise.all([
            getTasksWithCourse(supabase, authResult.userId, 'created_at'),
            getCourseOptions(supabase, authResult.userId)
        ]);

        if (tasksResult.error) console.error('Error loading tasks:', tasksResult.error);
        if (coursesResult.error) console.error('Error loading courses:', coursesResult.error);

        // Sort tasks by priority (1 = highest, 3 = lowest, null = no priority)
        const tasks = (tasksResult.data ?? []).sort((a, b) => {
            if (a.priority === null && b.priority === null) return 0;
            if (a.priority === null) return 1;
            if (b.priority === null) return -1;
            return a.priority - b.priority;
        });

        return {
            tasks,
            courses: coursesResult.data ?? []
        };
    } catch (err) {
        console.error('LOAD /taskpriority crashed:', err);
        return { tasks: [], courses: [] };
    }
};

export const actions: Actions = {
    create: async ({ request, locals: { supabase } }) => {
        try {
            const authResult = await getAuthenticatedUser(supabase);
            if (authResult.error) {
                return fail(authResult.error.status, { error: authResult.error.message });
            }

            const formData = await request.formData();
            const { data: taskData, error: parseError } = parseTaskCreateForm(formData);

            if (parseError || !taskData) {
                return fail(400, { error: parseError ?? 'Invalid form data' });
            }

            const { error } = await createTask(supabase, {
                ...taskData,
                user_id: authResult.userId
            });

            if (error) {
                console.error('Supabase insert error:', error);
                return fail(500, { error: error.message });
            }

            return { success: true };
        } catch (err) {
            console.error('CREATE action crashed:', err);
            return fail(500, { error: 'Internal error while creating task' });
        }
    },

    updateTask: async ({ request, locals: { supabase } }) => {
        try {
            const authResult = await getAuthenticatedUser(supabase);
            if (authResult.error) {
                return fail(authResult.error.status, { error: authResult.error.message });
            }

            const formData = await request.formData();
            const { taskId, updates, error: parseError } = parseTaskUpdateForm(formData);

            if (parseError || !taskId) {
                return fail(400, { error: parseError ?? 'Missing task_id' });
            }

            const { error } = await updateTask(supabase, taskId, authResult.userId, updates);

            if (error) {
                console.error('Supabase update error:', error);
                return fail(500, { error: error.message });
            }

            return { success: true, updated: Object.keys(updates) };
        } catch (err) {
            console.error('updateTask action crashed:', err);
            return fail(500, { error: 'Internal error while updating task' });
        }
    },

    deleteTask: async ({ request, locals: { supabase } }) => {
        try {
            const authResult = await getAuthenticatedUser(supabase);
            if (authResult.error) {
                return fail(authResult.error.status, { error: authResult.error.message });
            }

            const formData = await request.formData();
            const taskId = formData.get('task_id')?.toString();

            if (!taskId) {
                return fail(400, { error: 'Missing task_id' });
            }

            const { error } = await deleteTask(supabase, taskId, authResult.userId);

            if (error) {
                console.error('Supabase delete error:', error);
                return fail(500, { error: error.message });
            }

            return { success: true };
        } catch (err) {
            console.error('deleteTask action crashed:', err);
            return fail(500, { error: 'Internal error while deleting task' });
        }
    }
};