/**
 * El envío de correo, con los dos proveedores de mentiras.
 *
 * Esto se prueba porque el acceso a la app es un correo: si el proveedor se cae
 * —y ya pasó: Plunk contestó 500 a todo durante horas— nadie puede entrar. Lo
 * que se revisa aquí es que haya a dónde caerse y que no se le pegue al segundo
 * proveedor cuando el primero sí mandó.
 *
 * No sale a internet: los dos proveedores son servidores locales. Plunk se
 * apunta con PLUNK_API_URL y Resend con RESEND_BASE_URL, que su SDK respeta.
 */

import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { after, beforeEach, describe, it } from "node:test";

import { remitenteValido } from "../src/lib/proveedores.ts";

type Falso = Awaited<ReturnType<typeof levantarFalso>>;

/** Un proveedor de mentiras: contesta lo que le digan y guarda lo que recibió. */
async function levantarFalso() {
  const recibidos: { cuerpo: Record<string, unknown>; auth?: string }[] = [];
  let contesta: { estado: number; json: unknown } = {
    estado: 200,
    json: { success: true, id: "id-de-prueba" },
  };

  const servidor = createServer((peticion, respuesta) => {
    let crudo = "";
    peticion.on("data", (trozo) => (crudo += trozo));
    peticion.on("end", () => {
      recibidos.push({
        cuerpo: crudo ? JSON.parse(crudo) : {},
        auth: peticion.headers.authorization,
      });
      respuesta.writeHead(contesta.estado, {
        "Content-Type": "application/json",
      });
      respuesta.end(JSON.stringify(contesta.json));
    });
  });

  await new Promise<void>((listo) => servidor.listen(0, "127.0.0.1", listo));
  const { port } = servidor.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    recibidos,
    /** Lo que va a contestar de aquí en adelante. */
    contestar(estado: number, json: unknown) {
      contesta = { estado, json };
    },
    olvidar() {
      recibidos.length = 0;
      contesta = { estado: 200, json: { success: true, id: "id-de-prueba" } };
    },
    cerrar: () => new Promise<void>((listo) => servidor.close(() => listo())),
  };
}

const plunk: Falso = await levantarFalso();
const resend: Falso = await levantarFalso();

process.env.RESEND_BASE_URL = resend.url;

const { enviarCorreo } = await import("../src/lib/mail.ts");

after(async () => {
  await Promise.all([plunk.cerrar(), resend.cerrar()]);
});

const CORREO = {
  to: "quien@example.com",
  subject: "Tu acceso a Secret Delibird",
  html: "<p>Entra</p>",
  text: "Entra",
};

beforeEach(() => {
  plunk.olvidar();
  resend.olvidar();
  process.env.PLUNK_API_URL = `${plunk.url}/v1/send`;
  process.env.PLUNK_API_KEY = "sk_de_prueba";
  process.env.RESEND_API_KEY = "re_de_prueba";
  process.env.EMAIL_FROM = "Secret Delibird <comun@delibird.app>";
  delete process.env.EMAIL_FROM_PLUNK;
  delete process.env.EMAIL_FROM_RESEND;
  delete process.env.EMAIL_PRIMERO;
  delete process.env.DATABASE_URL;
});

describe("a quién le toca mandar el correo", () => {
  it("manda con el primero y no molesta al segundo", async () => {
    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: true });
    assert.equal(plunk.recibidos.length, 1);
    assert.equal(resend.recibidos.length, 0, "no debió tocar al segundo");
    assert.equal(plunk.recibidos[0].auth, "Bearer sk_de_prueba");
  });

  it("si el primero está caído, se cae al segundo", async () => {
    plunk.contestar(500, {
      success: false,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An error occurred" },
    });

    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: true }, "el correo tenía que salir");
    assert.equal(resend.recibidos.length, 1);
    assert.equal(resend.recibidos[0].cuerpo.subject, CORREO.subject);
  });

  it("también se cae si el primero no contesta nada", async () => {
    // Puerto donde no hay nadie: la conexión se rechaza de inmediato.
    process.env.PLUNK_API_URL = "http://127.0.0.1:1/v1/send";

    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: true });
    assert.equal(plunk.recibidos.length, 0);
    assert.equal(resend.recibidos.length, 1);
  });

  it("si el correo va mal armado, no se lo pasa al otro", async () => {
    // Un 422 es "esta dirección no existe": el segundo diría lo mismo.
    plunk.contestar(422, { error: { message: "Invalid recipient" } });

    const salida = await enviarCorreo(CORREO);

    assert.equal(salida.enviado, false);
    assert.equal(resend.recibidos.length, 0, "no tenía por qué reintentar");
    assert.match(salida.enviado === false ? salida.motivo : "", /422/);
  });

  it("si los dos fallan, el motivo nombra a los dos", async () => {
    plunk.contestar(500, { error: { message: "caido" } });
    resend.contestar(500, {
      statusCode: 500,
      name: "application_error",
      message: "algo pasó",
    });

    const salida = await enviarCorreo(CORREO);

    assert.equal(salida.enviado, false);
    const motivo = salida.enviado === false ? salida.motivo : "";
    assert.match(motivo, /Plunk:/);
    assert.match(motivo, /Resend:/);
  });

  it("sin llaves no manda nada y lo dice", async () => {
    delete process.env.PLUNK_API_KEY;
    delete process.env.RESEND_API_KEY;

    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: false, motivo: "sin-api-key" });
    assert.equal(plunk.recibidos.length, 0);
    assert.equal(resend.recibidos.length, 0);
  });

  it("con una sola llave usa esa y ya", async () => {
    delete process.env.PLUNK_API_KEY;

    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: true });
    assert.equal(plunk.recibidos.length, 0);
    assert.equal(resend.recibidos.length, 1);
  });
});

