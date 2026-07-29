import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin user
  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmsilver.com' },
    update: {},
    create: {
      email: 'admin@gmsilver.com',
      name: 'GM Silver Admin',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Owner user
  const ownerPassword = await bcrypt.hash('Owner@12345', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@gmsilver.com' },
    update: {},
    create: {
      email: 'owner@gmsilver.com',
      name: 'GM Silver Owner',
      password: ownerPassword,
      role: UserRole.OWNER,
      status: UserStatus.APPROVED,
    },
  });
  console.log(`✅ Owner created: ${owner.email}`);

  // Create Categories
  const categories = [
    { name: 'Silver Chains', description: 'Classic and designer silver chains' },
    { name: 'Silver Bracelets', description: 'Stylish sterling silver bracelets' },
    { name: 'Silver Anklets', description: 'Traditional and modern silver anklets' },
    { name: 'Silver Rings', description: '925 silver rings for daily and occasion wear' },
    { name: 'Silver Earrings', description: 'Studs, hoops, and drop silver earrings' },
    { name: 'Silver Pendants', description: 'Minimal and statement silver pendants' },
    { name: 'Silver Utensils', description: 'Premium silver utensils and gifting sets' },
    { name: 'Silver Idols', description: 'Religious silver idols and figurines' },
    { name: 'Silver Coins', description: 'Pure silver coins in various weights' },
    { name: 'Silver Bars', description: 'Investment grade silver bars' },
  ];

  for (const cat of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name },
    });

    if (!existing) {
      await prisma.category.create({ data: cat });
      console.log(`✅ Category created: ${cat.name}`);
    }
  }

  // Create sample products
  const categoryRecords = await prisma.category.findMany({
    where: {
      name: {
        in: categories.map((category) => category.name),
      },
    },
    select: { id: true, name: true },
  });

  const categoryIdByName = new Map(categoryRecords.map((category) => [category.name, category.id]));

  const products = [
    {
      name: '925 Silver Rope Chain 18 inch',
      description: 'Elegant rope chain for everyday wear',
      price: 2450,
      weight: 22,
      purity: '925',
      sku: 'SLC-CHAIN-001',
      quantity: 25,
      categoryName: 'Silver Chains',
    },
    {
      name: '925 Silver Box Chain 20 inch',
      description: 'Durable box pattern silver chain',
      price: 2790,
      weight: 24,
      purity: '925',
      sku: 'SLC-CHAIN-002',
      quantity: 20,
      categoryName: 'Silver Chains',
    },
    {
      name: '925 Silver Curb Chain 22 inch',
      description: 'Bold curb-link chain with premium finish',
      price: 3290,
      weight: 30,
      purity: '925',
      sku: 'SLC-CHAIN-003',
      quantity: 18,
      categoryName: 'Silver Chains',
    },
    {
      name: '925 Silver Classic Bracelet',
      description: 'Smooth polished bracelet with secure clasp',
      price: 1890,
      weight: 16,
      purity: '925',
      sku: 'SLB-BRACE-001',
      quantity: 30,
      categoryName: 'Silver Bracelets',
    },
    {
      name: '925 Silver Cuban Bracelet',
      description: 'Chunky cuban-style bracelet',
      price: 2290,
      weight: 19,
      purity: '925',
      sku: 'SLB-BRACE-002',
      quantity: 22,
      categoryName: 'Silver Bracelets',
    },
    {
      name: '925 Silver Charm Bracelet',
      description: 'Bracelet with customizable charm loops',
      price: 2090,
      weight: 17,
      purity: '925',
      sku: 'SLB-BRACE-003',
      quantity: 28,
      categoryName: 'Silver Bracelets',
    },
    {
      name: '925 Silver Traditional Anklet Pair',
      description: 'Traditional design with light ghunghroo accents',
      price: 2590,
      weight: 26,
      purity: '925',
      sku: 'SLA-ANKLET-001',
      quantity: 15,
      categoryName: 'Silver Anklets',
    },
    {
      name: '925 Silver Minimal Anklet Pair',
      description: 'Simple and lightweight daily wear anklets',
      price: 2190,
      weight: 21,
      purity: '925',
      sku: 'SLA-ANKLET-002',
      quantity: 20,
      categoryName: 'Silver Anklets',
    },
    {
      name: '925 Silver Toe Ring Set',
      description: 'Adjustable silver toe ring combo',
      price: 690,
      weight: 6,
      purity: '925',
      sku: 'SLR-RING-001',
      quantity: 50,
      categoryName: 'Silver Rings',
    },
    {
      name: '925 Silver Solitaire Ring',
      description: 'Sterling ring with zircon centerpiece',
      price: 1490,
      weight: 8,
      purity: '925',
      sku: 'SLR-RING-002',
      quantity: 35,
      categoryName: 'Silver Rings',
    },
    {
      name: '925 Silver Band Ring',
      description: 'Minimal polished silver band',
      price: 990,
      weight: 7,
      purity: '925',
      sku: 'SLR-RING-003',
      quantity: 40,
      categoryName: 'Silver Rings',
    },
    {
      name: '925 Silver Stud Earrings',
      description: 'Round-cut daily wear studs',
      price: 1090,
      weight: 5,
      purity: '925',
      sku: 'SLE-EAR-001',
      quantity: 45,
      categoryName: 'Silver Earrings',
    },
    {
      name: '925 Silver Hoop Earrings',
      description: 'Medium hoop earrings with latch back',
      price: 1590,
      weight: 9,
      purity: '925',
      sku: 'SLE-EAR-002',
      quantity: 32,
      categoryName: 'Silver Earrings',
    },
    {
      name: '925 Silver Drop Earrings',
      description: 'Teardrop silver earrings for occasions',
      price: 1790,
      weight: 10,
      purity: '925',
      sku: 'SLE-EAR-003',
      quantity: 26,
      categoryName: 'Silver Earrings',
    },
    {
      name: '925 Silver Om Pendant',
      description: 'Spiritual symbol pendant in sterling silver',
      price: 890,
      weight: 4,
      purity: '925',
      sku: 'SLP-PEND-001',
      quantity: 38,
      categoryName: 'Silver Pendants',
    },
    {
      name: '925 Silver Heart Pendant',
      description: 'Heart-shaped polished pendant',
      price: 990,
      weight: 5,
      purity: '925',
      sku: 'SLP-PEND-002',
      quantity: 34,
      categoryName: 'Silver Pendants',
    },
    {
      name: 'Silver Pooja Spoon Set',
      description: 'Handcrafted silver spoon set for rituals',
      price: 2890,
      weight: 30,
      purity: '925',
      sku: 'SLU-UTEN-001',
      quantity: 12,
      categoryName: 'Silver Utensils',
    },
    {
      name: 'Silver Diya Pair',
      description: 'Decorative diya pair for festive use',
      price: 3490,
      weight: 38,
      purity: '925',
      sku: 'SLI-IDOL-001',
      quantity: 10,
      categoryName: 'Silver Idols',
    },
    {
      name: 'Silver Coin 20g - 999',
      description: 'Pure 999 silver coin, 20 grams',
      price: 1990,
      weight: 20,
      purity: '999',
      sku: 'SLC-COIN-020G',
      quantity: 60,
      categoryName: 'Silver Coins',
    },
    {
      name: 'Silver Bar 100g - 999',
      description: 'Investment grade 999 silver bar, 100 grams',
      price: 9890,
      weight: 100,
      purity: '999',
      sku: 'SLB-BAR-100G',
      quantity: 14,
      categoryName: 'Silver Bars',
    },
  ];

  for (const product of products) {
    const categoryId = categoryIdByName.get(product.categoryName);

    if (!categoryId) {
      console.warn(`⚠️ Category missing for product ${product.name}: ${product.categoryName}`);
      continue;
    }

    const existing = await prisma.product.findFirst({ where: { sku: product.sku } });

    if (!existing) {
      const { categoryName, ...productData } = product;
      await prisma.product.create({
        data: {
          ...productData,
          categoryId,
        },
      });
      console.log(`✅ Product created: ${product.name}`);
    }
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nDefault Credentials:');
  console.log('Admin: admin@gmsilver.com / Admin@12345');
  console.log('Owner: owner@gmsilver.com / Owner@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
