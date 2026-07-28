import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async generateInvoice(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if invoice already exists
    const existingInvoice = await this.prisma.invoice.findUnique({
      where: { orderId },
    });

    if (existingInvoice) {
      return { data: existingInvoice };
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Generate PDF
    const pdfBuffer = await this.generatePdfBuffer(order, invoiceNumber);

    // Upload to R2
    const filename = `INV-${invoiceNumber}.pdf`;
    const { url, storageKey } = await this.storageService.uploadPdf(
      pdfBuffer,
      filename,
      'invoices',
    );

    // Save to database (only URL and storage key, not the PDF itself)
    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        pdfUrl: url,
        storageKey,
      },
    });

    return { data: invoice };
  }

  async getInvoiceByOrderId(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (userRole === 'CUSTOMER' && order.userId !== userId) {
      throw new NotFoundException('Invoice not found');
    }

    const invoice = await this.prisma.invoice.findUnique({
      where: { orderId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not yet generated');
    }

    return { data: invoice };
  }

  async getUserInvoices(userId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        order: { userId },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            grandTotal: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: invoices };
  }

  // ─── PDF GENERATION ───────────────────────────────────────────────
  private async generatePdfBuffer(order: any, invoiceNumber: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const company = {
        name: this.configService.get('company.name', 'GM Silver'),
        address: this.configService.get('company.address', ''),
        phone: this.configService.get('company.phone', ''),
        email: this.configService.get('company.email', ''),
        gst: this.configService.get('company.gst', ''),
      };

      // ── HEADER ──────────────────────────────────────────────────
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(company.name, 50, 50)
        .fontSize(10)
        .font('Helvetica')
        .text(company.address, 50, 80)
        .text(`Phone: ${company.phone}`, 50, 95)
        .text(`Email: ${company.email}`, 50, 110)
        .text(`GST No: ${company.gst}`, 50, 125);

      // ── INVOICE TITLE ────────────────────────────────────────────
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 400, 50, { align: 'right' })
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice No: ${invoiceNumber}`, 400, 80, { align: 'right' })
        .text(
          `Date: ${new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}`,
          400,
          95,
          { align: 'right' },
        )
        .text(`Order No: ${order.orderNumber}`, 400, 110, { align: 'right' });

      // ── DIVIDER ──────────────────────────────────────────────────
      doc.moveTo(50, 145).lineTo(545, 145).stroke();

      // ── BILL TO ──────────────────────────────────────────────────
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('BILL TO:', 50, 160)
        .font('Helvetica')
        .fontSize(10)
        .text(order.user.name, 50, 178)
        .text(order.user.email, 50, 193)
        .text(order.user.phone || '', 50, 208);

      // ── TABLE HEADER ─────────────────────────────────────────────
      const tableTop = 250;
      const tableHeaders = ['#', 'Product', 'Purity', 'Weight', 'Qty', 'Rate', 'Amount'];
      const colX = [50, 80, 240, 290, 340, 380, 450];
      const colWidth = [25, 160, 50, 45, 35, 65, 80];

      doc.rect(50, tableTop - 5, 495, 20).fill('#1a1a2e');
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold');

      tableHeaders.forEach((header, i) => {
        doc.text(header, colX[i], tableTop, { width: colWidth[i] });
      });

      // ── TABLE ROWS ────────────────────────────────────────────────
      doc.fillColor('black').font('Helvetica').fontSize(9);

      let y = tableTop + 25;
      order.items.forEach((item: any, index: number) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.rect(50, y - 3, 495, 18).fill('#f5f5f5');
        }

        doc.fillColor('black');
        doc.text(String(index + 1), colX[0], y, { width: colWidth[0] });
        doc.text(item.product.name, colX[1], y, { width: colWidth[1] });
        doc.text(item.product.purity || '-', colX[2], y, { width: colWidth[2] });
        doc.text(
          item.product.weight ? `${item.product.weight}g` : '-',
          colX[3],
          y,
          { width: colWidth[3] },
        );
        doc.text(String(item.quantity), colX[4], y, { width: colWidth[4] });
        doc.text(`₹${Number(item.rate).toFixed(2)}`, colX[5], y, {
          width: colWidth[5],
        });
        doc.text(`₹${Number(item.amount).toFixed(2)}`, colX[6], y, {
          width: colWidth[6],
          align: 'right',
        });

        y += 20;
      });

      // ── TOTALS ────────────────────────────────────────────────────
      doc.moveTo(350, y + 5).lineTo(545, y + 5).stroke();

      y += 15;
      const totalsX = 350;
      const amountX = 450;

      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', totalsX, y);
      doc.text(`₹${Number(order.totalAmount).toFixed(2)}`, amountX, y, {
        align: 'right',
        width: 95,
      });

      if (order.gstAmount) {
        y += 18;
        doc.text('GST (3%):', totalsX, y);
        doc.text(`₹${Number(order.gstAmount).toFixed(2)}`, amountX, y, {
          align: 'right',
          width: 95,
        });
      }

      y += 5;
      doc.moveTo(350, y + 5).lineTo(545, y + 5).stroke();
      y += 15;

      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Grand Total:', totalsX, y);
      doc.text(`₹${Number(order.grandTotal).toFixed(2)}`, amountX, y, {
        align: 'right',
        width: 95,
      });

      // ── FOOTER ────────────────────────────────────────────────────
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
          'This is a computer-generated invoice and does not require a signature.',
          50,
          750,
          { align: 'center', width: 495 },
        )
        .text('Thank you for your business!', 50, 765, {
          align: 'center',
          width: 495,
        });

      doc.end();
    });
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await this.prisma.invoice.count();
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}