describe("elegir quién va primero", () => {
  it("con Resend elegido, Plunk ni se entera", async () => {
    process.env.EMAIL_PRIMERO = "resend";

    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: true });
    assert.equal(resend.recibidos.length, 1);
    assert.equal(plunk.recibidos.length, 0, "Plunk ya no es el primero");
  });

  it("el elegido también tiene respaldo, en el otro sentido", async () => {
    process.env.EMAIL_PRIMERO = "resend";
    resend.contestar(500, {
      statusCode: 500,
      name: "application_error",
      message: "caido",
    });

    const salida = await enviarCorreo(CORREO);

    assert.deepEqual(salida, { enviado: true });
    assert.equal(plunk.recibidos.length, 1, "le tocaba a Plunk salvarlo");
  });

  it("una basura en la variable no cambia el orden", async () => {
    process.env.EMAIL_PRIMERO = "mailchimp";

    await enviarCorreo(CORREO);

    assert.equal(plunk.recibidos.length, 1);
  });
});

describe("validar el remitente", () => {
  it("acepta las dos formas de escribirlo", () => {
    for (const bueno of [
      "delibird@delibird.app",
      "Secret Delibird <delibird@email.delibird.app>",
      "<a@b.co>",
    ]) {
      assert.equal(remitenteValido(bueno), true, bueno);
    }
  });

  it("rechaza lo que no es una dirección", () => {
    for (const malo of ["", "delibird", "delibird@", "@delibird.app", "a b@c.com"]) {
      assert.equal(remitenteValido(malo), false, JSON.stringify(malo));
    }
  });

  it("no deja colar cabeceras con un salto de línea", () => {
    // Esto acaba dentro de una cabecera del correo: un \n de más y cualquiera
    // agrega destinatarios que nadie puso.
    for (const malo of [
      "Delibird <a@b.co>\nBcc: otro@ajeno.com",
      "Delibird <a@b.co>\r\nBcc: otro@ajeno.com",
      'Deli"bird <a@b.co>',
    ]) {
      assert.equal(remitenteValido(malo), false, JSON.stringify(malo));
    }
  });
});

describe("de qué dirección sale", () => {
  it("cada proveedor manda desde el dominio que tiene verificado", async () => {
    process.env.EMAIL_FROM_PLUNK = "Secret Delibird <secret@delibird.app>";
    process.env.EMAIL_FROM_RESEND =
      "Secret Delibird <delibird@email.delibird.app>";
    plunk.contestar(500, { error: { message: "caido" } });

    await enviarCorreo(CORREO);

    // Plunk parte el remitente en dirección y nombre.
    assert.equal(plunk.recibidos[0].cuerpo.from, "secret@delibird.app");
    assert.equal(plunk.recibidos[0].cuerpo.name, "Secret Delibird");
    // Si se cayera con el remitente de Plunk, Resend lo rechazaría: su dominio
    // verificado es el otro.
    assert.equal(
      resend.recibidos[0].cuerpo.from,
      "Secret Delibird <delibird@email.delibird.app>",
    );
  });

  it("sin dirección propia, los dos usan EMAIL_FROM", async () => {
    plunk.contestar(500, { error: { message: "caido" } });

    await enviarCorreo(CORREO);

    assert.equal(plunk.recibidos[0].cuerpo.from, "comun@delibird.app");
    assert.equal(
      resend.recibidos[0].cuerpo.from,
      "Secret Delibird <comun@delibird.app>",
    );
  });
});
