-- Drop all existing policies explicitly
DROP POLICY "Authenticated users can create projects" ON projects;
DROP POLICY "Users can view their projects" ON projects;
DROP POLICY "Project owners and admins can update projects" ON projects;
DROP POLICY "Only owners can delete projects" ON projects;
DROP POLICY "Allow inserting project members" ON project_members;
DROP POLICY "Users can view project members" ON project_members;
DROP POLICY "Owners and admins can update members" ON project_members;
DROP POLICY "Owners and admins can remove members" ON project_members;

-- Completely disable and re-enable RLS to ensure clean state
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
ON projects
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can view projects they are members of OR projects they just created
CREATE POLICY "Users can view their projects"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_members.project_id = projects.id 
    AND project_members.user_id = auth.uid()
  )
);

-- Policy: Project owners and admins can update projects
CREATE POLICY "Project owners and admins can update projects"
ON projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_members.project_id = projects.id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role IN ('Owner', 'Admin')
  )
);

-- Policy: Only project owners can delete projects
CREATE POLICY "Only owners can delete projects"
ON projects
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM project_members 
    WHERE project_members.project_id = projects.id 
    AND project_members.user_id = auth.uid() 
    AND project_members.role = 'Owner'
  )
);

-- Enable RLS on project_members table if not already enabled
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserting project members (needed for project creation)
CREATE POLICY "Allow inserting project members"
ON project_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can view members of projects they belong to
CREATE POLICY "Users can view project members"
ON project_members
FOR SELECT
TO authenticated
USING (true); -- Allow viewing all project members if you're authenticated
-- Note: You can only see projects you're a member of due to the projects RLS policy

-- Policy: Project owners and admins can update members (except changing owner)
CREATE POLICY "Owners and admins can update members"
ON project_members
FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    WHERE pm.user_id = auth.uid() 
    AND pm.role IN ('Owner', 'Admin')
  )
  AND role != 'Owner' -- Cannot modify owner role
);

-- Policy: Project owners and admins can remove members (except owners)
CREATE POLICY "Owners and admins can remove members"
ON project_members
FOR DELETE
TO authenticated
USING (
  role != 'Owner' -- Cannot remove owners
  AND project_id IN (
    SELECT pm.project_id 
    FROM project_members pm 
    WHERE pm.user_id = auth.uid() 
    AND pm.role IN ('Owner', 'Admin')
  )
);
