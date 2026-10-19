/* Cena 3D dos celulares (three.js): corpo de alumínio com laterais retas e
   cantos arredondados, vidro na frente e atrás, botões, ilha de câmeras e a
   tela como textura. Carregado sob demanda pelo CelularesRolagem. */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { QTD, poseCelular, poseVertical, vistaVertical } from "../../lib/celulares";
import { desenharTela, desenharFaixaRespiracao, novaFaixaRespiracao, RESP, TELA_W, TELA_H, ESC } from "./telas";

const W = 0.71, H = 1.46, D = 0.078, R = 0.115;
const PX = 1 / 300; // px do palco de 1200 → unidades da cena

function retanguloArredondado(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// ShapeGeometry vem com UV em coordenadas da forma; a textura precisa de 0..1
function uvNormalizado(g: THREE.BufferGeometry, w: number, h: number) {
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + w / 2) / w, (pos.getY(k) + h / 2) / h);
  uv.needsUpdate = true;
  return g;
}

export type Cena = { quadro: (p: number, t: number) => void; medir: () => void; destruir: () => void };

// "vertical": cacho em pé da versão celular, usado só para gravar os quadros
export function montarCena(canvas: HTMLCanvasElement, parado: boolean, modo: "leque" | "vertical" = "leque"): Cena {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const cena = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ambiente = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environment = ambiente;
  cena.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const chave = new THREE.DirectionalLight(0xffffff, 1.6); chave.position.set(2.5, 3.5, 4); cena.add(chave);
  const contraTeal = new THREE.PointLight(0x00bfd8, 14, 12); contraTeal.position.set(-3, 1.2, -1.5); cena.add(contraTeal);
  const contraMag = new THREE.PointLight(0xb4157e, 7, 12); contraMag.position.set(3.2, -0.6, -1.5); cena.add(contraMag);

  // materiais compartilhados
  const aluminio = new THREE.MeshStandardMaterial({ color: 0x9ea7b0, metalness: 1, roughness: 0.3 });
  const vidroFrente = new THREE.MeshPhysicalMaterial({ color: 0x030405, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 });
  const vidroTras = new THREE.MeshPhysicalMaterial({ color: 0x1b3c48, roughness: 0.42, metalness: 0.35, clearcoat: 0.6 });
  const lenteMat = new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.05, clearcoat: 1 });

  const prof = D - 0.016;
  const corpoGeo = new THREE.ExtrudeGeometry(retanguloArredondado(W, H, R), { depth: prof, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 5, curveSegments: 28 });
  corpoGeo.translate(0, 0, -prof / 2);
  const sw = W - 0.046, sh = H - 0.046;
  const telaGeo = uvNormalizado(new THREE.ShapeGeometry(retanguloArredondado(sw, sh, R - 0.022), 28), sw, sh);
  const trasGeo = new THREE.ShapeGeometry(retanguloArredondado(W - 0.02, H - 0.02, R - 0.01), 28);
  const ilhaGeo = new THREE.ExtrudeGeometry(retanguloArredondado(0.27, 0.27, 0.07), { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3, curveSegments: 16 });
  const lenteGeo = new THREE.CylinderGeometry(0.046, 0.05, 0.02, 32).rotateX(Math.PI / 2);
  const aroGeo = new THREE.TorusGeometry(0.05, 0.007, 12, 40);
  const botaoGeo = new THREE.BoxGeometry(0.014, 1, 0.032);

  const telas: { canvas: HTMLCanvasElement; tex: THREE.CanvasTexture }[] = [];
  // a respiração anda: em vez de reenviar a tela inteira à placa de vídeo a
  // cada quadro (travava a rolagem), só a faixa da bola, por cima da tela
  const faixaCanvas = novaFaixaRespiracao();
  desenharFaixaRespiracao(faixaCanvas, 0);
  const faixaTex = new THREE.CanvasTexture(faixaCanvas);
  faixaTex.colorSpace = THREE.SRGBColorSpace;
  const faixaGeo = new THREE.PlaneGeometry(sw, sh * RESP.h / TELA_H);
  const celulares: THREE.Group[] = [];
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  for (let i = 0; i < QTD; i++) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(corpoGeo, [vidroFrente, aluminio]));

    const tc = document.createElement("canvas");
    tc.width = TELA_W * ESC; tc.height = TELA_H * ESC;
    desenharTela(tc, i, 0);
    const tex = new THREE.CanvasTexture(tc);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
    telas.push({ canvas: tc, tex });
    const tela = new THREE.Mesh(telaGeo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    tela.position.z = D / 2 + 0.0012;
    g.add(tela);
    if (i === 1) {
      const faixa = new THREE.Mesh(faixaGeo, new THREE.MeshBasicMaterial({ map: faixaTex, toneMapped: false }));
      faixa.position.set(0, sh / 2 - (RESP.y + RESP.h / 2) / TELA_H * sh, tela.position.z + 0.0004);
      g.add(faixa);
    }

    const tras = new THREE.Mesh(trasGeo, vidroTras);
    tras.position.z = -D / 2 - 0.0008; tras.rotation.y = Math.PI;
    g.add(tras);
    const ilha = new THREE.Mesh(ilhaGeo, vidroTras);
    ilha.position.set(W / 2 - 0.2, H / 2 - 0.2, -D / 2 - 0.014); g.add(ilha);
    [[-0.055, 0.055], [-0.055, -0.055], [0.055, 0]].forEach(([dx, dy]) => {
      const lx = W / 2 - 0.2 + dx, ly = H / 2 - 0.2 + dy, lz = -D / 2 - 0.024;
      const l = new THREE.Mesh(lenteGeo, lenteMat); l.position.set(lx, ly, lz); g.add(l);
      const a = new THREE.Mesh(aroGeo, aluminio); a.position.set(lx, ly, lz - 0.01); g.add(a);
    });

    // botões: volume e ação à esquerda, liga à direita
    ([[-1, 0.42, 0.07], [-1, 0.3, 0.1], [-1, 0.17, 0.1], [1, 0.26, 0.16]] as const).forEach(([lado, y, alt]) => {
      const b = new THREE.Mesh(botaoGeo, aluminio);
      b.scale.y = alt; b.position.set(lado * (W / 2 + 0.006), y, 0); g.add(b);
    });

    cena.add(g);
    celulares.push(g);
  }

  const medir = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // o celular do meio ocupa ~50% da altura e fica a 66% do topo, abaixo do
    // título; no largo o leque inteiro cabe, no estreito aparecem as pontas
    const meiaAltura = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const vista = camera.aspect < 0.9 ? H / 0.42 : Math.max(H / 0.5, 4.3 / camera.aspect);
    const z = vista / 2 / meiaAltura, cy = vista * (camera.aspect < 0.9 ? 0.12 : 0.16);
    camera.position.set(0, cy, z);
    camera.lookAt(0, cy, 0);
    camera.updateProjectionMatrix();
  };
  medir();

  const enquadrarVertical = (p: number) => {
    const vista = vistaVertical(p);
    const z = vista / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, z);
    camera.lookAt(0, 0, 0);
  };

  let ultimoDesenho = -1;
  const quadro = (p: number, t: number) => {
    const vertical = modo === "vertical";
    const aberto = vertical ? Math.min(1, Math.max(0, (p - 0.3) / 0.3)) : Math.min(1, Math.max(0, (p - 0.3) / 0.55));
    if (vertical) enquadrarVertical(p);
    celulares.forEach((g, i) => {
      const q = vertical ? poseVertical(i, p) : poseCelular(i, p);
      const flutua = parado ? 0 : Math.sin(t * 0.9 + i * 1.3) * 0.025 * aberto;
      g.visible = q.opacity > 0.01;
      g.position.set(q.x * PX, -q.y * PX + flutua, q.z * PX);
      g.rotation.set(THREE.MathUtils.degToRad(-6 * aberto), THREE.MathUtils.degToRad(-q.ry), THREE.MathUtils.degToRad(-q.rz));
      g.scale.setScalar(0.92 + 0.08 * q.opacity);
    });
    // a bola da respiração anda; redesenha a ~20 quadros por segundo
    if (!parado && t - ultimoDesenho > 0.05) {
      ultimoDesenho = t;
      desenharFaixaRespiracao(faixaCanvas, t);
      faixaTex.needsUpdate = true;
    }
    renderer.render(cena, camera);
  };

  const destruir = () => {
    telas.forEach(x => x.tex.dispose());
    faixaTex.dispose();
    [corpoGeo, faixaGeo, telaGeo, trasGeo, ilhaGeo, lenteGeo, aroGeo, botaoGeo].forEach(x => x.dispose());
    [aluminio, vidroFrente, vidroTras, lenteMat].forEach(x => x.dispose());
    celulares.forEach(g => g.children.forEach(m => { const mm = (m as THREE.Mesh).material; if (mm instanceof THREE.MeshBasicMaterial) mm.dispose(); }));
    ambiente.dispose(); pmrem.dispose(); renderer.dispose();
  };

  return { quadro, medir, destruir };
}
