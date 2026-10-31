import { useEffect, useRef, useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import type { NotificationType } from '../types/notification';

const STUDENT_RESULT_TYPES: NotificationType[] = ['STUDY_CLASS_JOIN_APPROVED', 'STUDY_CLASS_JOIN_REJECTED'];

/** REST stays authoritative. Read/replay changes cannot retrigger the same event. */
export function useStudyClassUpdates(classId?: string, eventTypes: NotificationType[] = STUDENT_RESULT_TYPES) {
  const { notifications } = useNotification();
  const eventTypeKey = eventTypes.join('|');
  const eventTypesRef = useRef(eventTypes);
  eventTypesRef.current = eventTypes;
  const seen = useRef(new Set<string>());
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let changed = false;
    for (const item of notifications) {
      if (seen.current.has(item.id)) continue;
      seen.current.add(item.id);
      if (eventTypesRef.current.includes(item.type as NotificationType)
        && (!classId || item.metadata.classId === classId)) changed = true;
    }
    if (changed) setRevision(value => value + 1);
  }, [notifications, classId, eventTypeKey]);
  return revision;
}
