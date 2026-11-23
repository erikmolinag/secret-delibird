import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  codigoAmazonValido,
  conReferidoDeAmazon,
  esEnlaceDeAmazon,
} from "../src/lib/amazon.ts";

const NUESTRA = "erks-20";
const con = (url: string) => conReferidoDeAmazon(url, NUESTRA);

describe("reconocer enlaces de Amazon", () => {
  it("acepta las tiendas de cada país", () => {
    for (const host of [
      "https://www.amazon.com.mx/dp/B00U26V4VQ",
      "https://amazon.com/dp/B00U26V4VQ",
      "https://www.amazon.es/dp/B00U26V4VQ",
      "https://www.amazon.co.uk/dp/B00U26V4VQ",
    ]) {
      assert.equal(esEnlaceDeAmazon(host), true, host);
    }
  });

  it("acepta las ligas cortas", () => {
    assert.equal(esEnlaceDeAmazon("https://a.co/d/9xKpQ2z"), true);
    assert.equal(esEnlaceDeAmazon("https://amzn.to/3abcDEF"), true);
  });

  it("no se confunde con otras tiendas", () => {
    for (const url of [
      "https://www.mercadolibre.com.mx/p/MLM123",
      "https://amazonas.com/dp/B00U26V4VQ",
      "https://noamazon.com.mx/dp/B00U26V4VQ",
      "no soy una direccion",
    ]) {
      assert.equal(esEnlaceDeAmazon(url), false, url);
    }
  });
});

describe("poner nuestro código", () => {
  it("deja el enlace en /dp/ASIN y nada más", () => {
    assert.equal(
      con("https://www.amazon.com.mx/Juego-Mesa-CATAN/dp/B00U26V4VQ/ref=sr_1_3?crid=XYZ&qid=1764"),
      "https://www.amazon.com.mx/dp/B00U26V4VQ?tag=erks-20",
    );
  });

  it("gana sobre el código de alguien más", () => {
    assert.equal(
      con("https://www.amazon.com.mx/dp/B00U26V4VQ?tag=otro-21&linkCode=ll1"),
      "https://www.amazon.com.mx/dp/B00U26V4VQ?tag=erks-20",
    );
  });

  it("respeta la tienda del país que venía", () => {
    assert.equal(
      con("https://www.amazon.es/dp/B00U26V4VQ"),
      "https://www.amazon.es/dp/B00U26V4VQ?tag=erks-20",
    );
  });

  it("entiende las otras formas de enlazar un producto", () => {
    for (const url of [
      "https://www.amazon.com.mx/gp/product/B00U26V4VQ",
      "https://www.amazon.com.mx/gp/aw/d/B00U26V4VQ",
      "https://www.amazon.com.mx/-/es/dp/B00U26V4VQ",
    ]) {
      assert.equal(con(url), "https://www.amazon.com.mx/dp/B00U26V4VQ?tag=erks-20", url);
    }
  });

  it("en una búsqueda conserva lo que se buscó y tira el seguimiento", () => {
    const salida = new URL(
      con("https://www.amazon.com.mx/s?k=audifonos&crid=ABC&sprefix=audi&ref=nb_sb"),
    );
    assert.equal(salida.pathname, "/s");
    assert.equal(salida.searchParams.get("k"), "audifonos");
    assert.equal(salida.searchParams.get("tag"), "erks-20");
    assert.equal(salida.searchParams.get("crid"), null);
    assert.equal(salida.searchParams.get("ref"), null);
  });

  it("a una liga corta le quita todo y le cuelga el código", () => {
    assert.equal(
      con("https://a.co/d/9xKpQ2z?ref_=cm_sw_r&tag=otro-21"),
      "https://a.co/d/9xKpQ2z?tag=erks-20",
    );
  });

  it("no toca lo que no es de Amazon", () => {
    const otra = "https://www.mercadolibre.com.mx/p/MLM123?tag=otro-21";
    assert.equal(con(otra), otra);
  });

  it("sin código configurado no cambia nada", () => {
    const url = "https://www.amazon.com.mx/dp/B00U26V4VQ?tag=otro-21";
    assert.equal(conReferidoDeAmazon(url, null), url);
    assert.equal(conReferidoDeAmazon(url, ""), url);
  });

  it("una dirección rota se regresa tal cual, sin tronar", () => {
    assert.equal(con("esto no es una url"), "esto no es una url");
    assert.equal(con("javascript:alert(1)"), "javascript:alert(1)");
  });
});

describe("validar el código de afiliado", () => {
  it("acepta los que se ven como de Amazon", () => {
    for (const bueno of ["erks-20", "midominio-21", "abc123", "mi_tienda-20"]) {
      assert.equal(codigoAmazonValido(bueno), true, bueno);
    }
  });

  it("rechaza lo que no cabe en una URL o no es un código", () => {
    for (const malo of [
      "",
      "a",
      "con espacio-20",
      "https://amazon.com?tag=x",
      "tag=erks-20",
      "-empieza-mal",
      "acaba-mal-",
      "a".repeat(60),
    ]) {
      assert.equal(codigoAmazonValido(malo), false, JSON.stringify(malo));
    }
  });
});
