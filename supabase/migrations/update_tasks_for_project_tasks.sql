-- Migration: Update tasks table to support both personal and project tasks
-- Personal tasks: user_id is set (owner), project_id is null
-- Project tasks: project_id is set, user_id is the assigned member (or null if unassigned)

-- Make user_id nullable to support unassigned project tasks
ALTER TABLE public.tasks 
ALTER COLUMN user_id DROP NOT NULL;

-- Drop old constraint if it exists
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_owner_check;

-- Add a check constraint to ensure project_id OR user_id is set
-- Personal task: user_id set, project_id null
-- Project task: project_id set, user_id can be null (unassigned) or set (assigned to member)
ALTER TABLE public.tasks
ADD CONSTRAINT tasks_ownership_check 
CHECK (
    -- Personal task: must have user_id, no project_id
    (project_id IS NULL AND user_id IS NOT NULL)
    OR
    -- Project task: must have project_id, user_id optional (assigned member)
    (project_id IS NOT NULL)
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id) WHERE project_id IS NOT NULL;

-- Comment on the constraint for documentation
COMMENT ON CONSTRAINT tasks_ownership_check ON public.tasks IS 
'Personal tasks require user_id with no project_id. Project tasks require project_id, user_id is optional (assigned member).';
