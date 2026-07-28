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
    { name: 'Silver Coins', description: 'Pure silver coins in various weights' },
    { name: 'Silver Bars', description: 'Investment grade silver bars' },
    { name: 'Silver Jewellery', description: 'Handcrafted silver jewellery' },
    { name: 'Silver Utensils', description: 'Premium silver utensils' },
    { name: 'Silver Idols', description: 'Religious silver idols and figurines' },
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
  const coinCategory = await prisma.category.findFirst({
    where: { name: 'Silver Coins' },
  });

  const barCategory = await prisma.category.findFirst({
    where: { name: 'Silver Bars' },
  });

  if (coinCategory && barCategory) {
    const products = [
      {
        name: 'Silver Coin 10g - 999',
        description: 'Pure 999 silver coin, 10 grams',
        price: 950,
        weight: 10,
        purity: '999',
        sku: 'SC-10G-999',
        categoryId: coinCategory.id,
      },
      {
        name: 'Silver Coin 20g - 999',
        description: 'Pure 999 silver coin, 20 grams',
        price: 1900,
        weight: 20,
        purity: '999',
        sku: 'SC-20G-999',
        categoryId: coinCategory.id,
      },
      {
        name: 'Silver Bar 50g - 999',
        description: 'Investment grade 999 silver bar, 50 grams',
        price: 4750,
        weight: 50,
        purity: '999',
        sku: 'SB-50G-999',
        categoryId: barCategory.id,
      },
      {
        name: 'Silver Bar 100g - 999',
        description: 'Investment grade 999 silver bar, 100 grams',
        price: 9500,
        weight: 100,
        purity: '999',
        sku: 'SB-100G-999',
        categoryId: barCategory.id,
      },
    ];

    for (const prod of products) {
      const existing = await prisma.product.findFirst({ where: { sku: prod.sku } });
      if (!existing) {
        await prisma.product.create({ data: prod });
        console.log(`✅ Product created: ${prod.name}`);
      }
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
