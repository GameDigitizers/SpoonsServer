export const imageUrl = (file) => `/images/${file}`;
export const CARD_BACK = imageUrl('blueGrid.png');
export const SPOON = imageUrl('spoon.png');

export function avatarName(img) {
  return img ? img.replace('.png', '') : '';
}
