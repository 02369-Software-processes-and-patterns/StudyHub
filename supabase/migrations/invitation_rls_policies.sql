-- 1. Aktiver RLS på tabellen (hvis det ikke allerede er gjort)
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Tillad projekt-ejere/admins at OPRETTE invitationer
-- Tjekker: Er den der udfører handlingen (auth.uid) ejer/admin på projektet?
CREATE POLICY "Owners and Admins can create invitations"
ON project_invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = project_invitations.project_id
    AND project_members.user_id = auth.uid()
    AND project_members.role IN ('Owner', 'Admin')
  )
);

-- 3. Tillad brugere at SE invitationer sendt TIL dem
-- Tjekker: Er 'invited_user_id' lig med den logget ind brugers ID?
CREATE POLICY "Users can view their own invitations"
ON project_invitations FOR SELECT
TO authenticated
USING (invited_user_id = auth.uid());

-- 4. Tillad brugere at SLETTE (afvise/acceptere) deres egne invitationer
-- Tjekker: Samme som ovenfor
CREATE POLICY "Users can delete their own invitations"
ON project_invitations FOR DELETE
TO authenticated
USING (invited_user_id = auth.uid());


-- 5. VIGTIGT: Tillad inviterede brugere at se navnet på projektet
-- Uden denne kan din invitations-side ikke vise projektnavnet, før man har accepteret.
CREATE POLICY "Invited users can view project details"
ON projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM project_invitations 
    WHERE project_invitations.project_id = projects.id 
    AND project_invitations.invited_user_id = auth.uid()
  )
);