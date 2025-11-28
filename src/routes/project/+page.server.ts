import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import {
	getAuthenticatedUser,
	getCourseOptions,
	getProjectsWithRole,
	createProject,
	createInvitation // Vi bruger denne i stedet for addProjectMembers
} from '$lib/server/db';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	try {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return { projects: [], courses: [] };
		}

		// Fetch projects and courses in parallel
		const [projectsResult, coursesResult] = await Promise.all([
			getProjectsWithRole(supabase, authResult.userId),
			getCourseOptions(supabase, authResult.userId)
		]);

		if (projectsResult.error) console.error('Error loading projects:', projectsResult.error);
		if (coursesResult.error) console.error('Error loading courses:', coursesResult.error);

		return {
			projects: projectsResult.data ?? [],
			courses: coursesResult.data ?? []
		};
	} catch (err) {
		console.error('LOAD /project crashed:', err);
		return { projects: [], courses: [] };
	}
};

export const actions: Actions = {
	addProject: async ({ request, locals: { supabase } }) => {
		const authResult = await getAuthenticatedUser(supabase);
		if (authResult.error) {
			return fail(authResult.error.status, { error: authResult.error.message });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;
		const course_id = formData.get('course_id') as string;
		const status = formData.get('status') as string;
		const invitedMembersStr = formData.get('invitedMembers') as string;

		if (!name || !description) {
			return fail(400, { error: 'Name and description are required' });
		}

		let invitedMembers: Array<{ email: string; role: string }> = [];
		if (invitedMembersStr) {
			try {
				invitedMembers = JSON.parse(invitedMembersStr);
			} catch (e) {
				console.error('Error parsing invited members:', e);
			}
		}

		// Create the project with owner
		type ProjectStatusType = 'planning' | 'active' | 'completed' | 'on-hold';
		const validStatuses: ProjectStatusType[] = ['planning', 'active', 'on-hold', 'completed'];
		const projectStatus: ProjectStatusType = validStatuses.includes(status as ProjectStatusType)
			? (status as ProjectStatusType)
			: 'planning';

		const { data: newProject, error: projectError } = await createProject(
			supabase,
			authResult.userId,
			{
				name,
				description,
				course_id: course_id || null,
				status: projectStatus
			}
		);

		if (projectError || !newProject) {
			console.error('Error creating project:', projectError);
			return fail(500, { error: projectError?.message || 'Failed to create project' });
		}

		// Send invitationer til de valgte medlemmer
		if (invitedMembers.length > 0) {
			for (const member of invitedMembers) {
				const { error: inviteError } = await createInvitation(
					supabase,
					newProject.id,
					authResult.userId, // Dig (ejeren) er inviteren
					member.email,
					member.role
				);

				if (inviteError) {
					console.error(`Failed to invite ${member.email} during project creation:`, inviteError);
					// Continue even if invitation fails, since the project IS created
				}
			}
		}

		return { success: true };
	}
};
