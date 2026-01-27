-- Create the expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal(12,2) NOT NULL,
  description text NOT NULL,
  category text, -- e.g., 'Services', 'Payroll', 'Supplies'
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admins can do everything (select, insert, update, delete)
CREATE POLICY "Admins can manage expenses"
  ON expenses
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
