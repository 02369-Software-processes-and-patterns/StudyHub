-- Allow project owners and admins to view pending invitations for their projects
-- This enables displaying pending members in the project team members list

CREATE POLICY "Owners and Admins can view project invitations"
ON project_invitations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('Owner', 'Admin')
  )
);

-- Allow project owners and admins to cancel (delete) invitations they've sent
CREATE POLICY "Owners and Admins can cancel project invitations"
ON project_invitations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('Owner', 'Admin')
  )
);

