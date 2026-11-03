-- Fail explicitly on pre-existing case-insensitive collisions; resolve before upgrade.
CREATE UNIQUE INDEX uq_users_email_ci ON users (lower(btrim(email)));
ALTER TABLE users ADD COLUMN invitation_status varchar(16);
ALTER TABLE users ADD COLUMN invitation_requested_at timestamptz;
ALTER TABLE users ADD CONSTRAINT ck_invitation_status CHECK (invitation_status IN ('QUEUED','SENT','FAILED','COMPLETED'));
CREATE INDEX idx_users_invitation_queue ON users (invitation_requested_at) WHERE invitation_status = 'QUEUED' AND is_deleted = false;
