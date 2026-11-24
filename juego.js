const ANCHO = 480;
const ALTO = 640;
const VELOCIDAD_JUGADOR = 360;
const VELOCIDAD_INICIAL = 180;
const AUMENTO_POR_NIVEL = 20;
const SEGUNDOS_ENTRE_OBJETOS = 0.8;
const PROBABILIDAD_METEORITO = 0.25;
const VIDAS_INICIALES = 3;

const lienzo = document.getElementById('juego');
const pincel = lienzo.getContext('2d');
const teclas = new Set();
let estado = crearEstado(0);
let anterior = null;
let pausado = true;

function crearEstado(record) {
  return { jugador: { x: ANCHO / 2 - 30, y: ALTO - 40, ancho: 60, alto: 16 }, objetos: [], puntos: 0,
    vidas: VIDAS_INICIALES, record: record, espera: 0, terminado: false };
}

function velocidadDeCaida(puntos) {
  return VELOCIDAD_INICIAL + Math.floor(puntos / 5) * AUMENTO_POR_NIVEL;
}

function crearObjeto() {
  const meteorito = Math.random() < PROBABILIDAD_METEORITO;
  const lado = meteorito ? 26 : 18;
  return { x: Math.floor(Math.random() * (ANCHO - lado + 1)), y: -lado, ancho: lado, alto: lado, tipo: meteorito ? 'meteorito' : 'estrella' };
}

function chocan(a, b) {
  return a.x < b.x + b.ancho && b.x < a.x + a.ancho && a.y < b.y + b.alto && b.y < a.y + a.alto;
}

function actualizar(dt) {
  if (estado.terminado) return;
  const jugador = estado.jugador;
  if (teclas.has('izquierda')) jugador.x -= VELOCIDAD_JUGADOR * dt;
  if (teclas.has('derecha')) jugador.x += VELOCIDAD_JUGADOR * dt;
  jugador.x = Math.max(0, Math.min(ANCHO - jugador.ancho, jugador.x));

  estado.espera += dt;
  if (estado.espera >= SEGUNDOS_ENTRE_OBJETOS) {
    estado.espera = 0;
    estado.objetos.push(crearObjeto());
  }

  const caida = velocidadDeCaida(estado.puntos) * dt;
  for (const objeto of [...estado.objetos]) {
    objeto.y += caida;
    if (chocan(objeto, jugador)) {
      estado.objetos.splice(estado.objetos.indexOf(objeto), 1);
      if (objeto.tipo === 'estrella') estado.puntos += 1;
      else estado.vidas -= 1;
    } else if (objeto.y > ALTO) {
      estado.objetos.splice(estado.objetos.indexOf(objeto), 1);
      if (objeto.tipo === 'estrella') estado.vidas -= 1;
    }
  }

  if (estado.vidas <= 0) {
    estado.terminado = true;
    estado.record = Math.max(estado.record, estado.puntos);
  }
}

function texto(contenido, x, y, alineacion) {
  pincel.textAlign = alineacion;
  pincel.fillText(contenido, x, y);
}

function dibujar() {
  pincel.fillStyle = '#0f172a';
  pincel.fillRect(0, 0, ANCHO, ALTO);
  pincel.fillStyle = '#38bdf8';
  const j = estado.jugador;
  pincel.fillRect(j.x, j.y, j.ancho, j.alto);
  for (const objeto of estado.objetos) {
    pincel.fillStyle = objeto.tipo === 'estrella' ? '#facc15' : '#ef4444';
    pincel.fillRect(objeto.x, objeto.y, objeto.ancho, objeto.alto);
  }
  pincel.fillStyle = '#e2e8f0';
  pincel.font = '20px system-ui, sans-serif';
  texto('Puntos: ' + estado.puntos + '   Vidas: ' + estado.vidas + '   Récord: ' + estado.record, 12, 30, 'left');
  const mensajes = estado.terminado
    ? ['Fin del juego', 'Hiciste ' + estado.puntos + ' puntos', 'Presioná R para jugar de nuevo']
    : pausado ? ['Pausa', 'Hacé clic acá para jugar', 'Flechas o A/D para moverte'] : [];
  mensajes.forEach(function (linea, i) { texto(linea, ANCHO / 2, ALTO / 2 - 30 + i * 32, 'center'); });
}

function cuadro(ahora) {
  // Tiempo real entre cuadros, limitado: si la pestaña estuvo oculta no hay un salto enorme.
  const dt = anterior === null ? 0 : Math.min((ahora - anterior) / 1000, 0.1);
  anterior = ahora;
  if (!pausado) actualizar(dt);
  dibujar();
  requestAnimationFrame(cuadro);
}

const TECLAS = { ArrowLeft: 'izquierda', a: 'izquierda', A: 'izquierda', ArrowRight: 'derecha', d: 'derecha', D: 'derecha' };
window.addEventListener('keydown', function (evento) {
  if (TECLAS[evento.key]) { teclas.add(TECLAS[evento.key]); evento.preventDefault(); }
  if ((evento.key === 'r' || evento.key === 'R') && estado.terminado) estado = crearEstado(estado.record);
});
window.addEventListener('keyup', function (evento) { if (TECLAS[evento.key]) teclas.delete(TECLAS[evento.key]); });
// En la web el juego vive dentro de una página: si pierde el foco, se pausa.
window.addEventListener('blur', function () { pausado = true; teclas.clear(); });
lienzo.addEventListener('pointerdown', function () { pausado = false; lienzo.focus(); });
document.querySelectorAll('[data-direccion]').forEach(function (boton) {
  const direccion = boton.getAttribute('data-direccion');
  boton.addEventListener('pointerdown', function () { pausado = false; teclas.add(direccion); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (tipo) { boton.addEventListener(tipo, function () { teclas.delete(direccion); }); });
});
requestAnimationFrame(cuadro);
