"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { Tournament, TournamentInput } from "../types/tournament";
import {
  decodeTournaments,
  encodeTournaments,
  STORAGE_KEY,
} from "../lib/storage";
import { validateTournament } from "../lib/rules";

type State = {
  tournaments: Tournament[];
  ready: boolean;
  error: string | null;
};
type Action =
  | { type: "loaded"; tournaments: Tournament[] }
  | { type: "failed"; error: string };
function reducer(state: State, action: Action): State {
  if (action.type === "loaded")
    return { tournaments: action.tournaments, ready: true, error: null };
  return { ...state, ready: true, error: action.error };
}
const TournamentContext = createContext<
  | (State & {
      createTournament: (input: TournamentInput, id: string) => string | null;
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
        error:
          "No pudimos leer los torneos guardados. Los datos existentes no se han sobrescrito. Habilita el almacenamiento del navegador y vuelve a intentar.",
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
  function createTournament(input: TournamentInput, id: string): string | null {
    const error = validateTournament(input);
    if (error) return error;
    if (!state.ready || state.error)
      return "Primero debemos recuperar los torneos guardados.";
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
      return "No se pudo guardar el torneo. Revisa el espacio y los permisos del navegador e inténtalo de nuevo. Tu formulario se conserva.";
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
