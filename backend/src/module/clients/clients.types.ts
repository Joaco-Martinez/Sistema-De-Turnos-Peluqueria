export type CreateClientDTO = {
  name: string;
  phone: string;
  notes?: string;
};

export type UpdateClientDTO = Partial<CreateClientDTO>;
