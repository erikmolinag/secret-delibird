import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { partirInline, partirTextoRico } from "../src/lib/texto-rico.ts";

describe("separar en bloques", () => {
  it("un título, una lista y un párrafo", () => {
    const bloques = partirTextoRico(
      "## Qué guardamos\n\n- Tu correo\n- Tu nombre\n\nY nada más.",
    );

    assert.equal(bloques.length, 3);
    assert.equal(bloques[0].tipo, "titulo");
    assert.equal(bloques[1].tipo, "lista");
    assert.equal(bloques[2].tipo, "parrafo");
  });

  it("junta las líneas sueltas de un mismo párrafo", () => {
    const [bloque] = partirTextoRico("Una idea\npartida en dos.");

    assert.equal(bloque.tipo, "parrafo");
    assert.deepEqual(bloque.tipo === "parrafo" ? bloque.trozos : [], [
      { tipo: "texto", texto: "Una idea partida en dos." },
    ]);
  });

  it("aguanta los saltos de un textarea, que vienen con \\r\\n", () => {
    // Este era el bug: con \r en medio no había dos \n seguidos, no se partía
    // nada y el documento entero salía como un solo bloque.
    const bloques = partirTextoRico("## Título\r\n\r\nUn párrafo.\r\n\r\n- Uno\r\n- Dos");

    assert.equal(bloques.length, 3);
    assert.equal(bloques[0].tipo, "titulo");
    assert.equal(bloques[2].tipo, "lista");
    assert.equal(bloques[2].tipo === "lista" ? bloques[2].puntos.length : 0, 2);
  });

  it("distingue los dos tamaños de título", () => {
    const bloques = partirTextoRico("## Grande\n\n### Chico");

    assert.equal(bloques[0].tipo === "titulo" ? bloques[0].nivel : 0, 2);
    assert.equal(bloques[1].tipo === "titulo" ? bloques[1].nivel : 0, 3);
  });

  it("una lista a medias es un párrafo, no una lista rota", () => {
    const [bloque] = partirTextoRico("- Uno\nesto no es viñeta");
    assert.equal(bloque.tipo, "parrafo");
  });
});

describe("formato dentro de la línea", () => {
  it("negritas y cursivas", () => {
    assert.deepEqual(partirInline("Hola **mundo** y *luego* no"), [
      { tipo: "texto", texto: "Hola " },
      { tipo: "negritas", texto: "mundo" },
      { tipo: "texto", texto: " y " },
      { tipo: "cursivas", texto: "luego" },
      { tipo: "texto", texto: " no" },
    ]);
  });

  it("las negritas le ganan a las cursivas", () => {
    assert.deepEqual(partirInline("**dos asteriscos**"), [
      { tipo: "negritas", texto: "dos asteriscos" },
    ]);
  });

  it("un enlace de web", () => {
    assert.deepEqual(partirInline("Ve a [mi sitio](https://delibird.app) hoy"), [
      { tipo: "texto", texto: "Ve a " },
      { tipo: "enlace", texto: "mi sitio", url: "https://delibird.app" },
      { tipo: "texto", texto: " hoy" },
    ]);
  });

  it("un enlace que no es de web se queda como texto", () => {
    // Esto se pinta en una página pública: nada de javascript: ni data:.
    for (const malo of [
      "[pícale](javascript:alert(1))",
      "[pícale](data:text/html,hola)",
      "[pícale](ftp://ajeno.com)",
    ]) {
      const trozos = partirInline(malo);

      assert.ok(
        trozos.every((t) => t.tipo === "texto"),
        `${malo} no debió volverse enlace`,
      );
      // Y lo que escribió la persona se ve completo, sin comerse nada.
      assert.equal(trozos.map((t) => t.texto).join(""), malo);
    }
  });

  it("un asterisco suelto no rompe nada", () => {
    assert.deepEqual(partirInline("2 * 3 = 6"), [
      { tipo: "texto", texto: "2 * 3 = 6" },
    ]);
  });

  it("el HTML escrito a mano es texto y nada más", () => {
    assert.deepEqual(partirInline("<b>no</b>"), [
      { tipo: "texto", texto: "<b>no</b>" },
    ]);
  });
});
