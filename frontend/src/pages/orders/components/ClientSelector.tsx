import { useEffect, useState } from "react";
import { Mail, Phone, Search, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { clientService } from "@/services/client.service";
import type { Client } from "@/types";

interface ClientSelectorProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onClearSelection: () => void;
  error?: string;
}

export function ClientSelector({
  selectedClient,
  onSelectClient,
  onClearSelection,
  error,
}: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState(selectedClient?.name ?? "");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 250);

  useEffect(() => {
    setSearchTerm(selectedClient?.name ?? "");
  }, [selectedClient]);

  useEffect(() => {
    let isCurrent = true;

    const searchClients = async () => {
      const query = debouncedSearchTerm;

      if (!showResults || query.length < 2) {
        if (isCurrent) {
          setResults([]);
          setIsSearching(false);
        }
        return;
      }

      setIsSearching(true);

      try {
        const response = await clientService.getClients({
          search: query,
          limit: 8,
          page: 1,
        });

        if (isCurrent) {
          setResults(response.data);
        }
      } catch {
        if (isCurrent) {
          setResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    };

    void searchClients();

    return () => {
      isCurrent = false;
    };
  }, [debouncedSearchTerm, showResults]);

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    setShowResults(true);

    if (!selectedClient) {
      return;
    }

    if (value.trim().toLowerCase() !== selectedClient.name.trim().toLowerCase()) {
      onClearSelection();
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Buscar cliente por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setShowResults(true)}
          className={`bg-white pl-10 ${error ? "border-red-500" : ""}`}
        />

        {searchTerm && showResults && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-white shadow-lg">
            {isSearching ? (
              <div className="px-4 py-3 text-sm text-gray-500">Buscando clientes...</div>
            ) : results.length > 0 ? (
              <div className="max-h-72 overflow-auto">
                {results.map((client) => (
                  <button
                    key={client._id}
                    type="button"
                    className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50 last:border-b-0"
                    onClick={() => {
                      onSelectClient(client);
                      setSearchTerm(client.name);
                      setShowResults(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{client.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>{client.email || "Sin email"}</span>
                          <span>{client.phone || "Sin teléfono"}</span>
                        </div>
                      </div>
                      <Badge variant="outline">Cliente</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                No hay coincidencias. Registra un nuevo cliente si aún no existe.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedClient && (
        <div className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User className="h-4 w-4 text-blue-600" />
              {selectedClient.name}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {selectedClient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{selectedClient.email}</span>
                </div>
              )}
              {selectedClient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{selectedClient.phone}</span>
                </div>
              )}
              {!selectedClient.email && !selectedClient.phone && (
                <span className="text-xs text-gray-500">Cliente sin datos de contacto adicionales</span>
              )}
            </div>
          </div>
          <div className="flex items-start justify-end">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Seleccionado</Badge>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      <p className="text-xs text-gray-500">
        Busca por nombre, email o teléfono. El nombre y el email del cliente son únicos.
      </p>
    </div>
  );
}