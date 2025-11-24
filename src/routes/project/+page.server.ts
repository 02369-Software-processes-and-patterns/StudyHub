import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	try {
		const {
			data: { user },
			error: userErr
		} = await supabase.auth.getUser();
		
		if (userErr) {
			console.error('getUser error:', userErr);
			return { projects: [], courses: [] };
		}
		if (!user) return { projects: [], courses: [] };

		// Get user's courses for the dropdown
		const { data: courses, error: coursesError } = await supabase
			.from('courses')
			.select('id, name')
			.eq('user_id', user.id)
			.order('name');

		if (coursesError) {
			console.error('Error loading courses:', coursesError);
		}

		// Get all projects where the user is a member
		const { data: projectMembers, error: membersError } = await supabase
			.from('project_members')
			.select(
				`
				project_id,
				role,
				projects (
					id,
					name,
					description,
					status,
					created_at,
					course:courses(id, name)
				)
			`
			)
			.eq('user_id', user.id);

		if (membersError) {
			console.error('Error loading projects:', membersError);
			return { projects: [], courses: courses ?? [] };
		}

		// Transform the data to flatten the structure
		const projects = (projectMembers ?? []).map((member: any) => ({
			...member.projects,
			role: member.role
		}));

		return { projects, courses: courses ?? [] };
	} catch (err) {
		console.error('LOAD /project crashed:', err);
		return { projects: [], courses: [] };
	}
};

export const actions: Actions = {
	addProject: async ({ request, locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();

		if (!session) {
			return fail(401, { error: 'Not authenticated' });
		}

		console.log('Creating project with user:', session.user.id);

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

		console.log('Attempting to insert project:', { name, description, course_id, status });

		// Insert the project
		const { data: newProject, error: projectError } = await supabase
			.from('projects')
			.insert({
				name,
				description,
				course_id: course_id || null,
				status: status || 'planning'
			})
			.select()
			.single();

		if (projectError) {
			console.error('Error creating project:', projectError);
			console.error('Full error details:', JSON.stringify(projectError, null, 2));
			return fail(500, { error: projectError.message });
		}

		if (!newProject) {
			return fail(500, { error: 'Failed to create project' });
		}

		// Add the user as the owner in project_members
		const { error: memberError } = await supabase
			.from('project_members')
			.insert({
				project_id: newProject.id,
				user_id: session.user.id,
				role: 'Owner'
			});

		if (memberError) {
			console.error('Error adding user as project owner:', memberError);
			// Note: The project was created but the membership failed
			// You might want to delete the project here or handle this differently
			return fail(500, { error: 'Project created but failed to add you as owner' });
		}

		// Add invited members to project_members
		if (invitedMembers.length > 0) {
			// First, get user IDs from emails
			const emails = invitedMembers.map(m => m.email);
			
			// Query to get user IDs from emails
			const { data: userData, error: userError } = await supabase.rpc('get_user_ids_by_emails', {
				email_list: emails
			});

			if (userError) {
				console.error('Error fetching user IDs:', userError);
				// Continue anyway, project is created
			} else if (userData && userData.length > 0) {
				// Create member records
				const memberInserts = userData.map((user: any) => {
					const invitedMember = invitedMembers.find(m => m.email === user.email);
					return {
						project_id: newProject.id,
						user_id: user.id,
						role: invitedMember?.role || 'Member'
					};
				});

				const { error: membersInsertError } = await supabase
					.from('project_members')
					.insert(memberInserts);

				if (membersInsertError) {
					console.error('Error adding invited members:', membersInsertError);
					// Continue anyway, owner is added
				}
			}
		}

		return { success: true };
	}
};
