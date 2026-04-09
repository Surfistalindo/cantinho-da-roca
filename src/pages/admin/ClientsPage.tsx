import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { UserCheck } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    setClients((data as Client[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  if (loading) return <p className="text-muted-foreground text-sm py-12 text-center">Carregando...</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold font-heading">Clientes</h2>

      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum cliente cadastrado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Leads convertidos aparecerão aqui.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.phone ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
