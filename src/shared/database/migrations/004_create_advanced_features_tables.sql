-- Tabela para armazenar histórico de ações
CREATE TABLE IF NOT EXISTS action_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    jira_issue_key VARCHAR(20),
    analysis_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para classificação de erros
CREATE TABLE IF NOT EXISTS error_classifications (
    id SERIAL PRIMARY KEY,
    jira_issue_key VARCHAR(20) NOT NULL,
    error_type VARCHAR(100) NOT NULL,
    impact_level VARCHAR(20) NOT NULL,
    recurrence_count INTEGER DEFAULT 1,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para configurações de autoescalonamento
CREATE TABLE IF NOT EXISTS escalation_rules (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(100) NOT NULL,
    impact_level VARCHAR(20) NOT NULL,
    slack_channel VARCHAR(50),
    slack_users TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_action_history_user ON action_history(user_id);
CREATE INDEX IF NOT EXISTS idx_error_class_issue ON error_classifications(jira_issue_key);
CREATE INDEX IF NOT EXISTS idx_error_class_type ON error_classifications(error_type);
CREATE INDEX IF NOT EXISTS idx_escalation_error_type ON escalation_rules(error_type, impact_level); 