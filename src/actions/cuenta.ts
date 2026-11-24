"use server";

import { eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db, schema } from "@/db";
import { cerrarSesion, esAdmin, requerirUsuario } from "@/lib/auth";
import { PALABRA_BORRAR } from "@/lib/cuenta";

export type EstadoBorrado = { error?: string };

/**
 * Borra la cuenta y saca a la persona de los intercambios en los que está.
 *
 * Lo de sacarla es a propósito y no cae solo: al borrar la cuenta, el renglón
 * de invitado se queda apuntando a null (así está la llave foránea) pero
 * conserva el correo, y como un evento es tuyo si coincide la cuenta **o el
 * correo**, volvería a aparecer entero en cuanto esa persona se registrara otra
 * vez. Borrar la cuenta y seguir dentro del intercambio sería mentir.
 *
 * Lo que se va con los renglones de invitado: sus listas de deseos, lo que
 * tenía apartado, sus cartas y su lugar en el sorteo (todo cuelga de ahí por
 * cascada).
 */
export async function borrarCuentaAccion(
  _previo: EstadoBorrado,
  datos: FormData,
): Promise<EstadoBorrado> {
  const usuario = await requerirUsuario();

  // Una cuenta del panel no se borra desde el perfil. Se iría la cuenta pero el
  // correo seguiría en ADMIN_EMAILS, así que volvería a ser admin en cuanto
  // entrara otra vez: borrarla no quita el acceso, nomás hace ruido. El botón
  // tampoco se pinta, pero la acción es la que manda.
  if (esAdmin(usuario)) {
    return {
      error:
        "Esta cuenta tiene acceso al panel. Para borrarla, primero quita su correo de ADMIN_EMAILS.",
    };
  }

  const confirmacion = String(datos.get("confirmacion") ?? "")
    .trim()
    .toUpperCase();

  if (confirmacion !== PALABRA_BORRAR) {
    return { error: `Escribe ${PALABRA_BORRAR} para confirmar.` };
  }

  // Quien organiza no se puede borrar así nomás: el evento cuelga de su cuenta
  // y se iría con ella, llevándose las listas, el sorteo y las cartas de todos
  // los demás. Que borre sus eventos primero, a conciencia y uno por uno.
  const organiza = await db
    .select({ id: schema.events.id })
    .from(schema.events)
    .where(eq(schema.events.organizerId, usuario.id))
    .limit(1);

  if (organiza.length > 0) {
    return {
      error:
        "Todavía organizas un intercambio. Bórralo desde Mis eventos y luego regresa aquí.",
    };
  }

  // Por cuenta y por correo: hay renglones que nunca se amarraron a la cuenta
  // porque los crearon después de su último acceso.
  await db
    .delete(schema.participants)
    .where(
      or(
        eq(schema.participants.userId, usuario.id),
        eq(schema.participants.email, usuario.email),
      ),
    );

  // Los enlaces pendientes de ese correo dejan de servir en el mismo momento.
  await db
    .delete(schema.loginTokens)
    .where(eq(schema.loginTokens.email, usuario.email));

  await db.delete(schema.users).where(eq(schema.users.id, usuario.id));

  await cerrarSesion();
  redirect("/");
}
