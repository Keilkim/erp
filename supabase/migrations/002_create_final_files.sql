-- 최종본 파일 테이블 (파일 관리 메타데이터)
CREATE TABLE IF NOT EXISTS final_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    headers JSONB DEFAULT '[]'::JSONB,
    rows JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_final_files_created_at
    ON final_files (created_at DESC);

CREATE TRIGGER trigger_final_files_updated_at
    BEFORE UPDATE ON final_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
