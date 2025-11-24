-- SQL functions for user search and member management
-- Run this in your Supabase SQL Editor

-- Function to search users by email or name
-- This function allows authenticated users to search for other users by email or name
CREATE OR REPLACE FUNCTION search_users_by_email_or_name(search_query TEXT)
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
  WHERE (
      au.email ILIKE '%' || search_query || '%'
      OR au.raw_user_meta_data->>'name' ILIKE '%' || search_query || '%'
      OR au.raw_user_meta_data->>'full_name' ILIKE '%' || search_query || '%'
    )
    AND au.id != auth.uid() -- Exclude the current user
  LIMIT 10;
END;
$$;

-- Function to get user IDs from a list of emails
CREATE OR REPLACE FUNCTION get_user_ids_by_emails(email_list TEXT[])
RETURNS TABLE (id UUID, email TEXT)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::UUID,
    au.email::TEXT
  FROM auth.users au
  WHERE au.email = ANY(email_list);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_users_by_email_or_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ids_by_emails(TEXT[]) TO authenticated;
