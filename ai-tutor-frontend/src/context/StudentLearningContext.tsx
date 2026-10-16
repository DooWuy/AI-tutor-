import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { getMyStudentProfile } from "../services/studentProfileApi";
import { gamificationApi } from "../services/gamificationApi";
import type { StudentProfile } from "../types/studentProfile";
import type { Leaderboard, StudentProgress } from "../types/gamification";
export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}
type LearningState = {
  profile: Resource<StudentProfile>;
  progress: Resource<StudentProgress>;
  GLOBAL: Resource<Leaderboard>;
  CLASS: Resource<Leaderboard>;
};
type LearningContext = LearningState & { refresh: () => void };
const Context = createContext<LearningContext | null>(null);
const initial = () => ({ data: null, loading: true, error: null });
/** Scoped to the authenticated StudentLayout; never reuse data across accounts. */
export function StudentLearningProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearningState>({
    profile: initial(),
    progress: initial(),
    GLOBAL: initial(),
    CLASS: initial(),
  });
  const sequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(() => {
    const version = ++sequence.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setState({
      profile: initial(),
      progress: initial(),
      GLOBAL: initial(),
      CLASS: initial(),
    });
    async function load<K extends keyof LearningState>(
      key: K,
      fetcher: () => Promise<NonNullable<LearningState[K]["data"]>>,
    ) {
      try {
        const data = await fetcher();
        if (version === sequence.current)
          setState((previous) => ({
            ...previous,
            [key]: { data, loading: false, error: null },
          }));
      } catch (error) {
        if (version === sequence.current && !abort.signal.aborted)
          setState((previous) => ({
            ...previous,
            [key]: {
              data: null,
              loading: false,
              error:
                error instanceof Error
                  ? error
                  : new Error("Không thể tải dữ liệu."),
            },
          }));
      }
    }
    void load("profile", () =>
      getMyStudentProfile(
        AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]),
      ),
    );
    void load("progress", () => gamificationApi.progress(abort.signal));
    void load("GLOBAL", () =>
      gamificationApi.leaderboard("GLOBAL", abort.signal),
    );
    void load("CLASS", () =>
      gamificationApi.leaderboard("CLASS", abort.signal),
    );
  }, []);
  const { pathname } = useLocation();
  useEffect(() => {
    refresh();
    return () => {
      ++sequence.current;
      controller.current?.abort();
    };
  }, [refresh, pathname]);
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("student-profile-updated", refresh);
    window.addEventListener("student-learning-updated", refresh);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("student-profile-updated", refresh);
      window.removeEventListener("student-learning-updated", refresh);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  return (
    <Context.Provider value={{ ...state, refresh }}>
      {children}
    </Context.Provider>
  );
}
export function useStudentLearning() {
  const context = useContext(Context);
  if (!context) throw new Error("StudentLearningProvider is required");
  return context;
}
