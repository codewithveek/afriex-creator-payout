import { productsRepository, type Product } from './products.repository';
import { NotFoundError } from '../../shared/errors';

export const productsService = {
  async create(creatorId: string, input: { name: string; description?: string; price: string; currency: string }): Promise<Product> {
    return productsRepository.create({
      creatorId,
      name: input.name,
      description: input.description ?? null,
      price: input.price,
      currency: input.currency as Product['currency'],
    });
  },

  async listForCreator(creatorId: string): Promise<Product[]> {
    return productsRepository.findByCreatorId(creatorId);
  },

  async getById(productId: string): Promise<Product> {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  },

  async getPublished(): Promise<Product[]> {
    return productsRepository.findPublished();
  },

  async getPublishedById(productId: string): Promise<Product> {
    const product = await productsRepository.findPublishedById(productId);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  },

  async update(creatorId: string, productId: string, input: Record<string, unknown>): Promise<Product> {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.creatorId !== creatorId) throw new NotFoundError('Product not found');
    const updated = await productsRepository.update(productId, input);
    return updated!;
  },

  async delete(creatorId: string, productId: string): Promise<void> {
    const product = await productsRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found');
    if (product.creatorId !== creatorId) throw new NotFoundError('Product not found');
    await productsRepository.delete(productId);
  },
};
