CREATE OR REPLACE FUNCTION reject_quiz_result_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF current_setting('app.allow_history_maintenance', true) = 'true' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.is_visible = TRUE AND NEW.is_visible = FALSE
        AND (to_jsonb(OLD) - 'is_visible') = (to_jsonb(NEW) - 'is_visible') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'HISTORY_IMMUTABLE' USING ERRCODE = '42501';
END;
$$;
