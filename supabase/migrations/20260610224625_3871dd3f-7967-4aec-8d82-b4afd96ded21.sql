CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq START WITH 100000 INCREMENT BY 1 MINVALUE 100000 NO MAXVALUE CACHE 1;
SELECT setval('public.orders_order_number_seq', GREATEST(100000, COALESCE((SELECT MAX(order_number) FROM public.orders), 100000)));
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');
ALTER SEQUENCE public.orders_order_number_seq OWNED BY public.orders.order_number;
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO authenticated, service_role;