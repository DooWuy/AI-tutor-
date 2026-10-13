-- Migration for Issue 10: Skills Management, Lesson-Skill Links, System Settings, System Logs

-- 1. Skills table updates
ALTER TABLE skills ADD COLUMN IF NOT EXISTS importance INTEGER NOT NULL DEFAULT 1;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS mastery_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.90;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS min_attempts INTEGER NOT NULL DEFAULT 3;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS can_skip BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE skills DROP CONSTRAINT IF EXISTS ck_skills_importance;
ALTER TABLE skills ADD CONSTRAINT ck_skills_importance CHECK (importance BETWEEN 1 AND 10);

ALTER TABLE skills DROP CONSTRAINT IF EXISTS ck_skills_mastery_threshold;
ALTER TABLE skills ADD CONSTRAINT ck_skills_mastery_threshold CHECK (mastery_threshold >= 0.00 AND mastery_threshold <= 1.00);

ALTER TABLE skills DROP CONSTRAINT IF EXISTS ck_skills_min_attempts;
ALTER TABLE skills ADD CONSTRAINT ck_skills_min_attempts CHECK (min_attempts BETWEEN 1 AND 100);

-- 2. Lesson-Skill relation table
CREATE TABLE IF NOT EXISTS lesson_skills (
    id UUID PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_lesson_skills UNIQUE (lesson_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_skills_lesson ON lesson_skills (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_skills_skill ON lesson_skills (skill_id);

-- 3. System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (key, value, group_name, description, updated_at)
VALUES
    ('gamification.daily_xp_cap', '500', 'GAMIFICATION', 'Hạn mức XP tối đa mỗi ngày cho học sinh', NOW()),
    ('ai.default_model', 'gemini-1.5-flash', 'AI_MODEL', 'Mô hình AI mặc định để tạo câu hỏi và chấm bài', NOW()),
    ('ai.temperature', '0.7', 'AI_MODEL', 'Nhiệt độ sáng tạo của mô hình AI (0.0 - 1.0)', NOW()),
    ('ai.api_key', '', 'AI_MODEL', 'Google Gemini / AI API Key tùy chỉnh', NOW()),
    ('system.maintenance_mode', 'false', 'MAINTENANCE', 'Chế độ bảo trì hệ thống toàn cục (true/false)', NOW()),
    ('system.maintenance_message', 'Hệ thống đang được nâng cấp bảo trì định kỳ. Vui lòng quay lại sau ít phút!', 'MAINTENANCE', 'Thông báo bảo trì hiển thị cho học sinh', NOW()),
    ('cache.redis_ttl_seconds', '3600', 'CACHE_DB', 'Thời gian lưu cache Redis mặc định (giây)', NOW())
ON CONFLICT (key) DO NOTHING;

-- 4. System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(255),
    stack_trace TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs (level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
