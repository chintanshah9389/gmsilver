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
    $transaction: jest.fn(),
  } as any;

  const storageService = {
    deleteFile: jest.fn(),
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
  });

  it('deletes product relations and product record, then attempts storage cleanup', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      image1StorageKey: 'products/sku-1/one.jpg',
      image2StorageKey: 'products/sku-1/two.jpg',
      image3StorageKey: null,
      pdfStorageKey: 'products/sku-1/documents/spec.pdf',
    });
    storageService.deleteFile.mockResolvedValue(undefined);
    prisma.$transaction.mockResolvedValue([]);

    const result = await service.remove('p1');

    expect(storageService.deleteFile).toHaveBeenCalledTimes(3);
    expect(storageService.deleteFile).toHaveBeenNthCalledWith(1, 'products/sku-1/one.jpg');
    expect(storageService.deleteFile).toHaveBeenNthCalledWith(2, 'products/sku-1/two.jpg');
    expect(storageService.deleteFile).toHaveBeenNthCalledWith(
      3,
      'products/sku-1/documents/spec.pdf',
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(storageDeleteCleanupService.queueFailedDeletes).not.toHaveBeenCalled();

    expect(result).toEqual({ message: 'Product deleted successfully' });
  });

  it('queues failed storage deletes and still succeeds', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      image1StorageKey: 'products/sku-1/one.jpg',
      image2StorageKey: null,
      image3StorageKey: null,
      pdfStorageKey: null,
    });
    prisma.$transaction.mockResolvedValue([]);
    storageService.deleteFile.mockRejectedValue(new Error('R2 delete failed'));
    storageDeleteCleanupService.queueFailedDeletes.mockResolvedValue(undefined);

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
    expect(storageService.deleteFile).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
