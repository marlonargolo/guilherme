import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trash2, Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "editor" | "viewer";
}

export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as "editor" | "viewer",
  });

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.password) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (teamMembers.length >= 2) {
      toast.error("Limite de 2 membros da equipe atingido");
      return;
    }

    const member: TeamMember = {
      id: Date.now().toString(),
      ...newMember,
    };

    setTeamMembers([...teamMembers, member]);
    setNewMember({ name: "", email: "", password: "", role: "viewer" });
    setIsOpen(false);
    toast.success("Membro adicionado com sucesso");
  };

  const handleRemoveMember = (id: string) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
    toast.success("Membro removido");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Membros da Equipe</h3>
          <p className="text-sm text-muted-foreground">
            Adicione até 2 membros para colaborar ({teamMembers.length}/2)
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              disabled={teamMembers.length >= 2}
              className="btn-glow"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Equipe</DialogTitle>
              <DialogDescription>
                Configure os dados de acesso do novo membro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={newMember.name}
                  onChange={(e) =>
                    setNewMember({ ...newMember, name: e.target.value })
                  }
                  placeholder="Nome completo"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) =>
                    setNewMember({ ...newMember, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={newMember.password}
                  onChange={(e) =>
                    setNewMember({ ...newMember, password: e.target.value })
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Permissão</Label>
                <Select
                  value={newMember.role}
                  onValueChange={(value: "editor" | "viewer") =>
                    setNewMember({ ...newMember, role: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      Visualizador - Apenas visualiza campanhas
                    </SelectItem>
                    <SelectItem value="editor">
                      Editor - Pode criar e editar campanhas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} className="w-full btn-glow">
                Adicionar Membro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teamMembers.length === 0 ? (
        <Card className="p-8 text-center">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Nenhum membro adicionado ainda
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={member.role === "editor" ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {member.role === "editor" ? (
                      <Edit className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    {member.role === "editor" ? "Editor" : "Visualizador"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
