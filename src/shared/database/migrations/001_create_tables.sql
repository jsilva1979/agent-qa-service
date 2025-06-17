-- Habilita a extensão pgvector para trabalhar com embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Cria a tabela de logs
CREATE TABLE IF NOT EXISTS logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}'::text[]
);

-- Cria a tabela de análises
CREATE TABLE IF NOT EXISTS analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    log_id UUID REFERENCES logs(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}'::text[]
);

-- Cria índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_log_id ON analyses(log_id);
CREATE INDEX IF NOT EXISTS idx_logs_tags ON logs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_analyses_tags ON analyses USING GIN (tags);

-- Cria uma função para buscar logs por tags
CREATE OR REPLACE FUNCTION search_logs_by_tags(
    search_tags TEXT[],
    result_limit int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    content text,
    metadata jsonb,
    tags text[],
    tag_matches int
)
LANGUAGE plpgsql
AS $$
BEGIN
    SET search_path = pg_catalog, public, pg_temp;
    RETURN QUERY
    SELECT
        logs.id,
        logs.content,
        logs.metadata,
        logs.tags,
        array_length(array(
            SELECT unnest(logs.tags) 
            INTERSECT 
            SELECT unnest(search_tags)
        ), 1) as tag_matches
    FROM logs
    WHERE logs.tags && search_tags
    ORDER BY tag_matches DESC
    LIMIT result_limit;
END;
$$; 