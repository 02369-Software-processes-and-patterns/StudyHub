-- Function to get user details by IDs
-- This retrieves user information (id, email, name) from auth.users based on user IDs
CREATE OR REPLACE FUNCTION get_user_details_by_ids(user_ids UUID[])
RETURNS TABLE (id UUID, email TEXT, name TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_details_by_ids(UUID[]) TO authenticated;
