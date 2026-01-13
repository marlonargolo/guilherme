import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Activity,
  Download,
  Calendar,
  Filter,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const analytics = {
  overview: [
    { metric: "Mensagens Processadas", value: "12.847", change: "+23.4%", trend: "up" },
    { metric: "Tempo Médio Resposta", value: "0.8s", change: "-45%", trend: "up" },
    { metric: "Taxa Automação IA", value: "94%", change: "+12%", trend: "up" },
    { metric: "Satisfação Cliente", value: "96.2%", change: "+5.2%", trend: "up" },
  ],
  platforms: [
    { name: "Instagram", followers: "45.2K", engagement: "8.7%", posts: 234 },
    { name: "TikTok", followers: "28.9K", engagement: "12.3%", posts: 189 },
    { name: "Facebook", followers: "15.6K", engagement: "4.2%", posts: 156 },
    { name: "LinkedIn", followers: "8.3K", engagement: "6.8%", posts: 89 },
  ],
  sentiment: {
    positive: 67,
    neutral: 24,
    negative: 9,
  },
};

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const handleApplyFilters = () => {
    toast.success("Filtros aplicados com sucesso!");
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    toast.success("Gerando relatório Excel...");
    
    setTimeout(() => {
      const workbook = XLSX.utils.book_new();
      
      // Aba de Overview
      const overviewData = analytics.overview.map(item => ({
        'Métrica': item.metric,
        'Valor': item.value,
        'Variação': item.change,
        'Tendência': item.trend === 'up' ? 'Crescimento' : 'Declínio'
      }));
      const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");
      
      // Aba de Plataformas
      const platformsData = analytics.platforms.map(p => ({
        'Plataforma': p.name,
        'Seguidores': p.followers,
        'Engajamento': p.engagement,
        'Posts': p.posts
      }));
      const platformsSheet = XLSX.utils.json_to_sheet(platformsData);
      XLSX.utils.book_append_sheet(workbook, platformsSheet, "Plataformas");
      
      // Aba de Sentimento
      const sentimentData = [
        { 'Tipo': 'Positivo', 'Percentual': `${analytics.sentiment.positive}%` },
        { 'Tipo': 'Neutro', 'Percentual': `${analytics.sentiment.neutral}%` },
        { 'Tipo': 'Negativo', 'Percentual': `${analytics.sentiment.negative}%` }
      ];
      const sentimentSheet = XLSX.utils.json_to_sheet(sentimentData);
      XLSX.utils.book_append_sheet(workbook, sentimentSheet, "Sentimento");
      
      XLSX.writeFile(workbook, `analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setIsExporting(false);
      toast.success("Relatório Excel exportado com sucesso!");
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.15)]">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Análise
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada de performance e ROI da automação
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="gradient">
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}`
                  : "Período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range: any) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  handleApplyFilters();
                }}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="gradient">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Plataforma</h4>
                  <div className="space-y-2">
                    {["all", "instagram", "tiktok", "facebook", "linkedin"].map((platform) => (
                      <Button
                        key={platform}
                        variant={selectedPlatform === platform ? "default" : "outline"}
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => {
                          setSelectedPlatform(platform);
                          handleApplyFilters();
                        }}
                      >
                        {platform === "all" ? "Todas" : platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button 
            className="btn-glow"
            onClick={handleExportExcel}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.overview.map((item, index) => (
          <Card key={index} className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{item.metric}</p>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                item.trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {item.trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {item.change}
              </div>
            </div>
            <p className="text-2xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Card className="glass-card p-6">
        <Tabs defaultValue="sentiment">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="sentiment">Sentimento</TabsTrigger>
            <TabsTrigger value="automation">Automação</TabsTrigger>
          </TabsList>

          <TabsContent value="sentiment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Análise de Sentimento</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Positivo</span>
                      <span className="text-sm font-bold text-green-500">{analytics.sentiment.positive}%</span>
                    </div>
                    <Progress value={analytics.sentiment.positive} className="h-3 bg-green-500/20" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Neutro</span>
                      <span className="text-sm font-bold text-yellow-500">{analytics.sentiment.neutral}%</span>
                    </div>
                    <Progress value={analytics.sentiment.neutral} className="h-3 bg-yellow-500/20" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Negativo</span>
                      <span className="text-sm font-bold text-red-500">{analytics.sentiment.negative}%</span>
                    </div>
                    <Progress value={analytics.sentiment.negative} className="h-3 bg-red-500/20" />
                  </div>
                </div>
              </Card>

              <Card className="p-6 backdrop-blur-xl bg-background/70 border-purple-500/20 shadow-lg">
                <h3 className="font-semibold mb-4">Palavras Mais Mencionadas</h3>
                <div className="flex flex-wrap gap-2">
                  {["produto", "qualidade", "entrega", "preço", "atendimento", "excelente", "rápido", "recomendo"].map((word, index) => (
                    <Badge
                      key={word}
                      variant="outline"
                      className={cn(
                        "px-4 py-2 text-base font-medium",
                        index < 3 && "border-primary text-primary bg-primary/10"
                      )}
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <Activity className="h-8 w-8 text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Mensagens Processadas</p>
                <p className="text-3xl font-bold">12.847</p>
                <p className="text-xs text-green-500 mt-1">94% pela IA</p>
              </Card>

              <Card className="p-6">
                <MessageSquare className="h-8 w-8 text-accent mb-3" />
                <p className="text-sm text-muted-foreground">Tempo Médio Resposta</p>
                <p className="text-3xl font-bold">0.8s</p>
                <p className="text-xs text-muted-foreground mt-1">vs 2.5min manual</p>
              </Card>

              <Card className="p-6">
                <Users className="h-8 w-8 text-green-500 mb-3" />
                <p className="text-sm text-muted-foreground">Satisfação Cliente</p>
                <p className="text-3xl font-bold">96.2%</p>
                <p className="text-xs text-green-500 mt-1">+12% com IA</p>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
              <h3 className="font-semibold mb-4">Performance da Automação IA</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">487</p>
                  <p className="text-sm text-muted-foreground">Horas economizadas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">94%</p>
                  <p className="text-sm text-muted-foreground">Taxa automação</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-yellow-500">4.8</p>
                  <p className="text-sm text-muted-foreground">Score qualidade IA</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}