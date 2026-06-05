
-- Allow admins to delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure realtime emits full rows for UPDATE/DELETE
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Admin-only function to fetch emails from auth.users for fallback display
CREATE OR REPLACE FUNCTION public.get_user_emails(_user_ids uuid[])
RETURNS TABLE (user_id uuid, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY(_user_ids)
    AND public.has_role(auth.uid(), 'admin'::app_role);
$$;

GRANT EXECUTE ON FUNCTION public.get_user_emails(uuid[]) TO authenticated;

-- Admin-only bulk delete of old finished orders
CREATE OR REPLACE FUNCTION public.admin_delete_old_orders(_days integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  IF _days IS NULL OR _days < 0 THEN
    RAISE EXCEPTION 'invalid days';
  END IF;

  WITH del AS (
    DELETE FROM public.orders
    WHERE status IN ('entregue','cancelado')
      AND created_at < now() - make_interval(days => _days)
    RETURNING 1
  )
  SELECT count(*)::int INTO deleted_count FROM del;

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_old_orders(integer) TO authenticated;
