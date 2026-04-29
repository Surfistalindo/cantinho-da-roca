INSERT INTO public.user_roles (user_id, role)
VALUES ('cac60e0e-9e86-4a0b-8558-8e51087f0222', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles
WHERE user_id = 'cac60e0e-9e86-4a0b-8558-8e51087f0222'
  AND role = 'vendedor';