import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  analizar,
  sortear,
  type JugadorSorteo,
  type ReglaSorteo,
} from "../src/lib/sorteo.ts";

const gente = (...nombres: string[]): JugadorSorteo[] =>
  nombres.map((n) => ({ id: n.toLowerCase(), nombre: n }));

const CINCO = gente("Erik", "Ana", "Luis", "Mariana", "Jorge");

const excluir = (a: string, b: string, bidireccional = true): ReglaSorteo => ({
  tipo: "exclude",
  from: a,
  to: b,
  bidireccional,
});

const soloA = (a: string, b: string): ReglaSorteo => ({
  tipo: "whitelist",
  from: a,
  to: b,
  bidireccional: false,
});

const fijar = (a: string, b: string): ReglaSorteo => ({
  tipo: "pin",
  from: a,
  to: b,
  bidireccional: false,
});

function assertPermutacion(
  parejas: { giver: string; receiver: string }[],
  jugadores: JugadorSorteo[],
) {
  const ids = jugadores.map((j) => j.id);
  assert.equal(parejas.length, ids.length, "faltan o sobran parejas");
  assert.equal(new Set(parejas.map((p) => p.giver)).size, ids.length, "alguien da dos veces");
  assert.equal(
    new Set(parejas.map((p) => p.receiver)).size,
    ids.length,
    "alguien recibe dos veces",
  );
  for (const p of parejas) {
    assert.notEqual(p.giver, p.receiver, "alguien se regala a sí mismo");
    assert.ok(ids.includes(p.receiver), "receptor fuera del evento");
  }
}

describe("sorteo", () => {
  it("reparte entre cinco sin que nadie se regale a sí mismo", () => {
    const r = sortear(CINCO, [], { evitarMutuos: false });
    assert.ok(r.ok);
    assertPermutacion(r.parejas, CINCO);
  });

  it("respeta una exclusión en las dos direcciones, corrida tras corrida", () => {
    const reglas = [excluir("erik", "ana")];
    for (let i = 0; i < 200; i++) {
      const r = sortear(CINCO, reglas, { evitarMutuos: false });
      assert.ok(r.ok);
      const prohibido = r.parejas.some(
        (p) =>
          (p.giver === "erik" && p.receiver === "ana") ||
          (p.giver === "ana" && p.receiver === "erik"),
      );
      assert.equal(prohibido, false, "se regalaron entre ellos");
    }
  });

  it("respeta la lista blanca", () => {
    const reglas = [soloA("luis", "mariana"), soloA("luis", "jorge")];
    for (let i = 0; i < 50; i++) {
      const r = sortear(CINCO, reglas, { evitarMutuos: false });
      assert.ok(r.ok);
      const luis = r.parejas.find((p) => p.giver === "luis");
      assert.ok(luis && ["mariana", "jorge"].includes(luis.receiver));
    }
  });

  it("respeta una asignación fija y bloquea a esa persona para los demás", () => {
    const r = sortear(CINCO, [fijar("erik", "jorge")], { evitarMutuos: false });
    assert.ok(r.ok);
    assert.ok(r.parejas.some((p) => p.giver === "erik" && p.receiver === "jorge"));
    assert.equal(r.parejas.filter((p) => p.receiver === "jorge").length, 1);
  });

  it("explica con nombres cuando un grupo se queda sin opciones (Hall)", () => {
    const reglas = [
      soloA("erik", "mariana"),
      soloA("erik", "jorge"),
      soloA("ana", "mariana"),
      soloA("ana", "jorge"),
      soloA("luis", "mariana"),
      soloA("luis", "jorge"),
    ];
    const a = analizar(CINCO, reglas);
    assert.equal(a.ok, false);
    if (a.ok) return;
    const motivo = a.problemas[0].motivo;
    assert.match(motivo, /Erik|Ana|Luis/);
    assert.match(motivo, /3 personas/);
  });

  it("avisa cuando alguien se queda sin nadie a quien regalarle", () => {
    const tres = gente("Erik", "Ana", "Luis");
    const a = analizar(tres, [
      excluir("erik", "ana", false),
      excluir("erik", "luis", false),
    ]);
    assert.equal(a.ok, false);
    if (a.ok) return;
    assert.match(a.problemas[0].motivo, /Erik/);
  });

  it("avisa cuando dos asignaciones fijas apuntan a la misma persona", () => {
    const cuatro = gente("Erik", "Ana", "Luis", "Mariana");
    const a = analizar(cuatro, [fijar("erik", "luis"), fijar("ana", "luis")]);
    assert.equal(a.ok, false);
    if (a.ok) return;
    assert.match(a.problemas[0].motivo, /Luis/);
  });

  it("dice que con dos personas no se pueden evitar las parejas mutuas", () => {
    const r = sortear(gente("Erik", "Ana"), [], { evitarMutuos: true });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.match(r.problemas[0].motivo, /mutuas/);
  });

  it("evita parejas mutuas cuando sí se puede", () => {
    const cuatro = gente("Erik", "Ana", "Luis", "Mariana");
    for (let i = 0; i < 100; i++) {
      const r = sortear(cuatro, [], { evitarMutuos: true });
      assert.ok(r.ok);
      const mapa = new Map(r.parejas.map((p) => [p.giver, p.receiver]));
      for (const [giver, receiver] of mapa) {
        assert.notEqual(mapa.get(receiver), giver, "quedó una pareja mutua");
      }
    }
  });

  it("aguanta 60 personas con 15 parejas excluidas", () => {
    const jugadores = gente(...Array.from({ length: 60 }, (_, i) => `P${i}`));
    const reglas: ReglaSorteo[] = [];
    for (let i = 0; i < 30; i += 2) reglas.push(excluir(`p${i}`, `p${i + 1}`));

    const inicio = Date.now();
    const r = sortear(jugadores, reglas, { evitarMutuos: true });
    const ms = Date.now() - inicio;

    assert.ok(r.ok);
    assertPermutacion(r.parejas, jugadores);
    assert.ok(ms < 2000, `tardó ${ms} ms`);
  });

  it("no devuelve siempre la misma solución", () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const r = sortear(CINCO, [], { evitarMutuos: false });
      if (!r.ok) continue;
      vistas.add(
        r.parejas
          .map((p) => `${p.giver}>${p.receiver}`)
          .sort()
          .join("|"),
      );
    }
    assert.ok(vistas.size > 5, `solo salieron ${vistas.size} combinaciones`);
  });
});
