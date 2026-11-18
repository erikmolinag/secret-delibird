/**
 * Motor del sorteo. No sabe nada de la base de datos ni de React: entran
 * jugadores y reglas, sale una asignación o una explicación de por qué no se puede.
 *
 * El problema es un emparejamiento perfecto en un grafo bipartito (quien da ->
 * quien recibe). Para decir "no se puede" con argumentos usamos el teorema de
 * Hall: si un grupo de N personas solo puede regalarle a menos de N, no hay sorteo.
 */

export type JugadorSorteo = { id: string; nombre: string };

export type ReglaSorteo = {
  tipo: "exclude" | "whitelist" | "pin";
  from: string;
  to: string;
  bidireccional: boolean;
};

export type OpcionesSorteo = { evitarMutuos: boolean };

export type Dominios = Map<string, Set<string>>;

export type Problema = {
  motivo: string;
  afectados: string[];
};

export type Analisis =
  | { ok: true; dominios: Dominios }
  | { ok: false; problemas: Problema[] };

export type ResultadoSorteo =
  | { ok: true; parejas: { giver: string; receiver: string }[] }
  | { ok: false; problemas: Problema[] };

const MAX_PASOS = 200_000;

function nombresDe(ids: Iterable<string>, jugadores: JugadorSorteo[]) {
  const porId = new Map(jugadores.map((j) => [j.id, j.nombre]));
  return [...ids].map((id) => porId.get(id) ?? "alguien");
}

