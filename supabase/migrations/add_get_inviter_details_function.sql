-- Funktion til at hente detaljer på dem, der har inviteret en
CREATE OR REPLACE FUNCTION get_inviter_details(inviter_ids UUID[])
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
  WHERE au.id = ANY(inviter_ids)
  AND EXISTS (
    -- SIKKERHEDSTJEK: Man må kun se data på en bruger, hvis man har en invitation fra dem
    SELECT 1 FROM project_invitations
    WHERE project_invitations.invitor_user_id = au.id
    AND project_invitations.invited_user_id = auth.uid()
  );
END;
$$;

-- Giv adgang til autentificerede brugere
GRANT EXECUTE ON FUNCTION get_inviter_details(UUID[]) TO authenticated;