-- Drop the restrictive SELECT policy for students/leaders
DROP POLICY "Students and leaders can view their configs" ON commission_calculator_configs;

-- Create a new policy that allows all authenticated users to view all configs
-- Leaders need to see configs of their team members to calculate commissions correctly
CREATE POLICY "Authenticated users can view all configs"
ON commission_calculator_configs
FOR SELECT
TO authenticated
USING (true);