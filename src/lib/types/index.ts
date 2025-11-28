/**
 * Shared types used across components.
 * Re-exports types from db.ts and adds component-specific types.
 */

// Re-export database types that are actually used by components
export type { TaskStatus } from '$lib/server/db';

// =============================================================================
// Component Types
// =============================================================================

/**
 * Role types for project members
 */
export type MemberRole = 'Owner' | 'Admin' | 'Member';

/**
 * Member type used in project task modals and member lists
 */
export type Member = {
	id: string;
	name: string;
	email: string;
	role: MemberRole;
	phone?: string;
};

/**
 * Course option for dropdowns (minimal data)
 * id can be string or number depending on database source
 */
export type CourseOption = {
	id: string | number;
	name: string;
};

/**
 * Course reference in task lists (minimal data with flexible id type)
 */
export type CourseRef = {
	id: string | number;
	name: string;
};

/**
 * Task type for task modals (used for editing)
 */
export type TaskForEdit = {
	id: string | number;
	name: string;
	effort_hours?: number | null;
	course_id?: string | null;
	deadline?: string | null;
	status?: 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';
	priority?: number | null;
};

/**
 * Task type for list components (used in TaskList)
 */
export type TaskForList = {
	id: string | number;
	name: string;
	status: 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';
	deadline?: string | null;
	effort_hours?: number | null;
	course?: CourseRef | null;
	priority?: number | null;
};

/**
 * Project task type for project task modals (used for editing)
 */
export type ProjectTaskForEdit = {
	id: string | number;
	name: string;
	effort_hours?: number | null;
	deadline?: string | null;
	assignee?: Member | null;
};

/**
 * Course type for course modals (used for editing)
 */
export type CourseForEdit = {
	id: string | number;
	name: string;
	ects_points: number;
	start_date?: string | null;
	end_date?: string | null;
	lecture_weekdays?: number[] | string | null;
};

/**
 * Course type for list components (used in CourseList)
 */
export type CourseForList = {
	id: string | number;
	name: string;
	ects_points: number;
	start_date?: string | null;
	end_date?: string | null;
	lecture_weekdays?: number[] | string | null;
};

/**
 * Project status values
 */
export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

/**
 * Project type for list components (used in ProjectList)
 */
export type ProjectForList = {
	id: string | number;
	name: string;
	description: string;
	status: ProjectStatus;
	created_at?: string;
	course?: CourseRef | null;
	role?: string;
};

/**
 * Pending invitation type for project member lists
 */
export type PendingInvitationForList = {
	id: string;
	email: string;
	name: string;
	role: string;
	created_at: string;
};

// =============================================================================
// Workload Calculation Types
// =============================================================================

/**
 * Task type for workload calculations (minimal fields needed)
 */
export interface WorkloadTask {
	id: string | number;
	name: string;
	status: 'pending' | 'todo' | 'on-hold' | 'working' | 'completed';
	deadline?: string | null;
	effort_hours?: number | null;
	[key: string]: unknown;
}

/**
 * Daily workload data for week view
 */
export interface DayData {
	date: Date;
	label: string;
	overdue: number;
	incomplete: number;
	completed: number;
}

/**
 * Weekly workload data for month/custom view
 */
export interface WeekData {
	weekNumber: number;
	label: string;
	overdue: number;
	incomplete: number;
	completed: number;
}

// =============================================================================
// Form Result Types
// =============================================================================

/**
 * Standard failure data type for form actions
 */
export type FailureData = {
	error?: string;
};
