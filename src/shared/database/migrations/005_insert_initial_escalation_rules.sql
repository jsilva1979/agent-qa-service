-- Regras para erros de API
INSERT INTO escalation_rules (error_type, impact_level, slack_channel, slack_users)
VALUES 
  ('API', 'HIGH', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']),
  ('API', 'CRITICAL', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']);

-- Regras para erros de Banco de Dados
INSERT INTO escalation_rules (error_type, impact_level, slack_channel, slack_users)
VALUES 
  ('Database', 'HIGH', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']),
  ('Database', 'CRITICAL', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']);

-- Regras para erros de Rede
INSERT INTO escalation_rules (error_type, impact_level, slack_channel, slack_users)
VALUES 
  ('Network', 'HIGH', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']),
  ('Network', 'CRITICAL', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']);

-- Regras para erros de UI
INSERT INTO escalation_rules (error_type, impact_level, slack_channel, slack_users)
VALUES 
  ('UI', 'HIGH', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']),
  ('UI', 'CRITICAL', 'C08UDFZGXCP', ARRAY['U0902Q1ELP2']); 