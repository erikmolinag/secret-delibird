/** Nieve decorativa, discreta. Posiciones fijas para que SSR y cliente coincidan. */

function prng(semilla: number) {
  let a = semilla;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = prng(2512);

const COPOS = Array.from({ length: 28 }, () => ({
  izquierda: random() * 100,
  tamano: 3 + random() * 4,
  duracion: 14 + random() * 16,
  retraso: -random() * 30,
  deriva: -40 + random() * 80,
  opacidad: 0.2 + random() * 0.35,
}));

export function Nieve() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {COPOS.map((copo, i) => (
        <span
          key={i}
          className="copo"
          style={
            {
              left: `${copo.izquierda}%`,
              width: `${copo.tamano}px`,
              height: `${copo.tamano}px`,
              animationDuration: `${copo.duracion}s`,
              animationDelay: `${copo.retraso}s`,
              "--copo-deriva": `${copo.deriva}px`,
              "--copo-opacidad": copo.opacidad,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
