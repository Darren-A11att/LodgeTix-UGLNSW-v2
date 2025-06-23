-- Enable realtime on payment_gateway table
-- This allows the application to subscribe to changes and invalidate cache automatically

-- Enable realtime for the payment_gateway table
ALTER PUBLICATION supabase_realtime ADD TABLE payment_gateway;

-- Add comment to document this feature
COMMENT ON TABLE payment_gateway IS 'Stores payment gateway configuration including fee structures. Replaces environment variable-based configuration. Realtime enabled for automatic cache invalidation.';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for payment_gateway table';
  RAISE NOTICE 'Application will now receive real-time updates when payment configuration changes';
END $$;