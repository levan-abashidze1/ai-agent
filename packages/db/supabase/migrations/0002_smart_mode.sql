-- Smart-mode settings: AI decides whether to respond + occasional proactive chime-ins.

insert into settings (key, value) values
  ('smart_mode', 'true'::jsonb),
  ('smart_min_gap_seconds', '30'::jsonb),
  ('proactive_probability', '0.05'::jsonb)
on conflict (key) do nothing;