function enumerar(nombres: string[]) {
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

/** Quién le puede regalar a quién, ya aplicadas todas las reglas. */
export function construirDominios(
  jugadores: JugadorSorteo[],
  reglas: ReglaSorteo[],
): Dominios {
  const ids = jugadores.map((j) => j.id);
  const vivos = new Set(ids);

  const dominios: Dominios = new Map(
    ids.map((id) => [id, new Set(ids.filter((otro) => otro !== id))]),
  );

  // Lista blanca: si alguien la tiene, solo puede regalarle a esa gente.
  const listasBlancas = new Map<string, Set<string>>();
  for (const regla of reglas) {
    if (regla.tipo !== "whitelist" || !vivos.has(regla.from)) continue;
    if (!listasBlancas.has(regla.from)) listasBlancas.set(regla.from, new Set());
    if (vivos.has(regla.to)) listasBlancas.get(regla.from)!.add(regla.to);
  }
  for (const [from, permitidos] of listasBlancas) {
    const dominio = dominios.get(from);
    if (!dominio) continue;
    for (const candidato of [...dominio]) {
      if (!permitidos.has(candidato)) dominio.delete(candidato);
    }
  }

  // Exclusiones.
  for (const regla of reglas) {
    if (regla.tipo !== "exclude") continue;
    dominios.get(regla.from)?.delete(regla.to);
    if (regla.bidireccional) dominios.get(regla.to)?.delete(regla.from);
  }

  // Pines: quedan fijos y bloquean a esa persona para los demás.
  for (const regla of reglas) {
    if (regla.tipo !== "pin" || !vivos.has(regla.from) || !vivos.has(regla.to)) {
      continue;
    }
    for (const [id, dominio] of dominios) {
      if (id !== regla.from) dominio.delete(regla.to);
    }
    const dominio = dominios.get(regla.from);
    if (dominio) {
      const valido = dominio.has(regla.to);
      dominio.clear();
      if (valido) dominio.add(regla.to);
    }
  }

  return dominios;
}

/** Emparejamiento máximo (algoritmo de Kuhn). Devuelve receptor -> quien le da. */
function emparejarMaximo(ids: string[], dominios: Dominios) {
  const pareja = new Map<string, string>();

  const aumentar = (giver: string, visitados: Set<string>): boolean => {
    for (const receptor of dominios.get(giver) ?? []) {
      if (visitados.has(receptor)) continue;
      visitados.add(receptor);
      const actual = pareja.get(receptor);
      if (actual === undefined || aumentar(actual, visitados)) {
        pareja.set(receptor, giver);
        return true;
      }
    }
    return false;
  };

  for (const giver of ids) aumentar(giver, new Set());
  return pareja;
}

/** El grupo que rompe la condición de Hall: N personas con menos de N opciones. */
function grupoAtorado(ids: string[], dominios: Dominios, pareja: Map<string, string>) {
  const receptorDe = new Map([...pareja].map(([r, g]) => [g, r]));
  const sinPareja = ids.find((giver) => !receptorDe.has(giver));
  if (!sinPareja) return null;

  const grupo = new Set<string>();
  const alcanzables = new Set<string>();
  const pila = [sinPareja];

  while (pila.length) {
    const giver = pila.pop()!;
    if (grupo.has(giver)) continue;
    grupo.add(giver);

    for (const receptor of dominios.get(giver) ?? []) {
      if (alcanzables.has(receptor)) continue;
      alcanzables.add(receptor);
      const otro = pareja.get(receptor);
      if (otro) pila.push(otro);
    }
  }

  return { grupo: [...grupo], alcanzables: [...alcanzables] };
}

/** Revisa las reglas y dice si el sorteo es posible, con explicación si no. */
export function analizar(
  jugadores: JugadorSorteo[],
  reglas: ReglaSorteo[],
): Analisis {
  const problemas: Problema[] = [];

  if (jugadores.length < 2) {
    return {
      ok: false,
      problemas: [
        {
          motivo: "Hacen falta al menos dos personas jugando para sortear.",
          afectados: [],
        },
      ],
    };
  }

  // Pines contradictorios: antes de que se vuelvan un dominio vacío sin contexto.
  const pines = reglas.filter((r) => r.tipo === "pin");
  const porQuienDa = new Map<string, string[]>();
  const porQuienRecibe = new Map<string, string[]>();
  for (const pin of pines) {
    porQuienDa.set(pin.from, [...(porQuienDa.get(pin.from) ?? []), pin.to]);
    porQuienRecibe.set(pin.to, [...(porQuienRecibe.get(pin.to) ?? []), pin.from]);
  }
  for (const [from, destinos] of porQuienDa) {
    if (destinos.length > 1) {
      problemas.push({
        motivo: `${enumerar(nombresDe([from], jugadores))} tiene dos asignaciones fijas al mismo tiempo. Deja solo una.`,
        afectados: [from],
      });
    }
  }
  for (const [to, origenes] of porQuienRecibe) {
    if (origenes.length > 1) {
      problemas.push({
        motivo: `A ${enumerar(nombresDe([to], jugadores))} le regalan dos personas distintas por asignación fija. Deja solo una.`,
        afectados: origenes,
      });
    }
  }
  if (problemas.length) return { ok: false, problemas };

  const dominios = construirDominios(jugadores, reglas);
  const ids = jugadores.map((j) => j.id);

  // Alguien sin ninguna opción.
  const vacios = ids.filter((id) => (dominios.get(id)?.size ?? 0) === 0);
  if (vacios.length) {
    return {
      ok: false,
      problemas: vacios.map((id) => ({
        motivo: `${enumerar(nombresDe([id], jugadores))} se quedó sin nadie a quien regalarle. Revisa sus exclusiones y su lista blanca.`,
        afectados: [id],
      })),
    };
  }

  // Alguien a quien nadie le puede regalar.
  const recibenDeAlguien = new Set<string>();
  for (const dominio of dominios.values()) {
    for (const receptor of dominio) recibenDeAlguien.add(receptor);
  }
  const nadieLesDa = ids.filter((id) => !recibenDeAlguien.has(id));
  if (nadieLesDa.length) {
    return {
      ok: false,
      problemas: nadieLesDa.map((id) => ({
        motivo: `Nadie puede regalarle a ${enumerar(nombresDe([id], jugadores))}. Alguien tiene que poder.`,
        afectados: [id],
      })),
    };
  }

  const pareja = emparejarMaximo(ids, dominios);
  if (pareja.size < ids.length) {
    const atorado = grupoAtorado(ids, dominios, pareja);
    if (atorado) {
      const quienes = enumerar(nombresDe(atorado.grupo, jugadores));
      const opciones = enumerar(nombresDe(atorado.alcanzables, jugadores));
      return {
        ok: false,
        problemas: [
          {
            motivo:
              atorado.alcanzables.length === 0
                ? `${quienes} no tiene a quien regalarle con estas reglas.`
                : `${quienes} (${atorado.grupo.length} personas) solo pueden regalarle a ${opciones} (${atorado.alcanzables.length}). No alcanza: afloja alguna regla.`,
            afectados: atorado.grupo,
          },
        ],
      };
    }
    return {
      ok: false,
      problemas: [
        { motivo: "Con estas reglas no hay sorteo posible.", afectados: [] },
      ],
    };
  }

  return { ok: true, dominios };
}

/**
 * Busca una asignación al azar que cumpla todo. Backtracking con MRV:
 * primero quien tenga menos opciones, que es donde se rompe antes.
 */
export function sortear(
  jugadores: JugadorSorteo[],
  reglas: ReglaSorteo[],
  opciones: OpcionesSorteo,
  azar: () => number = Math.random,
): ResultadoSorteo {
  const analisis = analizar(jugadores, reglas);
  if (!analisis.ok) return { ok: false, problemas: analisis.problemas };

  const { dominios } = analisis;
  const ids = jugadores.map((j) => j.id);

  const asignado = new Map<string, string>(); // quien da -> quien recibe
  const tomados = new Set<string>();
  let pasos = 0;

  const mezclar = <T,>(lista: T[]) => {
    const copia = [...lista];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(azar() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  };

  const opcionesDe = (giver: string) =>
    [...(dominios.get(giver) ?? [])].filter((receptor) => {
      if (tomados.has(receptor)) return false;
      // Evitar que A le dé a B y B a A.
      if (opciones.evitarMutuos && asignado.get(receptor) === giver) return false;
      return true;
    });

  const resolver = (): boolean => {
    if (asignado.size === ids.length) return true;
    if (++pasos > MAX_PASOS) return false;

    let elegido: string | null = null;
    let mejores: string[] = [];

    for (const giver of ids) {
      if (asignado.has(giver)) continue;
      const disponibles = opcionesDe(giver);
      if (disponibles.length === 0) return false;
      if (elegido === null || disponibles.length < mejores.length) {
        elegido = giver;
        mejores = disponibles;
        if (disponibles.length === 1) break;
      }
    }

    if (elegido === null) return true;

    for (const receptor of mezclar(mejores)) {
      asignado.set(elegido, receptor);
      tomados.add(receptor);
      if (resolver()) return true;
      asignado.delete(elegido);
      tomados.delete(receptor);
    }

    return false;
  };

  if (!resolver()) {
    return {
      ok: false,
      problemas: [
        {
          motivo: opciones.evitarMutuos
            ? "No se puede evitar que haya parejas mutuas con estas reglas. Desactiva esa opción o afloja alguna regla."
            : "Con estas reglas no hay sorteo posible.",
          afectados: [],
        },
      ],
    };
  }

  return {
    ok: true,
    parejas: [...asignado].map(([giver, receiver]) => ({ giver, receiver })),
  };
}
