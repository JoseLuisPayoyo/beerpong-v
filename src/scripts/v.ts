// Página de la V (la raíz): la pelota (su entrada botando y el toque para
// lanzarla a otro vaso), la tiza que se escribe sola y, cuando haya fecha, la
// cuenta atrás.
//
// Sin GSAP a propósito: esta página es la puerta de entrada desde el móvil y
// arrancar una coreografía de GSAP sobre el SVG bloqueaba el hilo principal
// justo al cargar. Lo pintado en la mesa y la caída de los vasos son CSS
// (src/styles/v.css); aquí solo queda lo que CSS no sabe hacer: una pelota que
// bota. Sin este script, o con «reducir movimiento», la página se ve entera y
// quieta, con la pelota ya en el vaso de la punta.
import { FECHA_TORNEO } from '../lib/v';

const raiz = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ESCALA = 0.875; // la de los vasos en Vasos.astro

interface Sitio {
  x: number;
  y: number;
  copa: SVGGElement;
  hueco: SVGGElement;
}
interface Vuelo {
  x: number;
  y: number;
  h: number; // altura sobre la mesa
  sombra: number; // 0–1: sobre la mesa hay sombra; saliendo o entrando en un vaso, no
}

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Avanza t de 0 a 1 durante `ms`, un paso por frame.
function animar(ms: number, paso: (t: number) => void): Promise<void> {
  return new Promise((listo) => {
    const t0 = performance.now();
    const frame = (ahora: number) => {
      const t = Math.min(1, (ahora - t0) / ms);
      paso(t);
      if (t < 1) requestAnimationFrame(frame);
      else listo();
    };
    requestAnimationFrame(frame);
  });
}
const entraSale = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));

