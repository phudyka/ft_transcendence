// Cuisson de l'occlusion ambiante dans les couleurs de sommets (COLOR_0).
//
// La scène n'a aucun UV2 sur ses 71 primitives : une lightmap demanderait un
// dépliage complet, donc Blender. L'AO par sommet ne demande rien — elle se
// calcule sur la géométrie déjà là, se range dans un attribut que trois octets
// par sommet suffisent à porter, et `GLTFLoader` active `vertexColors` tout
// seul quand il voit un COLOR_0. Zéro ligne côté client, zéro coût par frame.
//
// Ce qu'on y gagne : les creux, les dessous de rochers, la jonction du ponton
// et du sable, la base des cailloux — tout ce qu'une lumière analytique ne peut
// pas assombrir parce qu'elle ne sait rien de la géométrie voisine.
//
// Ce qu'on n'y gagne pas : la résolution est celle du maillage. Sur les grandes
// plaques de sable, quelques sommets pour beaucoup de mètres carrés — l'AO y
// est une teinte douce, pas un détail. C'est le prix de l'absence d'UV2.

import {
  BufferAttribute,
  BufferGeometry,
  Matrix3,
  Matrix4,
  Ray,
  Vector3,
} from "three";
import { MeshBVH } from "three-mesh-bvh";

// Rayons par sommet. 64 suffisent avec un échantillonnage de Hammersley — la
// suite est à faible discrépance, elle couvre l'hémisphère bien plus
// régulièrement qu'un tirage aléatoire de même taille.
const SAMPLES = 64;
// Portée des rayons, en unités monde. Surtout pas en fraction de la boîte
// englobante : une épave mouille à z = -46, elle porte la diagonale de la scène
// à 62 unités quand l'île en fait 20 et ses accessoires 0,2 à 4. Calibrée sur
// cette diagonale, la portée montait à 3,7 — les grandes plaques de sable
// occultaient alors tout ce qui les touchait, et 47 % des sommets butaient sur
// le plancher. L'AO est un terme de contact : elle se règle sur la taille des
// objets, pas sur celle de la scène.
const MAX_DISTANCE = 0.35;
// Distance en deçà de laquelle un rayon ne compte pas. Les objets de cette
// scène sont des assemblages : la planche de surf porte ses décalques en
// primitives distinctes, posées à 4 millièmes d'unité de sa surface. Sans ce
// biais elles s'occultent l'une l'autre et 56 % des sommets tombent au noir,
// contre 27 % avec.
const BIAS = 0.01;
// Contraste. 1 = occlusion brute, au-delà les creux se creusent.
const STRENGTH = 1;
// Plancher : rien ne descend au noir, sinon les zones fermées deviennent des
// trous que plus aucune lumière ne rattrape.
const FLOOR = 0.45;

const DOUBLE_SIDE = 2; // THREE.DoubleSide — les 23 matériaux le sont tous.

// Van der Corput en base 2, la seconde coordonnée de Hammersley.
function radicalInverse(bits) {
  bits = ((bits << 16) | (bits >>> 16)) >>> 0;
  bits = (((bits & 0x55555555) << 1) | ((bits & 0xaaaaaaaa) >>> 1)) >>> 0;
  bits = (((bits & 0x33333333) << 2) | ((bits & 0xcccccccc) >>> 2)) >>> 0;
  bits = (((bits & 0x0f0f0f0f) << 4) | ((bits & 0xf0f0f0f0) >>> 4)) >>> 0;
  bits = (((bits & 0x00ff00ff) << 8) | ((bits & 0xff00ff00) >>> 8)) >>> 0;
  return bits * 2.3283064365386963e-10;
}

// Hémisphère pondéré par le cosinus, exprimé dans le repère de la normale.
// L'AO est une intégrale du cosinus : échantillonner selon ce même cosinus
// rend la moyenne non pondérée correcte, un simple compte de rayons bloqués.
const HEMISPHERE = Array.from({ length: SAMPLES }, (_, i) => {
  const u = (i + 0.5) / SAMPLES;
  const v = radicalInverse(i);
  const radius = Math.sqrt(u);
  const phi = 2 * Math.PI * v;
  return {
    x: radius * Math.cos(phi),
    y: radius * Math.sin(phi),
    z: Math.sqrt(Math.max(0, 1 - u)),
  };
});

// Les meshes skinnés sont exclus des deux côtés. Le requin traverse la scène :
// lui cuire l'occlusion de l'endroit où il se trouve au repos y collerait une
// tache sombre qu'il traînerait tout le long de sa nage, et le faire occulter
// le décor y laisserait son ombre imprimée. Les palmiers sont dans le même cas
// — c'est la shadow map qui porte leur ombre au sol, pas l'AO.
const isSkinned = (primitive) => primitive.getAttribute("JOINTS_0") !== null;

function worldNodes(document) {
  const out = [];
  for (const scene of document.getRoot().listScenes()) {
    const visit = (node) => {
      const mesh = node.getMesh();
      if (mesh) out.push({ node, mesh, matrix: node.getWorldMatrix() });
      node.listChildren().forEach(visit);
    };
    scene.listChildren().forEach(visit);
  }
  return out;
}

