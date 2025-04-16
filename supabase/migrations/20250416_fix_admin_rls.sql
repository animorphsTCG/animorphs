
-- Create a security definer function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Get the admin status for the current authenticated user
  SELECT p.is_admin INTO is_admin_user
  FROM public.profiles p 
  WHERE p.id = auth.uid();
  
  -- Return the result
  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- Create RLS policies to allow admin to view and edit all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles
FOR UPDATE 
USING (is_admin());

-- Create RLS policies to allow admin to view and edit all songs
CREATE POLICY "Admins can view all songs" 
ON public.songs
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all songs" 
ON public.songs
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can insert songs" 
ON public.songs
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete songs" 
ON public.songs
FOR DELETE 
USING (is_admin());

-- Create RLS policies to allow admin to view and edit all VIP codes
CREATE POLICY "Admins can view all VIP codes" 
ON public.vip_codes
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all VIP codes" 
ON public.vip_codes
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can insert VIP codes" 
ON public.vip_codes
FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete VIP codes" 
ON public.vip_codes
FOR DELETE 
USING (is_admin());
