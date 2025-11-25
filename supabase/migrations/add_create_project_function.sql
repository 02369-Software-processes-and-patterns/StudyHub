-- Create a function to handle project creation atomically
-- Uses SECURITY DEFINER to bypass RLS and create both project and owner membership
CREATE OR REPLACE FUNCTION create_project_with_owner(
  p_name TEXT,
  p_description TEXT,
  p_course_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'planning'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_project JSON;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert the project
  INSERT INTO projects (name, description, course_id, status)
  VALUES (p_name, p_description, p_course_id, p_status)
  RETURNING id INTO v_project_id;

  -- Add the user as owner
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project_id, v_user_id, 'Owner');

  -- Return the created project
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'description', p.description,
    'course_id', p.course_id,
    'status', p.status,
    'created_at', p.created_at
  ) INTO v_project
  FROM projects p
  WHERE p.id = v_project_id;

  RETURN v_project;
END;
$$;

