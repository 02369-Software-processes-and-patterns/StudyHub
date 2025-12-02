/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for project creation and invitation workflow
 * Tests the complete flow from project creation to user invitation and acceptance
 */

interface ProjectData {
	id: string;
	name: string;
	description: string;
	status: 'planning' | 'active' | 'completed' | 'on-hold';
	course_id: string | null;
	created_at: string;
}

interface ProjectMemberData {
	id: string;
	project_id: string;
	user_id: string;
	role: 'Owner' | 'Admin' | 'Member';
	created_at: string;
}

interface InvitationData {
	id: string;
	project_id: string;
	invitor_user_id: string;
	invited_user_id: string;
	status: 'pending' | 'accepted' | 'declined';
	role: string;
	created_at: string;
}

interface UserData {
	id: string;
	email: string;
	name: string;
}

// Mock Supabase client for integration testing
function createMockSupabaseClient() {
	const mockProjects: ProjectData[] = [];
	const mockProjectMembers: ProjectMemberData[] = [];
	const mockInvitations: InvitationData[] = [];
	const mockUsers: UserData[] = [
		{ id: 'user-1', email: 'owner@test.com', name: 'Owner User' },
		{ id: 'user-2', email: 'member@test.com', name: 'Member User' },
		{ id: 'user-3', email: 'admin@test.com', name: 'Admin User' }
	];

	let shouldFailAuth = false;
	let shouldFailProjectCreation = false;
	let shouldFailInvitation = false;
	let mockUser = { id: 'user-1' };

	return {
		auth: {
			getUser: vi.fn().mockImplementation(() => {
				if (shouldFailAuth) {
					return Promise.resolve({
						data: { user: null },
						error: new Error('Authentication failed')
					});
				}
				return Promise.resolve({
					data: { user: mockUser },
					error: null
				});
			})
		},
		from: vi.fn().mockImplementation((table: string) => ({
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockImplementation((data: unknown) => {
				if (table === 'project_members') {
					const memberData = data as ProjectMemberData;
					mockProjectMembers.push({
						...memberData,
						id: `member-${Date.now()}-${Math.random()}`,
						created_at: new Date().toISOString()
					});
					return Promise.resolve({ data: memberData, error: null });
				}
				if (table === 'project_invitations') {
					if (shouldFailInvitation) {
						return Promise.resolve({
							data: null,
							error: new Error('Failed to create invitation')
						});
					}
					const invitationData = data as InvitationData;
					const newInvitation = {
						...invitationData,
						id: `invitation-${Date.now()}-${Math.random()}`,
						created_at: new Date().toISOString()
					};
					mockInvitations.push(newInvitation);
					return Promise.resolve({ data: newInvitation, error: null });
				}
				return Promise.resolve({ data: null, error: null });
			}),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockImplementation((column: string, value: unknown) => {
				const chainable = {
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockImplementation(async () => {
						if (table === 'project_members') {
							const member = mockProjectMembers.find(
								(m) => m.project_id === value || m.user_id === value
							);
							return { data: member || null, error: member ? null : new Error('Not found') };
						}
						if (table === 'project_invitations') {
							const invitation = mockInvitations.find((i) => i.id === value);
							return {
								data: invitation || null,
								error: invitation ? null : new Error('Not found')
							};
						}
						return { data: null, error: new Error('Not found') };
					}),
					then: vi.fn().mockImplementation(async (callback: (result: unknown) => void) => {
						if (table === 'project_invitations') {
							// For delete operations
							const filteredInvitations = mockInvitations.filter((i) => {
								// Simple mock - just keep all for now
								return true;
							});
							callback({ data: null, error: null });
						}
						return callback({ data: null, error: null });
					})
				};
				return chainable;
			}),
			order: vi.fn().mockReturnThis(),
			single: vi.fn().mockImplementation(async () => {
				if (table === 'project_members') {
					const member = mockProjectMembers[0];
					return { data: member || null, error: member ? null : new Error('Not found') };
				}
				return { data: null, error: new Error('Not found') };
			})
		})),
		rpc: vi.fn().mockImplementation(async (functionName: string, params?: unknown) => {
			if (functionName === 'create_project_with_owner') {
				if (shouldFailProjectCreation) {
					return { data: null, error: new Error('Failed to create project') };
				}

				const p = params as {
					p_name: string;
					p_description: string;
					p_course_id: string | null;
					p_status: string;
				};

				const newProject: ProjectData = {
					id: `project-${Date.now()}-${Math.random()}`,
					name: p.p_name,
					description: p.p_description,
					status: p.p_status as ProjectData['status'],
					course_id: p.p_course_id,
					created_at: new Date().toISOString()
				};

				mockProjects.push(newProject);

				// Automatically add creator as owner
				mockProjectMembers.push({
					id: `member-${Date.now()}-${Math.random()}`,
					project_id: newProject.id,
					user_id: mockUser.id,
					role: 'Owner',
					created_at: new Date().toISOString()
				});

				return { data: newProject, error: null };
			}

			if (functionName === 'get_user_ids_by_emails') {
				const p = params as { email_list: string[] };
				const users = mockUsers.filter((u) => p.email_list.includes(u.email));
				return { data: users, error: null };
			}

			if (functionName === 'get_inviter_details') {
				const p = params as { inviter_ids: string[] };
				const users = mockUsers.filter((u) => p.inviter_ids.includes(u.id));
				return { data: users, error: null };
			}

			return { data: null, error: new Error('Unknown RPC function') };
		}),
		// Test utilities
		_setAuthFailure: (fail: boolean) => {
			shouldFailAuth = fail;
		},
		_setProjectCreationFailure: (fail: boolean) => {
			shouldFailProjectCreation = fail;
		},
		_setInvitationFailure: (fail: boolean) => {
			shouldFailInvitation = fail;
		},
		_setMockUser: (user: { id: string }) => {
			mockUser = user;
		},
		_getProjects: () => [...mockProjects],
		_getProjectMembers: () => [...mockProjectMembers],
		_getInvitations: () => [...mockInvitations],
		_clearAll: () => {
			mockProjects.length = 0;
			mockProjectMembers.length = 0;
			mockInvitations.length = 0;
		}
	};
}

