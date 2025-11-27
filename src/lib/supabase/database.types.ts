export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '13.0.5';
	};
	public: {
		Tables: {
			courses: {
				Row: {
					created_at: string;
					ects_points: number;
					end_date: string;
					id: string;
					lecture_weekdays: Json;
					name: string;
					start_date: string;
					user_id: string | null;
				};
				Insert: {
					created_at?: string;
					ects_points: number;
					end_date: string;
					id?: string;
					lecture_weekdays: Json;
					name: string;
					start_date: string;
					user_id?: string | null;
				};
				Update: {
					created_at?: string;
					ects_points?: number;
					end_date?: string;
					id?: string;
					lecture_weekdays?: Json;
					name?: string;
					start_date?: string;
					user_id?: string | null;
				};
				Relationships: [];
			};
			project_invitations: {
				Row: {
					created_at: string;
					id: string;
					invited_user_id: string;
					invitor_user_id: string;
					project_id: string;
					role: string;
					status: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					invited_user_id: string;
					invitor_user_id: string;
					project_id: string;
					role?: string;
					status?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					invited_user_id?: string;
					invitor_user_id?: string;
					project_id?: string;
					role?: string;
					status?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'project_invitations_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};
			project_members: {
				Row: {
					created_at: string;
					project_id: string;
					role: string;
					user_id: string;
				};
				Insert: {
					created_at?: string;
					project_id: string;
					role?: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					project_id?: string;
					role?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'project_members_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};
			projects: {
				Row: {
					course_id: string | null;
					created_at: string;
					description: string;
					id: string;
					name: string;
					status: string;
				};
				Insert: {
					course_id?: string | null;
					created_at?: string;
					description: string;
					id?: string;
					name: string;
					status?: string;
				};
				Update: {
					course_id?: string | null;
					created_at?: string;
					description?: string;
					id?: string;
					name?: string;
					status?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'projects_course_id_fkey';
						columns: ['course_id'];
						isOneToOne: false;
						referencedRelation: 'courses';
						referencedColumns: ['id'];
					}
				];
			};
			tasks: {
				Row: {
					assigned_to: string | null;
					course_id: string | null;
					created_at: string;
					deadline: string;
					effort_hours: number;
					id: string;
					name: string;
					priority: number | null;
					project_id: string | null;
					status: string;
					user_id: string | null;
				};
				Insert: {
					assigned_to?: string | null;
					course_id?: string | null;
					created_at?: string;
					deadline: string;
					effort_hours: number;
					id?: string;
					name: string;
					priority?: number | null;
					project_id?: string | null;
					status?: string;
					user_id?: string | null;
				};
				Update: {
					assigned_to?: string | null;
					course_id?: string | null;
					created_at?: string;
					deadline?: string;
					effort_hours?: number;
					id?: string;
					name?: string;
					priority?: number | null;
					project_id?: string | null;
					status?: string;
					user_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'tasks_course_id_fkey';
						columns: ['course_id'];
						isOneToOne: false;
						referencedRelation: 'courses';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'tasks_project_id_fkey';
						columns: ['project_id'];
						isOneToOne: false;
						referencedRelation: 'projects';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			create_project_with_owner: {
				Args: {
					p_course_id?: string;
					p_description: string;
					p_name: string;
					p_status?: string;
				};
				Returns: Json;
			};
			get_inviter_details: {
				Args: { inviter_ids: string[] };
				Returns: {
					email: string;
					id: string;
					name: string;
				}[];
			};
			get_user_details_by_ids:
				| {
						Args: { project_id: string; user_ids: string[] };
						Returns: {
							email: string;
							id: string;
							name: string;
							phone: string;
						}[];
				  }
				| {
						Args: { user_ids: string[] };
						Returns: {
							email: string;
							id: string;
							name: string;
						}[];
				  };
			get_user_ids_by_emails: {
				Args: { email_list: string[] };
				Returns: {
					email: string;
					id: string;
				}[];
			};
			search_users_by_email: {
				Args: { search_email: string };
				Returns: {
					email: string;
					id: string;
				}[];
			};
			search_users_by_email_or_name: {
				Args: { search_query: string };
				Returns: {
					email: string;
					id: string;
					name: string;
				}[];
			};
			transfer_project_ownership: {
				Args: {
					p_current_owner_id: string;
					p_new_owner_id: string;
					p_project_id: string;
				};
				Returns: undefined;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {}
	}
} as const;
