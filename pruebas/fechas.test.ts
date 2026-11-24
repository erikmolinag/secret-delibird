/**
 * Las fechas de un evento, que son "hora de pared" y no un instante.
 *
 * Esta prueba corre con el reloj puesto en México a propósito. El bug que la
 * motivó solo salía en producción: en la laptop la zona es México y todo
 * cuadraba, pero en Vercel la zona es UTC y el mismo "20:00" se guardaba como
 * otro instante, así que el enlace de Google abría la posada seis horas antes.
 * Si alguien vuelve a leer la fecha con la zona de quien corre, esto truena.
 */

process.env.TZ = "America/Mexico_City";

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { enlaceCalendario } from "../src/lib/enlaces.ts";
import {
  aValorInputFecha,
  formatearFecha,
  parsearFechaLocal,
} from "../src/lib/utils.ts";

const ESCRITO = "2026-12-13T20:00";

describe("la hora que escribió quien organiza", () => {
  it("se guarda igual sin importar la zona de la máquina", () => {
    const fecha = parsearFechaLocal(ESCRITO);

    assert.ok(fecha);
    assert.equal(fecha.toISOString(), "2026-12-13T20:00:00.000Z");
  });

  it("regresa igual al formulario al editar el evento", () => {
    const fecha = parsearFechaLocal(ESCRITO);
    assert.equal(aValorInputFecha(fecha), ESCRITO);
  });

  it("se enseña como se escribió", () => {
    const fecha = parsearFechaLocal(ESCRITO);
    const texto = formatearFecha(fecha) ?? "";

    assert.match(texto, /13 de diciembre de 2026/);
    assert.match(texto, /8:00/);
  });

  it("una fecha vacía no es una fecha", () => {
    assert.equal(parsearFechaLocal(""), null);
    assert.equal(parsearFechaLocal(null), null);
    assert.equal(parsearFechaLocal("no soy una fecha"), null);
  });

  it("si ya trae zona, se respeta", () => {
    const fecha = parsearFechaLocal("2026-12-13T20:00:00Z");
    assert.equal(fecha?.toISOString(), "2026-12-13T20:00:00.000Z");
  });
});

describe("el enlace de Google Calendar", () => {
  it("manda la hora de pared, sin Z", () => {
    const url = enlaceCalendario({
      titulo: "Posada",
      inicio: parsearFechaLocal(ESCRITO),
    });

    const fechas = new URL(url!).searchParams.get("dates");

    // Con la Z, Google lo convertiria a la zona de quien abre y la posada de
    // las 8 saldria a las 2 de la tarde.
    assert.equal(fechas, "20261213T200000/20261213T230000");
    assert.doesNotMatch(fechas!, /Z/);
  });

  it("respeta la duración que se le pida", () => {
    const url = enlaceCalendario({
      titulo: "Posada",
      inicio: parsearFechaLocal(ESCRITO),
      horas: 5,
    });

    assert.match(new URL(url!).searchParams.get("dates")!, /\/20261214T010000$/);
  });

  it("sin fecha no hay enlace", () => {
    assert.equal(enlaceCalendario({ titulo: "Posada", inicio: null }), null);
  });
});
