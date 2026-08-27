import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService.remove', () => {
  const prisma = {
    product: {
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    wishlist: {
      deleteMany: jest.fn(),
    },
    cartItem: {
      deleteMany: jest.fn(),
    },
    orderItem: {
      deleteMany: jest.fn(),
    },
    banner: {
      updateMany: jest.fn(),
    },
    homeWidget: {
      updateMany: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    notificationLog: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const storageService = {
    deleteFile: jest.fn(),
    deletePrefix: jest.fn(),
  } as any;

  const notificationsService = {
    broadcastNewProduct: jest.fn(),
  } as any;

  const storageDeleteCleanupService = {
    queueFailedDeletes: jest.fn(),
  } as any;

  const service = new ProductsService(
    prisma,
    storageService,
    notificationsService,
    storageDeleteCleanupService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.$transaction.mockResolvedValue([]);
    storageService.deletePrefix.mockResolvedValue({ deleted: [], failed: [] });
  });

  it('deletes product relations, product record, and cloud storage assets', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      sku: 'SKU-1',
      image1StorageKey: 'products/sku-1/one.jpg',
      image2StorageKey: 'products/sku-1/two.jpg',
      image3StorageKey: null,
      pdfStorageKey: 'products/sku-1/documents/spec.pdf',
      image1Url: null,
      image2Url: null,
      image3Url: null,
      pdfUrl: null,
    });
    storageService.deletePrefix.mockResolvedValue({
      deleted: [
        'products/sku-1/one.jpg',
        'products/sku-1/two.jpg',
        'products/sku-1/documents/spec.pdf',
      ],
      failed: [],
    });

    const result = await service.remove('p1');

    expect(storageService.deletePrefix).toHaveBeenCalledWith('products/sku-1');
    expect(storageService.deleteFile).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(storageDeleteCleanupService.queueFailedDeletes).not.toHaveBeenCalled();
    expect(result).toEqual({ message: 'Product deleted successfully' });
  });

  it('queues failed storage deletes and still succeeds', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      sku: 'SKU-1',
      image1StorageKey: 'products/sku-1/one.jpg',
      image2StorageKey: null,
      image3StorageKey: null,
      pdfStorageKey: null,
      image1Url: null,
      image2Url: null,
      image3Url: null,
      pdfUrl: null,
    });
    storageService.deletePrefix.mockResolvedValue({
      deleted: [],
      failed: [{ storageKey: 'products/sku-1/one.jpg', reason: 'R2 delete failed' }],
    });

    const result = await service.remove('p1');

    expect(storageDeleteCleanupService.queueFailedDeletes).toHaveBeenCalledWith([
      {
        storageKey: 'products/sku-1/one.jpg',
        productId: 'p1',
        reason: 'R2 delete failed',
      },
    ]);
    expect(result).toEqual({ message: 'Product deleted successfully' });
  });

  it('throws NotFoundException when product does not exist', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(storageService.deletePrefix).not.toHaveBeenCalled();
    expect(storageService.deleteFile).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
