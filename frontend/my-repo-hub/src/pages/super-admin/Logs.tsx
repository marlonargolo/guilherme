import { useState, useEffect } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Download, FileText, AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  created_at: string;
  level: 'info' | 'warning' | 'error';
}

const levelColors = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
};

const levelIcons = {
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,
};

export default function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      const { data: logsData, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles!audit_logs_user_id_fkey (
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedLogs: AuditLog[] = (logsData || []).map((log: any) => ({
        id: log.id,
        user_id: log.user_id,
        user_email: log.profiles?.email || 'Sistema',
        action: log.action,
        resource: log.resource,
        details: log.details,
        ip_address: log.ip_address,
        created_at: new Date(log.created_at).toLocaleString('pt-BR'),
        level: log.level || 'info',
      }));

      setLogs(formattedLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesLevel && matchesAction;
  });

  const stats = {
    total: logs.length,
    info: logs.filter((l) => l.level === "info").length,
    warning: logs.filter((l) => l.level === "warning").length,
    error: logs.filter((l) => l.level === "error").length,
  };

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  const handleExport = () => {
    const csv = [
      ['Data', 'Usuário', 'Ação', 'Recurso', 'Nível', 'IP', 'Detalhes'],
      ...filteredLogs.map(log => [
        log.created_at,
        log.user_email,
        log.action,
        log.resource,
        log.level,
        log.ip_address,
        log.details
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    toast.success("Logs exportados com sucesso");
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Logs de Auditoria</h1>
            <p className="text-gray-400 mt-1 text-sm md:text-base">
              Monitoramento e auditoria de atividades do sistema
            </p>
          </div>
          <Button onClick={loadLogs} variant="outline" disabled={loading} size="sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Info</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-500">{stats.info}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Avisos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">{stats.warning}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Erros</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{stats.error}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ação, usuário ou recurso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0a0e1a] border-gray-700 text-white"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-[#0a0e1a] border-gray-700 text-white">
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0e1a] border-gray-700 text-white">
                    <SelectValue placeholder="Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="border-gray-700 flex-1 sm:flex-none"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="bg-[#111827] border-gray-800">
          <CardContent className="pt-6 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-400">Data/Hora</TableHead>
                    <TableHead className="text-gray-400 hidden md:table-cell">Usuário</TableHead>
                    <TableHead className="text-gray-400">Ação</TableHead>
                    <TableHead className="text-gray-400 hidden lg:table-cell">Recurso</TableHead>
                    <TableHead className="text-gray-400">Nível</TableHead>
                    <TableHead className="text-gray-400 hidden xl:table-cell">IP</TableHead>
                    <TableHead className="text-gray-400 hidden xl:table-cell">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const LevelIcon = levelIcons[log.level];
                    return (
                      <TableRow key={log.id} className="border-gray-800">
                        <TableCell className="text-white text-sm">{log.created_at}</TableCell>
                        <TableCell className="text-gray-400 hidden md:table-cell">{log.user_email}</TableCell>
                        <TableCell className="text-white font-medium">{log.action}</TableCell>
                        <TableCell className="text-gray-400 hidden lg:table-cell">{log.resource}</TableCell>
                        <TableCell>
                          <Badge className={levelColors[log.level]}>
                            <LevelIcon className="h-3 w-3 mr-1" />
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400 hidden xl:table-cell">{log.ip_address}</TableCell>
                        <TableCell className="text-gray-400 hidden xl:table-cell max-w-xs truncate">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            {!loading && filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum log encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