function vasos(): void {
  const copas = [...document.querySelectorAll<SVGGElement>('.copa')];
  const dentro = document.querySelector<SVGUseElement>('#pelota-dentro'); // la pelota flotando en un vaso
  const vuelo = document.querySelector<SVGGElement>('#vuelo');
  const vueloBola = document.querySelector<SVGUseElement>('#vuelo-bola');
  const vueloSombra = document.querySelector<SVGEllipseElement>('#vuelo-sombra');
  const salpica = document.querySelector<SVGEllipseElement>('#salpica');
  const gotas = document.querySelector<SVGGElement>('#gotas');
  const ventana = document.querySelector<SVGRectElement>('#tiza-ventana');
  if (!copas.length || !dentro || !vuelo || !vueloBola || !vueloSombra || !salpica || !gotas || !ventana) return;

  const sitios: Sitio[] = copas.map((copa) => ({
    x: Number(copa.dataset.x),
    y: Number(copa.dataset.y),
    copa,
    hueco: copa.querySelector<SVGGElement>('.hueco')!,
  }));
  const VERTICE = sitios[sitios.length - 1];
  let dondeEsta: Sitio | null = VERTICE;
  let volando = false;

  // el centro de la boca del vaso, en coordenadas del SVG
  const boca = (p: Sitio) => ({ x: p.x, y: p.y - 3 * ESCALA });

  // la pelota va por el aire; su sombra se queda en la mesa
  function pintarVuelo(st: Vuelo): void {
    vueloBola!.setAttribute('transform', `translate(${st.x} ${st.y - st.h}) scale(${ESCALA})`);
    vueloSombra!.setAttribute(
      'transform',
      `translate(${st.x + st.h * 0.22} ${st.y + 9 + st.h * 0.06}) scale(${Math.max(0.45, 1 - st.h / 260)})`,
    );
    vueloSombra!.setAttribute('opacity', String(st.sombra * Math.max(0.12, 0.4 - st.h / 400)));
  }

  // Un bote: avanza hasta el destino mientras sube (frenando) y cae (acelerando).
  // Con alVaso, la sombra de la mesa se apaga al final: la pelota ya no cae en la mesa.
  function bote(st: Vuelo, destino: { x: number; y: number }, ms: number, altura: number, alVaso = false) {
    const x0 = st.x;
    const y0 = st.y;
    const s0 = st.sombra;
    return animar(ms, (t) => {
      st.x = x0 + (destino.x - x0) * t;
      st.y = y0 + (destino.y - y0) * t;
      const u = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2; // 1 → 0 → 1
      st.h = altura * (1 - u * u);
      if (alVaso) st.sombra = s0 * Math.min(1, (1 - t) / 0.35);
      pintarVuelo(st);
    });
  }

  function meter(p: Sitio): void {
    p.hueco.append(dentro!);
    vuelo!.setAttribute('opacity', '0');
    dondeEsta = p;
  }

  function salpicar(p: Sitio): void {
    const b = boca(p);
    // onda en la cerveza
    salpica!.setAttribute('cx', String(b.x));
    salpica!.setAttribute('cy', String(b.y + 2));
    salpica!.animate(
      [
        { transform: 'scale(0.55)', opacity: 0.95 },
        { transform: 'scale(1.35)', opacity: 0 },
      ],
      { duration: 500, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    );
    // tres gotas que saltan y caen
    gotas!.setAttribute('transform', `translate(${b.x} ${b.y})`);
    gotas!.setAttribute('opacity', '1');
    [...gotas!.children].forEach((g, i) => {
      const dx = [-15, 4, 17][i];
      const alto = 18 + i * 5;
      g.animate(
        [
          { transform: `translate(${dx * 0.3}px, 0)`, opacity: 1, easing: 'ease-out' },
          { transform: `translate(${dx * 0.65}px, ${-alto}px)`, opacity: 1, easing: 'ease-in' },
          { transform: `translate(${dx}px, 0)`, opacity: 0 },
        ],
        { duration: 420, fill: 'forwards' },
      );
    });
    // el vaso acusa el golpe
    p.copa.animate(
      [
        { transform: 'scale(1.04, 0.93)' },
        { transform: 'scale(0.985, 1.03)', offset: 0.3 },
        { transform: 'scale(1.006, 0.99)', offset: 0.6 },
        { transform: 'none' },
      ],
      { duration: 550, easing: 'ease-out' },
    );
  }

  // tocar un vaso: la pelota salta hasta él
  async function tirar(p: Sitio): Promise<void> {
    if (volando || !dondeEsta || p === dondeEsta) return;
    if (reduce) {
      meter(p);
      return;
    }
    volando = true;
    const desde = boca(dondeEsta);
    const st: Vuelo = { x: desde.x, y: desde.y, h: 0, sombra: 0 };
    dentro!.remove();
    pintarVuelo(st);
    vuelo!.setAttribute('opacity', '1');
    await bote(st, boca(p), 460, 62);
    meter(p);
    salpicar(p);
    volando = false;
  }
  sitios.forEach((p) => p.copa.addEventListener('pointerdown', () => void tirar(p)));

  // ---------- entrada ----------
  // Solo si el <head> dejó puesta .anim (sin «reducir movimiento» y sin haber
  // tardado tanto este script que la página ya se mostró quieta).
  if (!raiz.classList.contains('anim')) return;

  void (async () => {
    dondeEsta = null; // la pelota todavía no ha llegado: no se puede lanzar
    dentro.remove();
    const anchoTiza = Number(ventana.getAttribute('width'));
    ventana.setAttribute('width', '0');

    // 1. caen los vasos, fila a fila (CSS: empieza al poner .lista)
    raiz.classList.add('lista');

    // 2. la pelota entra botando desde nuestro lado y cae en el vaso de la punta
    await espera(240);
    const st: Vuelo = { x: 164, y: 730, h: 0, sombra: 1 };
    pintarVuelo(st);
    vuelo.setAttribute('opacity', '1');
    await bote(st, { x: 174, y: 430 }, 360, 74);
    await bote(st, boca(VERTICE), 380, 118, true);
    meter(VERTICE);
    salpicar(VERTICE);

    // 3. alguien escribe a tiza: «edición» junto a la V y «fecha por confirmar»
    void animar(550, (t) => ventana.setAttribute('width', String(anchoTiza * entraSale(t))));
    await espera(400);
    raiz.classList.add('escrito');
  })();
}

// ---------- cuenta atrás (solo existe en la página con la fecha confirmada) ----------
function cuentaAtras(): void {
  const cuenta = document.querySelector<HTMLElement>('#cuenta');
  if (!cuenta) return;
  const celdas: Record<string, HTMLElement> = {};
  cuenta.querySelectorAll<HTMLElement>('.num').forEach((n) => {
    if (n.dataset.u) celdas[n.dataset.u] = n;
  });
  const objetivo = new Date(FECHA_TORNEO).getTime();

  // Pinta una cifra dígito a dígito; el que cambia entra con un pequeño salto.
  function poner(el: HTMLElement, texto: string, animarlo: boolean): boolean {
    if (el.dataset.v === texto) return false;
    const antes = el.dataset.v ?? '';
    el.dataset.v = texto;
    if (el.children.length !== texto.length) {
      el.replaceChildren(
        ...[...texto].map((c) => {
          const d = document.createElement('i');
          d.textContent = c;
          return d;
        }),
      );
      return true;
    }
    [...texto].forEach((c, i) => {
      if (c === antes[i]) return;
      const d = el.children[i] as HTMLElement;
      d.textContent = c;
      if (animarlo) {
        d.animate(
          [
            { transform: 'translateY(-14%)', opacity: 0.3 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          { duration: 160, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
      }
    });
    return true;
  }

  function tic(): void {
    const falta = Math.max(0, objetivo - Date.now());
    const s = Math.floor(falta / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const animarlo = !reduce && !document.hidden;
    poner(celdas.d, String(d).padStart(d > 99 ? 3 : 2, '0'), animarlo);
    poner(celdas.h, String(h).padStart(2, '0'), animarlo);
    const cambiaMin = poner(celdas.m, String(m).padStart(2, '0'), animarlo);
    poner(celdas.s, String(s % 60).padStart(2, '0'), animarlo);
    // para lectores de pantalla: se actualiza una vez por minuto, no cada segundo
    if (cambiaMin) {
      cuenta!.setAttribute(
        'aria-label',
        falta > 0 ? `Faltan ${d} días, ${h} horas y ${m} minutos para el Beerpong V` : 'El Beerpong V ya está aquí',
      );
    }
    if (falta > 0) setTimeout(tic, 1000 - (Date.now() % 1000) + 5);
  }
  tic();
}

cuentaAtras();
vasos();
