const CATEGORY_IMAGES: Record<string, number> = {
  chains: require('@/assets/categories/chains.jpg'),
  bracelets: require('@/assets/categories/bracelets.jpg'),
  anklets: require('@/assets/categories/anklets.jpg'),
  rings: require('@/assets/categories/rings.jpg'),
  earrings: require('@/assets/categories/earrings.jpg'),
  pendants: require('@/assets/categories/pendants.jpg'),
  utensils: require('@/assets/categories/utensils.jpg'),
  idols: require('@/assets/categories/idols.jpg'),
  coins: require('@/assets/categories/coins.jpg'),
  bars: require('@/assets/categories/bars.jpg'),
};

const DEFAULT_IMAGE = require('@/assets/categories/default.jpg');

function resolveKey(name?: string | null): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  if (n.includes('chain')) return 'chains';
  if (n.includes('bracelet')) return 'bracelets';
  if (n.includes('anklet')) return 'anklets';
  if (n.includes('ring')) return 'rings';
  if (n.includes('earring')) return 'earrings';
  if (n.includes('pendant')) return 'pendants';
  if (n.includes('utensil')) return 'utensils';
  if (n.includes('idol') || n.includes('figurine')) return 'idols';
  if (n.includes('coin')) return 'coins';
  if (n.includes('bar') || n.includes('ingot')) return 'bars';
  return null;
}

/** Prefer API/admin image, then product cover, then local royalty-free category photos. */
export function getCategoryImageSource(category: {
  name?: string | null;
  imageUrl?: string | null;
  coverImageUrl?: string | null;
  products?: Array<{ image1Url?: string | null }>;
}) {
  const remote =
    (typeof category.imageUrl === 'string' && category.imageUrl.trim()) ||
    (typeof category.coverImageUrl === 'string' && category.coverImageUrl.trim()) ||
    category.products?.[0]?.image1Url ||
    null;

  if (remote) {
    return { uri: remote };
  }

  const key = resolveKey(category.name);
  return key && CATEGORY_IMAGES[key] ? CATEGORY_IMAGES[key] : DEFAULT_IMAGE;
}
