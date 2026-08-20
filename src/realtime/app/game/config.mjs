// Dimensions de la table, partagées avec le client.
export const tableHeight = 2.715;
export const tableWidth = 4.70;
export const padHeight = 0.5;

// Demi-extents des boîtes englobantes.
//
// L'original appelait Box3.setFromObject() sur les meshes three à chaque tick.
// La géométrie ne changeant jamais, les valeurs sont figées ici :
//   balle  SphereGeometry(0.07, 32, 32)
//   raquette CapsuleGeometry(0.045, 0.50, 16, 32), rotation (1.56, 0, 0)
// `scripts/check-physics.mjs` les recalcule avec three et échoue si elles dérivent.
export const BALL_HALF = 0.07;
export const PAD_HALF = { x: 0.045, y: 0.048182, z: 0.295469 };
