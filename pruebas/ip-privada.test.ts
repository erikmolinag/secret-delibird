/**
 * El filtro que evita que el servidor visite la red interna (SSRF).
 *
 * Cualquier invitado puede pegar un enlace en su lista y el servidor lo abre
 * para sacarle la foto y el título. Si el filtro falla, ese enlace puede
 * apuntar a la metadata de la nube y sacarle credenciales al servidor.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { esIpPrivada } from "../src/lib/og.ts";

describe("direcciones que no se deben visitar", () => {
  it("los rangos privados de siempre", () => {
    for (const ip of [
      "10.0.0.1",
      "127.0.0.1",
      "0.0.0.0",
      "192.168.1.1",
      "172.16.0.1",
      "172.31.255.255",
      "100.64.0.1", // CGNAT
    ]) {
      assert.equal(esIpPrivada(ip), true, ip);
    }
  });

  it("la metadata de la nube, que es la joya", () => {
    assert.equal(esIpPrivada("169.254.169.254"), true);
  });

  it("las internas de IPv6", () => {
    for (const ip of ["::1", "::", "fc00::1", "fd12::1", "fe80::1"]) {
      assert.equal(esIpPrivada(ip), true, ip);
    }
  });
});

describe("IPv4 disfrazada de IPv6", () => {
  /*
   * Esto no es teoría: quien quiera entrar solo tiene que publicar un registro
   * AAAA con una de estas en su propio dominio. La consulta de DNS la devuelve
   * tal cual, como IPv6, y si el filtro solo compara prefijos de texto, pasa.
   */
  it("la forma punteada", () => {
    for (const ip of [
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "::ffff:192.168.1.1",
      "::ffff:172.16.0.1",
      "::ffff:169.254.169.254",
      "::192.168.1.1",
    ]) {
      assert.equal(esIpPrivada(ip), true, ip);
    }
  });

  it("la misma, escrita en hexadecimal", () => {
    // c0a8:0101 es 192.168.1.1 y a9fe:a9fe es 169.254.169.254
    assert.equal(esIpPrivada("::ffff:c0a8:101"), true);
    assert.equal(esIpPrivada("::ffff:a9fe:a9fe"), true);
    assert.equal(esIpPrivada("::ffff:7f00:1"), true); // 127.0.0.1
  });

  it("no se pasa de lista con las de afuera", () => {
    // 8.8.8.8 disfrazada sigue siendo pública.
    assert.equal(esIpPrivada("::ffff:8.8.8.8"), false);
    assert.equal(esIpPrivada("::ffff:808:808"), false);
  });
});

describe("direcciones de internet normales", () => {
  it("se dejan pasar", () => {
    for (const ip of [
      "8.8.8.8",
      "1.1.1.1",
      "172.15.0.1", // justo antes del rango privado
      "172.32.0.1", // justo después
      "2606:4700::1111",
    ]) {
      assert.equal(esIpPrivada(ip), false, ip);
    }
  });
});
