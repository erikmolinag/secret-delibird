import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

import { db, schema } from "@/db";
import { usuarioActual } from "@/lib/auth";

/**
 * Sirve la miniatura que se subió para un regalo. Pide sesión: el id del regalo
 * es un uuid, pero no hay razón para servir fotos a quien no ha entrado.
 */
export async function GET(
  _peticion: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const usuario = await usuarioActual();
  if (!usuario) return new NextResponse(null, { status: 401 });

  const { itemId } = await params;

  const [imagen] = await db
    .select({
      mime: schema.wishlistImages.mime,
      datos: schema.wishlistImages.datos,
    })
    .from(schema.wishlistImages)
    .where(eq(schema.wishlistImages.itemId, itemId))
    .limit(1);

  if (!imagen) return new NextResponse(null, { status: 404 });

  const bytes = Buffer.from(imagen.datos, "base64");

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "content-type": imagen.mime,
      "content-length": String(bytes.length),
      // La URL lleva versión, así que la foto se puede cachear sin miedo.
      "cache-control": "private, max-age=31536000, immutable",
    },
  });
}