// Toute la géométrie statique fondue en un seul maillage monde, pour une seule
// structure d'accélération. 65 000 triangles : le BVH se construit en une
// seconde et répond en O(log n).
function buildOccluder(entries) {
  const positions = [];
  const matrix = new Matrix4();
  const vertex = new Vector3();
  // `getElement()` remplit un tableau à la gl-matrix, pas un Vector3 : passer
  // directement le vecteur écrirait ses index 0/1/2 et laisserait x/y/z tels
  // quels — toute la géométrie resterait à l'origine, en silence.
  const element = [0, 0, 0];

  for (const { mesh, matrix: world } of entries) {
    matrix.fromArray(world);
    for (const primitive of mesh.listPrimitives()) {
      if (isSkinned(primitive)) continue;
      const position = primitive.getAttribute("POSITION");
      const indices = primitive.getIndices();
      if (!position) continue;
      const count = indices ? indices.getCount() : position.getCount();
      for (let i = 0; i < count; i++) {
        const index = indices ? indices.getScalar(i) : i;
        vertex.fromArray(position.getElement(index, element));
        vertex.applyMatrix4(matrix);
        positions.push(vertex.x, vertex.y, vertex.z);
      }
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(positions), 3),
  );
  return { bvh: new MeshBVH(geometry), triangles: positions.length / 9 };
}

export default function bakeAmbientOcclusion(document) {
  const entries = worldNodes(document);
  const { bvh, triangles } = buildOccluder(entries);

  const buffer = document.getRoot().listBuffers()[0];
  const matrix = new Matrix4();
  const normalMatrix = new Matrix3();
  const origin = new Vector3();
  const normal = new Vector3();
  const element = [0, 0, 0];
  const tangent = new Vector3();
  const bitangent = new Vector3();
  const ray = new Ray();

  let baked = 0;
  let skipped = 0;
  let darkest = 1;
  let brightest = 0;
  let sum = 0;

  for (const { mesh, matrix: world } of entries) {
    matrix.fromArray(world);
    normalMatrix.setFromMatrix4(matrix).invert().transpose();

    for (const primitive of mesh.listPrimitives()) {
      if (isSkinned(primitive)) {
        skipped++;
        continue;
      }
      const position = primitive.getAttribute("POSITION");
      const normals = primitive.getAttribute("NORMAL");
      if (!position || !normals) {
        skipped++;
        continue;
      }

      const count = position.getCount();
      const colors = new Uint8Array(count * 4);

      for (let i = 0; i < count; i++) {
        origin.fromArray(position.getElement(i, element)).applyMatrix4(matrix);
        normal
          .fromArray(normals.getElement(i, element))
          .applyMatrix3(normalMatrix)
          .normalize();

        // Repère orthonormé autour de la normale. L'axe de départ est choisi
        // loin de la normale, sinon le produit vectoriel dégénère au pôle.
        tangent.set(1, 0, 0);
        if (Math.abs(normal.x) > 0.9) tangent.set(0, 1, 0);
        tangent.crossVectors(normal, tangent).normalize();
        bitangent.crossVectors(normal, tangent);

        // Rotation propre à chaque sommet : sans elle les 64 mêmes directions
        // partout impriment leur motif dans le maillage, en bandes visibles.
        const spin = (i * 2.399963) % (2 * Math.PI);
        const cos = Math.cos(spin);
        const sin = Math.sin(spin);

        // Pas de décalage de l'origine : c'est `BIAS` qui écarte le triangle
        // de départ, en bornant le rayon par le bas plutôt qu'en déplaçant son
        // point de départ hors de la surface.
        ray.origin.copy(origin);

        let blocked = 0;
        for (const sample of HEMISPHERE) {
          const x = sample.x * cos - sample.y * sin;
          const y = sample.x * sin + sample.y * cos;
          ray.direction
            .set(0, 0, 0)
            .addScaledVector(tangent, x)
            .addScaledVector(bitangent, y)
            .addScaledVector(normal, sample.z)
            .normalize();
          if (bvh.raycastFirst(ray, DOUBLE_SIDE, BIAS, MAX_DISTANCE)) blocked++;
        }

        const occlusion = 1 - blocked / SAMPLES;
        const value = FLOOR + (1 - FLOOR) * Math.pow(occlusion, STRENGTH);

        darkest = Math.min(darkest, value);
        brightest = Math.max(brightest, value);
        sum += value;

        const byte = Math.round(value * 255);
        colors[i * 4] = byte;
        colors[i * 4 + 1] = byte;
        colors[i * 4 + 2] = byte;
        colors[i * 4 + 3] = 255;
      }

      const accessor = document
        .createAccessor()
        .setType("VEC4")
        .setArray(colors)
        .setNormalized(true)
        .setBuffer(buffer);
      primitive.setAttribute("COLOR_0", accessor);
      baked += count;
    }
  }

  // Une AO qui ne varie pas est une AO qui n'a rien calculé : rayons tous
  // bloqués (origine sous la surface) ou tous libres (portée nulle, BVH vide).
  // Les deux échouent en silence et produisent un fichier plausible.
  if (baked === 0) throw new Error("AO : aucun sommet cuit");
  if (darkest > 0.9) {
    throw new Error(
      `AO : aucun sommet occulté (le plus sombre à ${darkest.toFixed(3)}) — ` +
        "portée des rayons ou occluder à vérifier",
    );
  }
  if (brightest < 0.9) {
    throw new Error(
      `AO : aucun sommet dégagé (le plus clair à ${brightest.toFixed(3)}) — ` +
        "les rayons partent probablement sous la surface",
    );
  }

  return {
    baked,
    skipped,
    triangles,
    darkest,
    brightest,
    average: sum / baked,
    maxDistance: MAX_DISTANCE,
  };
}