// Simulate the create project action logic
async function createProjectAction(
	formData: FormData,
	supabase: ReturnType<typeof createMockSupabaseClient>
) {
	try {
		const {
			data: { user },
			error: userErr
		} = await supabase.auth.getUser();

		if (userErr) return { success: false, error: userErr.message };
		if (!user) return { success: false, error: 'Not authenticated' };

		const name = formData.get('name')?.toString()?.trim();
		const description = formData.get('description')?.toString()?.trim();
		const course_id = formData.get('course_id')?.toString() || null;
		const status = formData.get('status')?.toString() || 'planning';
		const invitedMembersStr = formData.get('invitedMembers')?.toString();

		if (!name) return { success: false, error: 'Name is required' };
		if (!description) return { success: false, error: 'Description is required' };

		let invitedMembers: Array<{ email: string; role: string }> = [];
		if (invitedMembersStr) {
			try {
				invitedMembers = JSON.parse(invitedMembersStr);
			} catch {
				return { success: false, error: 'Invalid invited members format' };
			}
		}

		// Create project
		const { data: newProject, error: projectError } = await supabase.rpc(
			'create_project_with_owner',
			{
				p_name: name,
				p_description: description,
				p_course_id: course_id,
				p_status: status
			}
		);

		if (projectError || !newProject) {
			return { success: false, error: projectError?.message || 'Failed to create project' };
		}

		// Send invitations
		if (invitedMembers.length > 0) {
			for (const member of invitedMembers) {
				// Get user ID from email
				const { data: userData, error: userError } = await supabase.rpc(
					'get_user_ids_by_emails',
					{
						email_list: [member.email]
					}
				);

				if (userError || !userData || userData.length === 0) {
					console.error(`User not found: ${member.email}`);
					continue;
				}

				const invitedUserId = userData[0].id;

				// Check if already a member
				const existingMembers = supabase
					._getProjectMembers()
					.filter((m) => m.project_id === newProject.id && m.user_id === invitedUserId);

				if (existingMembers.length > 0) {
					console.error(`User already a member: ${member.email}`);
					continue;
				}

				// Create invitation
				const { error: inviteError } = await supabase.from('project_invitations').insert({
					project_id: newProject.id,
					invitor_user_id: user.id,
					invited_user_id: invitedUserId,
					status: 'pending',
					role: member.role
				});

				if (inviteError) {
					console.error(`Failed to invite ${member.email}:`, inviteError);
				}
			}
		}

		return { success: true, projectId: newProject.id };
	} catch (error) {
		return { success: false, error: 'Internal error while creating project' };
	}
}

