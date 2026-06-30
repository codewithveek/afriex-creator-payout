import type { FastifyRequest, FastifyReply } from 'fastify';
import { productsService } from './products.service';
import { creatorsService } from '../creators/creators.service';
import type { CreateProductInput, UpdateProductInput } from './products.schema';
import { parsePagination, buildPaginationMeta } from '../../shared/pagination';

export const productsController = {
  async create(request: FastifyRequest<{ Body: CreateProductInput }>, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const product = await productsService.create(creator.id, request.body);
    return reply.code(201).send({ data: product });
  },

  async listMyProducts(request: FastifyRequest, reply: FastifyReply) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await productsService.listForCreator(creator.id, (pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async listPublished(request: FastifyRequest, reply: FastifyReply) {
    const pag = parsePagination(request.query as Record<string, unknown>);
    const { rows, total } = await productsService.getPublished((pag.page - 1) * pag.pageSize, pag.pageSize);
    return reply.code(200).send({ data: rows, meta: buildPaginationMeta(pag, total) });
  },

  async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const product = await productsService.getById(request.params.id);
    return reply.code(200).send({ data: product });
  },

  async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductInput }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    const product = await productsService.update(creator.id, request.params.id, request.body);
    return reply.code(200).send({ data: product });
  },

  async delete(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) {
    const creator = await creatorsService.getByUserId(request.user!.id);
    await productsService.delete(creator.id, request.params.id);
    return reply.code(204).send();
  },
};
