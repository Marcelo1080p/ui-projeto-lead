"use client";
import { useState, useEffect } from "react";
import { LeadService, type LeadCnpjDTO, type CreateLeadCnpjDTO, type UpdateLeadCnpjDTO } from "../services/leadService";

export default function CadastroLeads() {
  const [leads, setLeads] = useState<LeadCnpjDTO[]>([]);
  const [currentLead, setCurrentLead] = useState<Partial<CreateLeadCnpjDTO & { id?: number }>>({});
  const [mode, setMode] = useState<"list" | "form" | "view">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  
  const formatCNPJ = (value: string) => {
    if (!value) return "";
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };


  const formatCEP = (value: string) => {
    if (!value) return "";
    return value.replace(/\D/g, "").replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const fetchAddressByCEP = async (cep: string) => {
    if (cep.length < 8) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setCurrentLead(prev => ({
          ...prev,
          Cep: formatCEP(cep),
          Address: data.logradouro || "",
          Neighborhood: data.bairro || "",
          City: data.localidade || "",
          State: data.uf || "",
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setError("Erro ao buscar endereço. Verifique o CEP e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  
  const loadLeads = async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await LeadService.getAllLeads();
      setLeads(data);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      setError("Erro ao carregar lista de leads. Tente recarregar a página.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  
  const loadLead = async (id: number) => {
    setIsLoading(true);
    setError("");
    try {
      const lead = await LeadService.getLeadById(id);
      
      
      setCurrentLead({
        id: lead.id,
        Cnpj: formatCNPJ(lead.cnpj),
        CorporateReason: lead.corporateReason,
        Cep: formatCEP(lead.cep),
        Address: lead.address,
        Number: lead.number,
        Complement: lead.complement,
        Neighborhood: lead.neighborhood,
        City: lead.city,
        State: lead.state
      });
      
      return lead;
    } catch (error) {
      console.error(`Erro ao carregar lead com ID ${id}:`, error);
      setError("Erro ao carregar dados do lead. Tente novamente.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleViewLead = async (id: number) => {
    await loadLead(id);
    setMode("view");
  };

  
  const handleEditLead = async (id: number) => {
    await loadLead(id);
    setMode("form");
  };

 
  const handleDeleteLead = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    
    setIsLoading(true);
    try {
      await LeadService.deleteLead(id);
      await loadLeads(); 
    } catch (error) {
      console.error(`Erro ao excluir lead com ID ${id}:`, error);
      setError("Erro ao excluir lead. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "Cnpj") {
      setCurrentLead(prev => ({ ...prev, [name]: formatCNPJ(value) }));
    } else if (name === "Cep") {
      const formattedCEP = formatCEP(value);
      setCurrentLead(prev => ({ ...prev, [name]: formattedCEP }));
      
      
      if (formattedCEP.length === 9) {
        fetchAddressByCEP(formattedCEP);
      }
    } else {
      setCurrentLead(prev => ({ ...prev, [name]: value }));
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    
    try {
      
      const leadData = {
        Cnpj: currentLead.Cnpj?.replace(/\D/g, "") || "",
        CorporateReason: currentLead.CorporateReason || "",
        Cep: currentLead.Cep?.replace(/\D/g, "") || "",
        Address: currentLead.Address || "",
        Number: currentLead.Number || "",
        Complement: currentLead.Complement || "",
        Neighborhood: currentLead.Neighborhood || "",
        City: currentLead.City || "",
        State: currentLead.State || ""
      };

     
      if (!leadData.Cnpj || leadData.Cnpj.length < 14) {
        throw new Error("CNPJ inválido");
      }

      let updatedLeads: LeadCnpjDTO[];
      if (currentLead.id) {
       
        const updatedLead = await LeadService.updateLead(currentLead.id, leadData);
        updatedLeads = leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead);
      } else {
        
        const createdLead = await LeadService.createLead(leadData as CreateLeadCnpjDTO);
        updatedLeads = [...leads, createdLead];
      }
      
      setLeads(updatedLeads);
      setMode("list");
      setCurrentLead({});
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      if (typeof error === "object" && error !== null && "response" in error && (error as any).response?.data?.Message) {
        setError((error as any).response.data.Message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Erro ao salvar lead");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.corporateReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.cnpj.includes(searchTerm.replace(/\D/g, "")) 
  );

  return (
    <div className="container mx-auto p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {mode === "list" ? (
        <>
          <h1 className="text-2xl font-bold mb-6">Cadastro de Leads</h1>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <input
              type="text"
              placeholder="Pesquisar por CNPJ ou Razão Social"
              className="border p-2 rounded w-full md:w-1/2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <button
              onClick={() => {
                setCurrentLead({});
                setMode("form");
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded whitespace-nowrap"
              disabled={isLoading}
            >
              {isLoading ? "Carregando..." : "Novo Lead"}
            </button>
          </div>
          
          {isLoading && !leads.length ? (
            <div className="text-center py-8">Carregando leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              {searchTerm ? "Nenhum lead encontrado" : "Nenhum lead cadastrado"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border text-left">CNPJ</th>
                    <th className="py-3 px-4 border text-left">Razão Social</th>
                    <th className="py-3 px-4 border text-left">CEP</th>
                    <th className="py-3 px-4 border text-left">Estado</th>
                    <th className="py-3 px-4 border text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border">{formatCNPJ(lead.cnpj)}</td>
                      <td className="py-3 px-4 border">{lead.corporateReason}</td>
                      <td className="py-3 px-4 border">{formatCEP(lead.cep)}</td>
                      <td className="py-3 px-4 border">{lead.state}</td>
                      <td className="py-3 px-4 border">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewLead(lead.id)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Visualizar"
                            disabled={isLoading}
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => handleEditLead(lead.id)}
                            className="text-yellow-500 hover:text-yellow-700 p-1"
                            title="Editar"
                            disabled={isLoading}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Excluir"
                            disabled={isLoading}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : mode === "form" ? (
        <>
          <h1 className="text-2xl font-bold mb-6">
            {currentLead.id ? "Editar Lead" : "Cadastrar Lead"}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">CNPJ *</label>
                <input
                  type="text"
                  name="Cnpj"
                  value={currentLead.Cnpj || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  required
                  disabled={!!currentLead.id} 
                />
              </div>
              
              <div>
                <label className="block mb-1">Razão Social *</label>
                <input
                  type="text"
                  name="CorporateReason"
                  value={currentLead.CorporateReason || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1">CEP *</label>
                <div className="flex">
                  <input
                    type="text"
                    name="Cep"
                    value={currentLead.Cep || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded-l w-full"
                    placeholder="00000-000"
                    maxLength={9}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => currentLead.Cep && fetchAddressByCEP(currentLead.Cep)}
                    className="bg-gray-200 px-4 rounded-r hover:bg-gray-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "..." : "Buscar"}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block mb-1">Endereço *</label>
                <input
                  type="text"
                  name="Address"
                  value={currentLead.Address || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1">Número *</label>
                <input
                  type="text"
                  name="Number"
                  value={currentLead.Number || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1">Complemento</label>
                <input
                  type="text"
                  name="Complement"
                  value={currentLead.Complement || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                />
              </div>
              
              <div>
                <label className="block mb-1">Bairro *</label>
                <input
                  type="text"
                  name="Neighborhood"
                  value={currentLead.Neighborhood || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1">Cidade *</label>
                <input
                  type="text"
                  name="City"
                  value={currentLead.City || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-1">Estado *</label>
                <input
                  type="text"
                  name="State"
                  value={currentLead.State || ""}
                  onChange={handleInputChange}
                  className="border p-2 rounded w-full"
                  maxLength={2}
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setMode("list");
                  setCurrentLead({});
                  setError("");
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </>
      ) : (
        
        <>
          <h1 className="text-2xl font-bold mb-6">Detalhes do Lead</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h2 className="font-semibold">CNPJ:</h2>
                <p>{currentLead.Cnpj}</p>
              </div>
              <div>
                <h2 className="font-semibold">Razão Social:</h2>
                <p>{currentLead.CorporateReason}</p>
              </div>
              <div>
                <h2 className="font-semibold">CEP:</h2>
                <p>{currentLead.Cep}</p>
              </div>
              <div>
                <h2 className="font-semibold">Endereço:</h2>
                <p>{currentLead.Address}</p>
              </div>
              <div>
                <h2 className="font-semibold">Número:</h2>
                <p>{currentLead.Number}</p>
              </div>
              <div>
                <h2 className="font-semibold">Complemento:</h2>
                <p>{currentLead.Complement || "-"}</p>
              </div>
              <div>
                <h2 className="font-semibold">Bairro:</h2>
                <p>{currentLead.Neighborhood}</p>
              </div>
              <div>
                <h2 className="font-semibold">Cidade:</h2>
                <p>{currentLead.City}</p>
              </div>
              <div>
                <h2 className="font-semibold">Estado:</h2>
                <p>{currentLead.State}</p>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  if (currentLead.id) handleEditLead(currentLead.id);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
              >
                Editar
              </button>
              <button
                onClick={() => setMode("list")}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Voltar para lista
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}