// Simulate getting user invitations
async function getMyInvitationsAction(
	supabase: ReturnType<typeof createMockSupabaseClient>,
	userId: string
) {
	try {
		const invitations = supabase._getInvitations().filter((i) => i.invited_user_id === userId);

		// Get inviter details
		const inviterIds = [...new Set(invitations.map((i) => i.invitor_user_id))];
		const { data: invitersData } = await supabase.rpc('get_inviter_details', {
			inviter_ids: inviterIds
		});

		const invitersMap: Record<string, { name: string; email: string }> = {};
		if (invitersData) {
			invitersData.forEach((u: { id: string; name: string; email: string }) => {
				invitersMap[u.id] = { name: u.name, email: u.email };
			});
		}

		const invitationsWithDetails = invitations.map((invite) => ({
			id: invite.id,
			project_id: invite.project_id,
			role: invite.role,
			created_at: invite.created_at,
			inviter: invitersMap[invite.invitor_user_id] || { name: 'Unknown', email: 'unknown' }
		}));

		return { success: true, data: invitationsWithDetails };
	} catch (error) {
		return { success: false, error: 'Failed to fetch invitations' };
	}
}

// Simulate accepting an invitation
async function acceptInvitationAction(
	supabase: ReturnType<typeof createMockSupabaseClient>,
	invitationId: string,
	userId: string
) {
	try {
		// Find the invitation manually since our mock doesn't support complex queries
		const allInvitations = supabase._getInvitations();
		const invite = allInvitations.find(
			(i) => i.id === invitationId && i.invited_user_id === userId
		);

		if (!invite) {
			return { success: false, error: 'Invitation not found' };
		}

		// Add to project_members
		const { error: insertError } = await supabase.from('project_members').insert({
			project_id: invite.project_id,
			user_id: userId,
			role: invite.role
		});

		if (insertError) {
			return { success: false, error: insertError.message };
		}

		// Delete invitation (simplified mock version)
		const invitationIndex = allInvitations.findIndex((i) => i.id === invitationId);
		if (invitationIndex !== -1) {
			allInvitations.splice(invitationIndex, 1);
		}

		return { success: true };
	} catch (error) {
		return { success: false, error: 'Internal error while accepting invitation' };
	}
}

