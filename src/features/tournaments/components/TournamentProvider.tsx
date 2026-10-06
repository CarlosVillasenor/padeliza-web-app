"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Tournament,
  TournamentError,
  TournamentInput,
} from "../types/tournament";
import {
  decodeTournaments,
  encodeTournaments,
  STORAGE_KEY,
} from "../lib/storage";
import { validateTournament } from "../lib/rules";

type State = {
  tournaments: Tournament[];
  ready: boolean;
  error: TournamentError | null;
};
type Action =
  | { type: "loaded"; tournaments: Tournament[] }
  | { type: "failed"; error: TournamentError };
function reducer(state: State, action: Action): State {
  if (action.type === "loaded")
    return { tournaments: action.tournaments, ready: true, error: null };
  return { ...state, ready: true, error: action.error };
}
const TournamentContext = createContext<
  | (State & {
      createTournament: (
        input: TournamentInput,
        id: string,
      ) => TournamentError | null;
      reload: () => void;
    })
  | null
>(null);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    tournaments: [],
    ready: false,
    error: null,
  });
  function reload() {
    try {
      dispatch({
        type: "loaded",
        tournaments: decodeTournaments(localStorage.getItem(STORAGE_KEY)),
      });
    } catch {
      dispatch({
        type: "failed",
        error: "storageUnavailable",
      });
    }
  }
  useEffect(() => {
    reload();
    function sync(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) reload();
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  function createTournament(
    input: TournamentInput,
    id: string,
  ): TournamentError | null {
    const error = validateTournament(input);
    if (error) return error;
    if (!state.ready || state.error) return "storageNotReady";
    try {
      // Read again before writing to include changes made in another tab.
      const current = decodeTournaments(localStorage.getItem(STORAGE_KEY));
      if (current.some((t) => t.id === id)) return null;
      const tournament: Tournament = {
        ...input,
        name: input.name.trim(),
        id,
        createdAt: new Date().toISOString(),
        status: "scheduled",
      };
      const tournaments = [tournament, ...current];
      localStorage.setItem(STORAGE_KEY, encodeTournaments(tournaments));
      dispatch({ type: "loaded", tournaments });
      return null;
    } catch {
      return "saveFailed";
    }
  }
  return (
    <TournamentContext.Provider value={{ ...state, createTournament, reload }}>
      {children}
    </TournamentContext.Provider>
  );
}
export function useTournaments() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error("TournamentProvider is required");
  return context;
}
