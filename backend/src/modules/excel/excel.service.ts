import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── EXPORT PRODUCTS ──────────────────────────────────────────────
  async exportProducts(): Promise<Buffer> {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = products.map((p) => ({
      ID: p.id,
      Name: p.name,
      Description: p.description || '',
      Category: p.category.name,
      Price: Number(p.price),
      Weight: p.weight ? Number(p.weight) : '',
      Purity: p.purity || '',
      SKU: p.sku || '',
      Available: p.isAvailable ? 'Yes' : 'No',
      Active: p.isActive ? 'Yes' : 'No',
      'Created At': p.createdAt.toISOString().split('T')[0],
    }));

    return this.generateExcel(data, 'Products');
  }

  // ─── IMPORT PRODUCTS ──────────────────────────────────────────────
  async importProducts(buffer: Buffer): Promise<{ imported: number; errors: string[] }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        if (!row.Name || !row.Price || !row['Category ID']) {
          errors.push(`Row ${rowNum}: Name, Price, and Category ID are required`);
          continue;
        }

        const category = await this.prisma.category.findFirst({
          where: { id: row['Category ID'], deletedAt: null },
        });

        if (!category) {
          errors.push(`Row ${rowNum}: Category not found: ${row['Category ID']}`);
          continue;
        }

        await this.prisma.product.create({
          data: {
            name: String(row.Name),
            description: row.Description ? String(row.Description) : null,
            price: parseFloat(row.Price),
            weight: row.Weight ? parseFloat(row.Weight) : null,
            purity: row.Purity ? String(row.Purity) : null,
            sku: row.SKU ? String(row.SKU) : null,
            categoryId: String(row['Category ID']),
            isAvailable: row.Available?.toLowerCase() !== 'no',
            isActive: row.Active?.toLowerCase() !== 'no',
          },
        });

        imported++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err.message}`);
      }
    }

    return { imported, errors };
  }

  // ─── EXPORT USERS ─────────────────────────────────────────────────
  async exportUsers(): Promise<Buffer> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const data = users.map((u) => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Phone: u.phone || '',
      Role: u.role,
      Status: u.status,
      'Created At': u.createdAt.toISOString().split('T')[0],
    }));

    return this.generateExcel(data, 'Users');
  }

  // ─── EXPORT ORDERS ────────────────────────────────────────────────
  async exportOrders(query?: any): Promise<Buffer> {
    const where: any = { deletedAt: null };
    if (query?.status) where.status = query.status;
    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = orders.map((o) => ({
      'Order No': o.orderNumber,
      'Customer Name': o.user.name,
      'Customer Email': o.user.email,
      'Customer Phone': o.user.phone || '',
      Status: o.status,
      'Total Amount': Number(o.totalAmount),
      'GST Amount': o.gstAmount ? Number(o.gstAmount) : '',
      'Grand Total': Number(o.grandTotal),
      Notes: o.notes || '',
      'Created At': o.createdAt.toISOString().split('T')[0],
    }));

    return this.generateExcel(data, 'Orders');
  }

  // ─── GENERATE EXCEL ────────────────────────────────────────────────
  private generateExcel(data: any[], sheetName: string): Buffer {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buffer);
  }
}