describe('Project Creation and Invitation - Integration Tests', () => {
	let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

	beforeEach(() => {
		mockSupabase = createMockSupabaseClient();
		mockSupabase._clearAll();
	});

	describe('AT 3: Project Creation', () => {
		it('should create a new project with owner role', async () => {
			const formData = new FormData();
			formData.append('name', 'Test Project');
			formData.append('description', 'A test project description');
			formData.append('status', 'planning');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);
			expect(result.projectId).toBeDefined();

			const projects = mockSupabase._getProjects();
			expect(projects).toHaveLength(1);
			expect(projects[0].name).toBe('Test Project');
			expect(projects[0].description).toBe('A test project description');
			expect(projects[0].status).toBe('planning');

			// Verify owner was added automatically
			const members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(1);
			expect(members[0].role).toBe('Owner');
			expect(members[0].user_id).toBe('user-1');
		});

		it('should create project with course association', async () => {
			const formData = new FormData();
			formData.append('name', 'Course Project');
			formData.append('description', 'Project linked to a course');
			formData.append('course_id', 'course-123');
			formData.append('status', 'active');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const projects = mockSupabase._getProjects();
			expect(projects[0].course_id).toBe('course-123');
			expect(projects[0].status).toBe('active');
		});

		it('should reject project creation without name', async () => {
			const formData = new FormData();
			formData.append('description', 'No name provided');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Name is required');
			expect(mockSupabase._getProjects()).toHaveLength(0);
		});

		it('should reject project creation without description', async () => {
			const formData = new FormData();
			formData.append('name', 'Project Name');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Description is required');
			expect(mockSupabase._getProjects()).toHaveLength(0);
		});

		it('should handle project creation failure', async () => {
			mockSupabase._setProjectCreationFailure(true);

			const formData = new FormData();
			formData.append('name', 'Test Project');
			formData.append('description', 'Description');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Failed to create project');
		});

		it('should reject unauthenticated project creation', async () => {
			mockSupabase._setAuthFailure(true);

			const formData = new FormData();
			formData.append('name', 'Test Project');
			formData.append('description', 'Description');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Authentication failed');
		});
	});

	describe('AT 3: User Invitation', () => {
		it('should create project and invite a registered user', async () => {
			const formData = new FormData();
			formData.append('name', 'Collaborative Project');
			formData.append('description', 'A project with team members');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			// Verify project was created
			const projects = mockSupabase._getProjects();
			expect(projects).toHaveLength(1);

			// Verify invitation was sent
			const invitations = mockSupabase._getInvitations();
			expect(invitations).toHaveLength(1);
			expect(invitations[0].invited_user_id).toBe('user-2'); // member@test.com
			expect(invitations[0].role).toBe('Member');
			expect(invitations[0].status).toBe('pending');
		});

		it('should invite multiple users to a project', async () => {
			const formData = new FormData();
			formData.append('name', 'Team Project');
			formData.append('description', 'Project with multiple members');
			formData.append(
				'invitedMembers',
				JSON.stringify([
					{ email: 'member@test.com', role: 'Member' },
					{ email: 'admin@test.com', role: 'Admin' }
				])
			);

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const invitations = mockSupabase._getInvitations();
			expect(invitations).toHaveLength(2);

			// Verify different roles
			const memberInvite = invitations.find((i) => i.invited_user_id === 'user-2');
			const adminInvite = invitations.find((i) => i.invited_user_id === 'user-3');

			expect(memberInvite?.role).toBe('Member');
			expect(adminInvite?.role).toBe('Admin');
		});

		it('should continue project creation even if invitation fails', async () => {
			mockSupabase._setInvitationFailure(true);

			const formData = new FormData();
			formData.append('name', 'Project with Failed Invite');
			formData.append('description', 'Description');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			const result = await createProjectAction(formData, mockSupabase);

			// Project should still be created successfully
			expect(result.success).toBe(true);

			const projects = mockSupabase._getProjects();
			expect(projects).toHaveLength(1);
		});

		it('should handle invalid email in invitation gracefully', async () => {
			const formData = new FormData();
			formData.append('name', 'Project');
			formData.append('description', 'Description');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'nonexistent@test.com', role: 'Member' }])
			);

			const result = await createProjectAction(formData, mockSupabase);

			// Project creation should succeed
			expect(result.success).toBe(true);

			// But no invitation should be created
			const invitations = mockSupabase._getInvitations();
			expect(invitations).toHaveLength(0);
		});

		it('should handle invalid JSON in invitedMembers', async () => {
			const formData = new FormData();
			formData.append('name', 'Project');
			formData.append('description', 'Description');
			formData.append('invitedMembers', 'invalid json');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(false);
			expect(result.error).toBe('Invalid invited members format');
		});
	});

	describe('AT 3: Invitation Notification and Acceptance', () => {
		it('should show invitation in invited user\'s notification list', async () => {
			// Create project with invitation
			const formData = new FormData();
			formData.append('name', 'Invitation Test Project');
			formData.append('description', 'Testing invitation flow');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			const createResult = await createProjectAction(formData, mockSupabase);
			expect(createResult.success).toBe(true);

			// Check invited user's invitations
			const invitationsResult = await getMyInvitationsAction(mockSupabase, 'user-2');

			expect(invitationsResult.success).toBe(true);
			expect(invitationsResult.data).toHaveLength(1);
			expect(invitationsResult.data![0].role).toBe('Member');
			expect(invitationsResult.data![0].inviter.email).toBe('owner@test.com');
		});

		it('should add user to project members when invitation is accepted', async () => {
			// Create project with invitation
			const formData = new FormData();
			formData.append('name', 'Accept Test Project');
			formData.append('description', 'Testing acceptance');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			await createProjectAction(formData, mockSupabase);

			const invitations = mockSupabase._getInvitations();
			const invitationId = invitations[0].id;

			// Accept the invitation
			const acceptResult = await acceptInvitationAction(mockSupabase, invitationId, 'user-2');

			expect(acceptResult.success).toBe(true);

			// Verify user was added to project members
			const members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(2); // Owner + new member

			const newMember = members.find((m) => m.user_id === 'user-2');
			expect(newMember).toBeDefined();
			expect(newMember?.role).toBe('Member');
		});

		it('should not accept invitation for wrong user', async () => {
			// Create invitation for user-2
			const formData = new FormData();
			formData.append('name', 'Project');
			formData.append('description', 'Description');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			await createProjectAction(formData, mockSupabase);

			const invitations = mockSupabase._getInvitations();
			const invitationId = invitations[0].id;

			// Try to accept as wrong user (user-3)
			const acceptResult = await acceptInvitationAction(mockSupabase, invitationId, 'user-3');

			expect(acceptResult.success).toBe(false);
			expect(acceptResult.error).toBe('Invitation not found');

			// Verify user was NOT added
			const members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(1); // Only owner
		});
	});

	describe('AT 3: Complete Workflow', () => {
		it('should complete full workflow: create, invite, notify, accept', async () => {
			// Step 1: User 1 creates a project
			mockSupabase._setMockUser({ id: 'user-1' });

			const formData = new FormData();
			formData.append('name', 'Full Workflow Project');
			formData.append('description', 'Testing complete workflow');
			formData.append('status', 'planning');
			formData.append(
				'invitedMembers',
				JSON.stringify([
					{ email: 'member@test.com', role: 'Member' },
					{ email: 'admin@test.com', role: 'Admin' }
				])
			);

			const createResult = await createProjectAction(formData, mockSupabase);

			// Verify project creation
			expect(createResult.success).toBe(true);
			expect(createResult.projectId).toBeDefined();

			const projects = mockSupabase._getProjects();
			expect(projects).toHaveLength(1);
			expect(projects[0].name).toBe('Full Workflow Project');

			// Verify owner is in project
			let members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(1);
			expect(members[0].role).toBe('Owner');
			expect(members[0].user_id).toBe('user-1');

			// Step 2: Verify invitations were sent
			const invitations = mockSupabase._getInvitations();
			expect(invitations).toHaveLength(2);

			// Step 3: User 2 checks notifications
			const user2Invitations = await getMyInvitationsAction(mockSupabase, 'user-2');
			expect(user2Invitations.success).toBe(true);
			expect(user2Invitations.data).toHaveLength(1);
			expect(user2Invitations.data![0].inviter.name).toBe('Owner User');

			// Step 4: User 2 accepts invitation
			const memberInvitation = invitations.find((i) => i.invited_user_id === 'user-2');
			const acceptResult = await acceptInvitationAction(
				mockSupabase,
				memberInvitation!.id,
				'user-2'
			);

			expect(acceptResult.success).toBe(true);

			// Step 5: Verify User 2 is now a project member
			members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(2);

			const user2Member = members.find((m) => m.user_id === 'user-2');
			expect(user2Member).toBeDefined();
			expect(user2Member?.role).toBe('Member');

			// Step 6: User 3 also accepts their invitation
			const adminInvitation = invitations.find((i) => i.invited_user_id === 'user-3');
			const acceptResult2 = await acceptInvitationAction(
				mockSupabase,
				adminInvitation!.id,
				'user-3'
			);

			expect(acceptResult2.success).toBe(true);

			// Step 7: Verify all members are in the project
			members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(3);

			const roles = members.map((m) => m.role).sort();
			expect(roles).toEqual(['Admin', 'Member', 'Owner']);

			// Verify project is visible to all members
			const projectId = createResult.projectId!;
			const allProjectMembers = members.filter((m) => m.project_id === projectId);
			expect(allProjectMembers).toHaveLength(3);
		});

		it('should maintain project visibility after member joins', async () => {
			// Create project
			const formData = new FormData();
			formData.append('name', 'Visibility Test');
			formData.append('description', 'Testing project visibility');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			const createResult = await createProjectAction(formData, mockSupabase);
			const projectId = createResult.projectId!;

			// Accept invitation
			const invitations = mockSupabase._getInvitations();
			await acceptInvitationAction(mockSupabase, invitations[0].id, 'user-2');

			// Verify project is in both users' project lists
			const members = mockSupabase._getProjectMembers();
			const projectMembers = members.filter((m) => m.project_id === projectId);

			expect(projectMembers).toHaveLength(2);
			expect(projectMembers.map((m) => m.user_id)).toContain('user-1'); // Owner
			expect(projectMembers.map((m) => m.user_id)).toContain('user-2'); // Member
		});
	});

	describe('Data Integrity', () => {
		it('should maintain referential integrity between projects and members', async () => {
			const formData = new FormData();
			formData.append('name', 'Integrity Test');
			formData.append('description', 'Testing data integrity');

			const result = await createProjectAction(formData, mockSupabase);

			const projects = mockSupabase._getProjects();
			const members = mockSupabase._getProjectMembers();

			expect(projects).toHaveLength(1);
			expect(members).toHaveLength(1);
			expect(members[0].project_id).toBe(projects[0].id);
		});

		it('should have consistent timestamps', async () => {
			const beforeCreate = Date.now();

			const formData = new FormData();
			formData.append('name', 'Timestamp Test');
			formData.append('description', 'Testing timestamps');

			await createProjectAction(formData, mockSupabase);

			const afterCreate = Date.now();

			const projects = mockSupabase._getProjects();
			const members = mockSupabase._getProjectMembers();

			const projectTime = new Date(projects[0].created_at).getTime();
			const memberTime = new Date(members[0].created_at).getTime();

			expect(projectTime).toBeGreaterThanOrEqual(beforeCreate);
			expect(projectTime).toBeLessThanOrEqual(afterCreate);
			expect(memberTime).toBeGreaterThanOrEqual(beforeCreate);
			expect(memberTime).toBeLessThanOrEqual(afterCreate);
		});

		it('should enforce unique project-user combinations', async () => {
			const formData = new FormData();
			formData.append('name', 'Duplicate Test');
			formData.append('description', 'Testing duplicate prevention');
			formData.append(
				'invitedMembers',
				JSON.stringify([{ email: 'member@test.com', role: 'Member' }])
			);

			await createProjectAction(formData, mockSupabase);

			const invitations = mockSupabase._getInvitations();
			await acceptInvitationAction(mockSupabase, invitations[0].id, 'user-2');

			// Verify only 2 members (no duplicates)
			const members = mockSupabase._getProjectMembers();
			const userIds = members.map((m) => m.user_id);
			const uniqueUserIds = [...new Set(userIds)];

			expect(userIds.length).toBe(uniqueUserIds.length);
		});
	});

	describe('Edge Cases', () => {
		it('should handle project with special characters in name', async () => {
			const formData = new FormData();
			formData.append('name', 'Project with émojis 🚀 and spéciål chars!');
			formData.append('description', 'Testing special characters');

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const projects = mockSupabase._getProjects();
			expect(projects[0].name).toBe('Project with émojis 🚀 and spéciål chars!');
		});

		it('should handle very long project descriptions', async () => {
			const longDescription = 'A'.repeat(1000);
			const formData = new FormData();
			formData.append('name', 'Long Description Project');
			formData.append('description', longDescription);

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const projects = mockSupabase._getProjects();
			expect(projects[0].description).toBe(longDescription);
		});

		it('should handle empty invited members array', async () => {
			const formData = new FormData();
			formData.append('name', 'Solo Project');
			formData.append('description', 'No invitations');
			formData.append('invitedMembers', JSON.stringify([]));

			const result = await createProjectAction(formData, mockSupabase);

			expect(result.success).toBe(true);

			const invitations = mockSupabase._getInvitations();
			expect(invitations).toHaveLength(0);

			// Only owner should be in members
			const members = mockSupabase._getProjectMembers();
			expect(members).toHaveLength(1);
		});

		it('should handle all valid project statuses', async () => {
			const statuses: Array<'planning' | 'active' | 'completed' | 'on-hold'> = [
				'planning',
				'active',
				'completed',
				'on-hold'
			];

			for (const status of statuses) {
				mockSupabase._clearAll();

				const formData = new FormData();
				formData.append('name', `Project ${status}`);
				formData.append('description', `Testing ${status} status`);
				formData.append('status', status);

				const result = await createProjectAction(formData, mockSupabase);

				expect(result.success).toBe(true);

				const projects = mockSupabase._getProjects();
				expect(projects[0].status).toBe(status);
			}
		});
	});
});
