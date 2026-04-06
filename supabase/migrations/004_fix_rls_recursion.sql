-- ============================================================
-- Migration 004: Fix infinite recursion in RLS policies
-- ============================================================
-- Problem: "Users can view org members" policy on profiles
-- references profiles itself, causing infinite recursion when
-- any RLS-protected query touches the profiles table.
--
-- Fix: Use a SECURITY DEFINER function to break the cycle.
-- ============================================================

-- Step 1: Create a SECURITY DEFINER function to get user's org_id
-- This bypasses RLS, breaking the recursion chain
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Step 2: Drop the recursive policy
DROP POLICY IF EXISTS "Users can view org members" ON public.profiles;

-- Step 3: Recreate it using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Users can view org members" ON public.profiles
  FOR SELECT
  USING (organization_id = public.get_user_org_id());

-- Step 4: Ensure profiles has an INSERT policy for signup
-- (users need to create their own profile during registration)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Step 5: Ensure organizations has proper policies for signup
-- Allow any authenticated user to create an organization
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own organization (using the safe function)
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations
  FOR SELECT
  USING (id = public.get_user_org_id());

-- Allow users to update their own organization
DROP POLICY IF EXISTS "Users can update own organization" ON public.organizations;
CREATE POLICY "Users can update own organization" ON public.organizations
  FOR UPDATE
  USING (id = public.get_user_org_id());

-- Step 6: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
