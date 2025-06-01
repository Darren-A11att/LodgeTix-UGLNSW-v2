-- Create organisation_users table to manage user-organisation relationships
CREATE TABLE IF NOT EXISTS public.organisation_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES public.organisations(organisation_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organisation_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organisation_users_user_id ON public.organisation_users(user_id);
CREATE INDEX IF NOT EXISTS idx_organisation_users_organisation_id ON public.organisation_users(organisation_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_organisation_users_updated_at 
  BEFORE UPDATE ON public.organisation_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.organisation_users TO authenticated;
GRANT ALL ON public.organisation_users TO service_role;

-- Enable RLS
ALTER TABLE public.organisation_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own organisation memberships" ON public.organisation_users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Organisation admins can manage memberships" ON public.organisation_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organisation_users ou
      WHERE ou.user_id = auth.uid()
      AND ou.organisation_id = organisation_users.organisation_id
      AND ou.role = 'admin'
    )
  );

-- Now set up the specific user
DO $$
DECLARE
  v_user_id UUID;
  v_contact_email TEXT;
  v_contact_name TEXT;
BEGIN
  -- Get contact details
  SELECT email, first_name || ' ' || last_name 
  INTO v_contact_email, v_contact_name
  FROM public.contacts 
  WHERE contact_id = 'c08bb67c-8391-4da9-8a9f-6f121e83c8f9';

  -- Create auth user if email exists
  IF v_contact_email IS NOT NULL THEN
    -- Create auth user (Note: In production, you'd use Supabase Admin API)
    -- For now, we'll prepare the user and update the contact
    v_user_id := gen_random_uuid();
    
    -- Note: This is a placeholder. In production, you need to use Supabase Admin API
    -- to create the auth user. For now, we'll just prepare the data structure.
    
    -- Update contact with auth_user_id (will be updated when actual user is created)
    UPDATE public.contacts 
    SET auth_user_id = v_user_id
    WHERE contact_id = 'c08bb67c-8391-4da9-8a9f-6f121e83c8f9';
    
    -- Add user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'organiser_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Link user to organisation
    INSERT INTO public.organisation_users (user_id, organisation_id, role)
    VALUES (v_user_id, '3e893fa6-2cc2-448c-be9c-e3858cc90e11', 'admin')
    ON CONFLICT (user_id, organisation_id) DO NOTHING;
    
    RAISE NOTICE 'User setup prepared for contact: % with email: %', v_contact_name, v_contact_email;
    RAISE NOTICE 'Auth User ID prepared: %', v_user_id;
    RAISE NOTICE 'You need to create the actual auth user using Supabase Admin API with this ID';
  END IF;
END $$;

-- Add comment with instructions
COMMENT ON TABLE public.organisation_users IS 'Manages relationships between users and organisations for the organiser portal. Users must have an entry here to access organisation data.';