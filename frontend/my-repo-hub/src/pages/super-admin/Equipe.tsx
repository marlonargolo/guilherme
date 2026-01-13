import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, UserPlus, Shield, Edit, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastAccess: string;
  isSuperAdmin: boolean;
}

const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "Guilherme Monteiro",
    email: "guilhermemonteiro@g8prospect.com.br",
    role: "Super Admin",
    permissions: [
      "usuarios",
      "pagamentos",
      "integracoes",
      "ia",
      "configuracoes",
      "logs",
      "cobrancas",
      "automacoes",
      "analytics",
      "suporte",
      "equipe",
    ],
    lastAccess: "2025-10-20 18:45",
    isSuperAdmin: true,
  },
  {
    id: "2",
    name: "Ana Silva",
    email: "ana@socialflow.com",
    role: "Admin",
    permissions: ["usuarios", "suporte", "cobrancas"],
    lastAccess: "2025-10-20 16:30",
    isSuperAdmin: false,
  },
  {
    id: "3",
    name: "Carlos Santos",
    email: "carlos@socialflow.com",
    role: "Suporte",
    permissions: ["suporte"],
    lastAccess: "2025-10-19 14:20",
    isSuperAdmin: false,
  },
];

const allPermissions = [
  { id: "usuarios", label: "Usuários" },
  { id: "pagamentos", label: "Pagamentos" },
  { id: "cobrancas", label: "Cobranças" },
  { id: "integracoes", label: "Integrações" },
  { id: "automacoes", label: "Automações" },
  { id: "ia", label: "IA" },
  { id: "analytics", label: "Analytics" },
  { id: "suporte", label: "Suporte" },
  { id: "configuracoes", label: "Configurações" },
  { id: "logs", label: "Logs" },
  { id: "equipe", label: "Equipe" },
];

export default function Equipe() {
  const [team] = useState<TeamMember[]>(mockTeam);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMemberDialog, setNewMemberDialog] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const filteredTeam = team.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((p) => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleCreateMember = () => {
    toast.success("Membro adicionado à equipe!");
    setNewMemberDialog(false);
    setSelectedPermissions([]);
  };

  const handleDeleteMember = (member: TeamMember) => {
    if (member.isSuperAdmin) {
      toast.error("Não é possível remover o Super Admin");
      return;
    }
    toast.success(`${member.name} removido da equipe`);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            Gestão de Equipe
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie administradores e permissões de acesso
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-border/50 hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total de Membros</p>
                  <p className="text-3xl font-bold">{team.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Super Admins</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {team.filter((m) => m.isSuperAdmin).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <Shield className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50 hover-scale">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Membros Ativos</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {team.filter((m) => !m.isSuperAdmin).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <UserPlus className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>
              <Dialog open={newMemberDialog} onOpenChange={setNewMemberDialog}>
                <DialogTrigger asChild>
                  <Button variant="gradient">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Membro
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-border/50 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Membro</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          placeholder="Nome completo"
                          className="bg-background/50 border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          className="bg-background/50 border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Input
                        placeholder="Ex: Suporte, Admin, Analista"
                        className="bg-background/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Permissões</Label>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-muted/20 rounded-lg border border-border/50">
                        {allPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handleTogglePermission(permission.id)}
                            />
                            <label
                              htmlFor={permission.id}
                              className="text-sm text-gray-300 cursor-pointer"
                            >
                              {permission.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" onClick={handleCreateMember}>
                      Adicionar Membro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Team Table */}
        <Card className="glass-card border-border/50">
          <CardContent className="pt-6">
            <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 bg-muted/30">
                  <TableHead className="text-muted-foreground font-semibold">Nome</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">E-mail</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Função</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Permissões</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Último Acesso</TableHead>
                  <TableHead className="text-muted-foreground font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeam.map((member) => (
                  <TableRow key={member.id} className="border-border/50 hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{member.name}</span>
                        {member.isSuperAdmin && (
                          <Shield className="h-4 w-4 text-purple-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          member.isSuperAdmin
                            ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                            : "border-gray-700"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.permissions.slice(0, 3).map((perm) => (
                          <Badge
                            key={perm}
                            variant="outline"
                            className="text-xs border-gray-700"
                          >
                            {allPermissions.find((p) => p.id === perm)?.label}
                          </Badge>
                        ))}
                        {member.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs border-gray-700">
                            +{member.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">{member.lastAccess}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!member.isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMember(member)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
