-- 엑셀 파일 영구 저장 테이블
CREATE TABLE IF NOT EXISTS saved_excel_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    headers JSONB DEFAULT '[]'::JSONB,
    rows JSONB DEFAULT '[]'::JSONB,
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_excel_files_saved_at
    ON saved_excel_files (saved_at DESC);
