"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Persona } from "@/lib/utils";

const PersonaContext = createContext<{
  persona: Persona;
  setPersona: (p: Persona) => void;
}>({ persona: "IT Leader", setPersona: () => {} });

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>("IT Leader");
  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  return useContext(PersonaContext);
}
