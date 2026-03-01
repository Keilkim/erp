-- 임시 저장 파일 테이블
CREATE TABLE IF NOT EXISTS temp_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT DEFAULT 0,
    headers JSONB DEFAULT '[]'::JSONB,
    rows JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_temp_files_created_at
    ON temp_files (created_at DESC);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_temp_files_updated_at
    BEFORE UPDATE ON temp_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
