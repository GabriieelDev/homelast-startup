CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nextval('orders_order_number_seq'::regclass);
$$;

GRANT EXECUTE ON FUNCTION public.get_next_order_number() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_order_number() TO service_role;