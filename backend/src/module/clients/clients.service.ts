import { prisma } from "../../prisma";
import type { CreateClientDTO, UpdateClientDTO } from "./clients.types";

export const clientsService = {
  async list() {
    return prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  },

  async getById(id: string) {
    return prisma.client.findUnique({ where: { id } });
  },

  async create(data: CreateClientDTO) {
    return prisma.client.create({ data });
  },

  async update(id: string, data: UpdateClientDTO) {
    return prisma.client.update({ where: { id }, data });
  },

  async remove(id: string) {
    await prisma.client.delete({ where: { id } });
  },

  async upsertByPhone(data: CreateClientDTO) {
    return prisma.client.upsert({
      where: { phone: data.phone },
      create: data,
      update: { name: data.name, notes: data.notes },
    });
  },
};
