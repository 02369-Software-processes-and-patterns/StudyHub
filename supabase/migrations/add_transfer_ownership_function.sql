-- Create a function to transfer project ownership
-- Uses SECURITY DEFINER to bypass RLS policies since the "Owners and admins can update members"
-- policy prevents updating rows where role = 'Owner'

CREATE OR REPLACE FUNCTION transfer_project_ownership(
    p_project_id UUID,
    p_current_owner_id UUID,
    p_new_owner_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_role TEXT;
    v_new_member_role TEXT;
BEGIN
    -- Verify the caller is the current owner
    SELECT role INTO v_current_role
    FROM project_members
    WHERE project_id = p_project_id AND user_id = p_current_owner_id;

    IF v_current_role IS NULL OR v_current_role != 'Owner' THEN
        RAISE EXCEPTION 'Only the current owner can transfer ownership';
    END IF;

    -- Verify new owner is a member of the project
    SELECT role INTO v_new_member_role
    FROM project_members
    WHERE project_id = p_project_id AND user_id = p_new_owner_id;

    IF v_new_member_role IS NULL THEN
        RAISE EXCEPTION 'New owner must be a member of the project';
    END IF;

    -- Cannot transfer to yourself
    IF p_current_owner_id = p_new_owner_id THEN
        RAISE EXCEPTION 'Cannot transfer ownership to yourself';
    END IF;

    -- Demote current owner to Admin
    UPDATE project_members
    SET role = 'Admin'
    WHERE project_id = p_project_id AND user_id = p_current_owner_id;

    -- Promote new owner to Owner
    UPDATE project_members
    SET role = 'Owner'
    WHERE project_id = p_project_id AND user_id = p_new_owner_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION transfer_project_ownership(UUID, UUID, UUID) TO authenticated;

