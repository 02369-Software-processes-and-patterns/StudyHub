-- Function to get user details by IDs
-- This retrieves user information (id, email, name) from auth.users based on user IDs
-- 
-- SECURITY CONSIDERATIONS:
-- - Uses SECURITY DEFINER to allow authenticated users to query auth.users
-- - Only exposes id, email, and name fields (no password hashes or sensitive auth data)
-- - Returns ONLY the user_ids passed as parameters (no data leakage)
-- - Validates that caller is only querying members from projects they're part of
-- 
-- AUTHORIZATION:
-- Users can only query details for:
--   1. Members of projects they're part of
--   2. Users they've invited to projects
--   3. Users in the same project context
CREATE OR REPLACE FUNCTION get_user_details_by_ids(user_ids UUID[], project_id UUID)
RETURNS TABLE (id UUID, email TEXT, name TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- Verify that the current user is a member of the project
  IF NOT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = get_user_details_by_ids.project_id
    AND project_members.user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'You do not have access to this project';
  END IF;

  -- Return only the specified fields to minimize exposure
  -- Users can only query details for members of the same project
  RETURN QUERY
  SELECT 
    au.id::UUID,
    au.email::TEXT,
    COALESCE(
      au.raw_user_meta_data->>'name',
      au.raw_user_meta_data->>'full_name',
      split_part(au.email, '@', 1)
    )::TEXT as name
  FROM auth.users au
  WHERE au.id = ANY(user_ids)
  AND EXISTS (
    -- Only return users that are members of the same project
    SELECT 1 FROM project_members
    WHERE project_members.project_id = get_user_details_by_ids.project_id
    AND project_members.user_id = au.id
  );
END;
$$;

-- Grant execute permissions to authenticated users
-- Only authenticated users can call this function
GRANT EXECUTE ON FUNCTION get_user_details_by_ids(UUID[], UUID) TO authenticated;
