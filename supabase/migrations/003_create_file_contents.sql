-- 파일 내용 테이블 (가변적 데이터 저장)
CREATE TABLE IF NOT EXISTS file_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    final_file_id UUID NOT NULL
        REFERENCES final_files(id) ON DELETE CASCADE,
    headers JSONB DEFAULT '[]'::JSONB,
    rows JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_contents_final_file_id
    ON file_contents (final_file_id);
