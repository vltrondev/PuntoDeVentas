-- Create the capital_injections table
CREATE TABLE IF NOT EXISTS capital_injections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal(12,2) NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE capital_injections ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admins can do everything (select, insert, update, delete)
CREATE POLICY "Admins can manage capital injections"
  ON capital_injections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Non-admins have no access (no policy = deny all by default)
