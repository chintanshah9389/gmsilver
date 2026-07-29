import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService.remove', () => {
  const prisma = {
    product: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    productImage: {
      deleteMany: jest.fn(),
    },
  } as any;

  const storageService = {
    deleteFile: jest.fn(),
  } as any;

  const notificationsService = {
    broadcastNewProduct: jest.fn(),
  } as any;

  const service = new ProductsService(prisma, storageService, notificationsService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes all storage files and then updates DB', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      pdfStorageKey: 'products/sku-1/documents/spec.pdf',
      images: [
        { id: 'i1', storageKey: 'products/sku-1/one.jpg' },
        { id: 'i2', storageKey: 'products/sku-1/two.jpg' },
      ],
    });
    storageService.deleteFile.mockResolvedValue(undefined);
    prisma.productImage.deleteMany.mockResolvedValue({ count: 2 });
    prisma.product.update.mockResolvedValue({ id: 'p1' });

    const result = await service.remove('p1');

    expect(storageService.deleteFile).toHaveBeenCalledTimes(3);
    expect(storageService.deleteFile).toHaveBeenNthCalledWith(1, 'products/sku-1/one.jpg');
    expect(storageService.deleteFile).toHaveBeenNthCalledWith(2, 'products/sku-1/two.jpg');
    expect(storageService.deleteFile).toHaveBeenNthCalledWith(
      3,
      'products/sku-1/documents/spec.pdf',
    );

    expect(prisma.productImage.deleteMany).toHaveBeenCalledWith({ where: { productId: 'p1' } });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { deletedAt: expect.any(Date) },
    });

    expect(result).toEqual({ message: 'Product deleted successfully' });
  });

  it('throws and skips DB updates when any storage delete fails', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 'p1',
      pdfStorageKey: null,
      images: [{ id: 'i1', storageKey: 'products/sku-1/one.jpg' }],
    });
    storageService.deleteFile.mockRejectedValue(new Error('R2 delete failed'));

    await expect(service.remove('p1')).rejects.toThrow('R2 delete failed');
    expect(prisma.productImage.deleteMany).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when product does not exist', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(storageService.deleteFile).not.toHaveBeenCalled();
    expect(prisma.productImage.deleteMany).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});
