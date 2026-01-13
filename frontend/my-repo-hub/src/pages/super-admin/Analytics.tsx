import { useState } from "react";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Users, TrendingUp, Zap, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const userGrowthData = [
  { date: "01/10", users: 120 },
  { date: "08/10", users: 145 },
  { date: "15/10", users: 168 },
  { date: "22/10", users: 195 },
  { date: "29/10", users: 220 },
];

const channelEngagementData = [
  { channel: "Instagram", messages: 1250 },
  { channel: "WhatsApp", messages: 980 },
  { channel: "Telegram", messages: 420 },
];

const aiUsageData = [
  { plan: "Free", tokens: 12000 },
  { plan: "Pro", tokens: 45000 },
  { plan: "Business", tokens: 98000 },
];

const revenueVsCancellationsData = [
  { month: "Jun", revenue: 4200, cancellations: 3 },
  { month: "Jul", revenue: 5100, cancellations: 2 },
  { month: "Ago", revenue: 6800, cancellations: 5 },
  { month: "Set", revenue: 7500, cancellations: 1 },
  { month: "Out", revenue: 8900, cancellations: 2 },
];

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  const [selectedApp, setSelectedApp] = useState("all");

  const handleExport = (format: "pdf" | "csv") => {
    toast.success(`Exportando relatório em ${format.toUpperCase()}...`);
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Geral</h1>
            <p className="text-gray-400 mt-1">
              Visualize métricas consolidadas de todos os apps
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedApp} onValueChange={setSelectedApp}>
              <SelectTrigger className="w-[200px] bg-[#111827] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Apps</SelectItem>
                <SelectItem value="social_flow">Social Flow</SelectItem>
                <SelectItem value="intelligent_agent">Intelligent Agent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-[#111827] border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              className="border-gray-700"
              onClick={() => handleExport("pdf")}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              className="border-gray-700"
              onClick={() => handleExport("csv")}
            >
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">220</p>
              <p className="text-sm text-green-500 mt-1">+18.3% vs mês anterior</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">+83%</p>
              <p className="text-sm text-gray-400 mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Tokens IA Usados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-500">155K</p>
              <p className="text-sm text-gray-400 mt-1">Últimos 30 dias</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">R$ 8.900</p>
              <p className="text-sm text-green-500 mt-1">+18.7% vs mês anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Crescimento de Usuários</CardTitle>
              <p className="text-sm text-gray-400">Últimos 30 dias</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Usuários"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Channel Engagement Chart */}
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Engajamento por Canal</CardTitle>
              <p className="text-sm text-gray-400">Mensagens enviadas</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={channelEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="channel" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="messages" fill="#3B82F6" name="Mensagens" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Usage by Plan Chart */}
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Uso de IA por Plano</CardTitle>
              <p className="text-sm text-gray-400">Tokens consumidos</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aiUsageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="tokens"
                  >
                    {aiUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue vs Cancellations Chart */}
          <Card className="bg-[#111827] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Receita x Cancelamentos</CardTitle>
              <p className="text-sm text-gray-400">Últimos 5 meses</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueVsCancellationsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Receita (R$)"
                  />
                  <Line
                    type="monotone"
                    dataKey="cancellations"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="Cancelamentos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
