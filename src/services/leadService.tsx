import api from '../api/api';

export type LeadCnpjDTO = {
  id: number;
  cnpj: string;
  corporateReason: string;
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CreateLeadCnpjDTO = {
  Cnpj: string;               
  CorporateReason: string;    
  Cep: string;
  Address: string;
  Number: string;
  Complement: string;
  Neighborhood: string;
  City: string;
  State: string;
};

export type UpdateLeadCnpjDTO = {
  CorporateReason?: string;
  Cep?: string;
  Address?: string;
  Number?: string;
  Complement?: string;
  Neighborhood?: string;
  City?: string;
  State?: string;
};

export const LeadService = {
  async getAllLeads(): Promise<LeadCnpjDTO[]> {
    try {
      const response = await api.get('/LeadCnpj/GetAllLeadCnpj');
      return response.data;
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  },

  async getLeadById(id: number): Promise<LeadCnpjDTO> {
    try {
      const response = await api.get(`/LeadCnpj/GetLeadCnpjById/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching lead with id ${id}:`, error);
      throw error;
    }
  },

  async createLead(leadData: CreateLeadCnpjDTO): Promise<LeadCnpjDTO> {
    try {
      const response = await api.post('/LeadCnpj/CreateLeadCnpj', leadData);
      return response.data;
    } catch (error) {
      console.error('Error creating lead:', error.response?.data || error.message);
      throw error;
    }
  },

  async updateLead(id: number, leadData: UpdateLeadCnpjDTO): Promise<LeadCnpjDTO> {
    try {
      const response = await api.put(`/LeadCnpj/UpdateLeadCnpj/${id}`, leadData);
      return response.data;
    } catch (error) {
      console.error(`Error updating lead with id ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  async deleteLead(id: number): Promise<void> {
    try {
      await api.delete(`/LeadCnpj/DeleteLeadCnpj/${id}`);
    } catch (error) {
      console.error(`Error deleting lead with id ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }
};