-- Add allow_system_prompt_override to projects
ALTER TABLE projects
  ADD COLUMN allow_system_prompt_override boolean NOT NULL DEFAULT false;
