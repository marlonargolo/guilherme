import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Zap,
  Activity,
  Target,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2,
  Bell,
  Eye,
} from "lucide-react";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { getCache, setCache } from "@/utils/cache";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  time: string;
  sentAt: string;
  read: boolean;
  priority: "high" | "medium" | "low";
};

type InsightItem = {
  type: "success" | "warning" | "info";
  title: string;
  description: string;
  time: string;
};

const INSIGHT_PRIORITY: Record<InsightItem["type"], number> = {
  warning: 0,
  info: 1,
  success: 2,
};

interface MetricsSummary {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  aiResponseRate: number;
  waitingReview: number;
}

type ConversationSummary = {
  id: string;
  status: string;
  ai_status?: string | null;
  unread_count?: number | null;
  last_message_at?: string | null;
  created_at?: string | null;
  platform: string;
  contact?: { name?: string | null } | null;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const ACTIVITY_RANGE_CONFIG = {
  "1H": { windowMs: HOUR, bucketMs: 5 * MINUTE, label: "HH:mm" },
  "24H": { windowMs: 24 * HOUR, bucketMs: HOUR, label: "HH:mm" },
  "7D": { windowMs: 7 * DAY, bucketMs: DAY, label: "dd/MM" },
  "30D": { windowMs: 30 * DAY, bucketMs: DAY, label: "dd/MM" },
} as const;

type TimeRange = keyof typeof ACTIVITY_RANGE_CONFIG;
const TIME_RANGES: TimeRange[] = ["1H", "24H", "7D", "30D"];

type ActivityDataPoint = {
  key: number;
  label: string;
  totalMessages: number;
  aiMessages: number;
  humanMessages: number;
};

type ActivityMeta = {
  peakLabel: string | null;
  peakValue: number;
  aiShare: number;
  totalMessages: number;
};

type RawMessagePoint = {
  id: string;
  sender_type?: string | null;
  created_at: string;
};

type MetricsCachePayload = {
  summary: MetricsSummary;
  notifications: NotificationItem[];
  conversations: ConversationSummary[];
  conversationIds: string[];
  updatedAt: string;
};

type ActivityCachePayload = {
  points: ActivityDataPoint[];
  meta: ActivityMeta;
  signature: string;
};

const METRICS_CACHE_TTL = 60 * 1000;
const ACTIVITY_CACHE_TTL = 5 * 60 * 1000;
const MAX_SIGNATURE_IDS = 50;

const buildCacheKey = (userId: string, suffix: string) => `dashboard:${userId}:${suffix}`;
const buildSignature = (ids: string[]) => ids.slice(0, MAX_SIGNATURE_IDS).join("|");

const buildInsights = (
  summary: MetricsSummary,
  conversations: ConversationSummary[],
  activityMeta?: ActivityMeta | null
): InsightItem[] => {
  const insights: InsightItem[] = [];
  const nowText = formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR });

  insights.push({
    type: summary.aiResponseRate >= 80 ? "success" : "info",
    title: "Taxa de respostas por IA",
    description:
      summary.aiResponseRate >= 80
        ? "A IA está respondendo à maioria das interações."
        : "Considere ativar mais automações para elevar a taxa de respostas por IA.",
    time: nowText,
  });

  if (summary.waitingReview > 0) {
    insights.push({
      type: "warning",
      title: "Conversas aguardando revisão",
      description: `${summary.waitingReview} conversas aguardam ação humana antes do envio.`,
      time: nowText,
    });
  }

  const highUnread = conversations.find((c) => (c.unread_count ?? 0) >= 5);
  if (highUnread) {
    insights.push({
      type: "info",
      title: "Conversas com muitas mensagens não lidas",
      description: `${highUnread.contact?.name ?? highUnread.platform} acumula ${highUnread.unread_count} mensagens pendentes.`,
      time: nowText,
    });
  }

  const platformStats = conversations.reduce<Record<string, number>>((acc, conversation) => {
    const key = conversation.platform || "outros";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const topPlatformEntry = Object.entries(platformStats).sort((a, b) => b[1] - a[1])[0];
  if (topPlatformEntry && topPlatformEntry[1] > 0) {
    insights.push({
      type: "info",
      title: "Plataforma mais ativa",
      description: `${topPlatformEntry[0]} concentra ${topPlatformEntry[1]} conversas ativas.`,
      time: nowText,
    });
  }

  if (activityMeta && activityMeta.totalMessages > 0) {
    insights.push({
      type: activityMeta.aiShare >= 60 ? "success" : "warning",
      title: "Participação da IA",
      description: `A IA respondeu ${activityMeta.aiShare.toFixed(1)}% das mensagens no período monitorado.`,
      time: nowText,
    });
    if (activityMeta.peakLabel) {
      insights.push({
        type: "info",
        title: "Pico de atividade",
        description: `Maior volume de mensagens (${activityMeta.peakValue}) registrado por volta de ${activityMeta.peakLabel}.`,
        time: nowText,
      });
    }
  }

  const staleConversation = conversations.find((conversation) => {
    const reference = conversation.last_message_at ?? conversation.created_at;
    if (!reference) return false;
    const hoursSinceLast = (Date.now() - new Date(reference).getTime()) / HOUR;
    return hoursSinceLast >= 12 && (conversation.unread_count ?? 0) > 0;
  });
  if (staleConversation) {
    insights.push({
      type: "warning",
      title: "Conversa inativa com pendências",
      description: `${staleConversation.contact?.name ?? staleConversation.platform} está sem resposta há mais de 12 horas.`,
      time: nowText,
    });
  }

  return insights.sort((a, b) => INSIGHT_PRIORITY[a.type] - INSIGHT_PRIORITY[b.type]);
};

const generateEmptyBuckets = (start: Date, end: Date, config: (typeof ACTIVITY_RANGE_CONFIG)[TimeRange]): Map<number, ActivityDataPoint> => {
  const bucketMap = new Map<number, ActivityDataPoint>();
  for (let ts = start.getTime(); ts <= end.getTime(); ts += config.bucketMs) {
    const bucketDate = new Date(ts);
    bucketMap.set(ts, {
      key: ts,
      label: format(bucketDate, config.label, { locale: ptBR }),
      totalMessages: 0,
      aiMessages: 0,
      humanMessages: 0,
    });
  }
  return bucketMap;
};

const buildActivityBuckets = (
  rawMessages: RawMessagePoint[],
  start: Date,
  end: Date,
  config: (typeof ACTIVITY_RANGE_CONFIG)[TimeRange]
): { points: ActivityDataPoint[]; meta: ActivityMeta } => {
  const startMs = start.getTime();
  const bucketMap = generateEmptyBuckets(start, end, config);
  let totalAi = 0;
  let totalMessages = 0;

  rawMessages.forEach((message) => {
    const createdAt = new Date(message.created_at);
    if (createdAt < start || createdAt > end) return;
    const bucketIndex = Math.floor((createdAt.getTime() - startMs) / config.bucketMs);
    const bucketStart = startMs + bucketIndex * config.bucketMs;
    const bucket = bucketMap.get(bucketStart);
    if (!bucket) return;

    bucket.totalMessages += 1;
    totalMessages += 1;
    if (message.sender_type === "ai") {
      bucket.aiMessages += 1;
      totalAi += 1;
    } else {
      bucket.humanMessages += 1;
    }
  });

  if (bucketMap.size === 0) {
    const fallbackBucket = {
      key: startMs,
      label: format(start, config.label, { locale: ptBR }),
      totalMessages: 0,
      aiMessages: 0,
      humanMessages: 0,
    };
    bucketMap.set(startMs, fallbackBucket);
  }

  const points = Array.from(bucketMap.values());
  const peakPoint = points.reduce<ActivityDataPoint | null>((currentPeak, point) => {
    if (!currentPeak || point.totalMessages > currentPeak.totalMessages) {
      return point;
    }
    return currentPeak;
  }, null);

  const meta: ActivityMeta = {
    peakLabel: peakPoint && peakPoint.totalMessages > 0 ? peakPoint.label : null,
    peakValue: peakPoint?.totalMessages ?? 0,
    aiShare: totalMessages ? (totalAi / totalMessages) * 100 : 0,
    totalMessages,
  };

  return { points, meta };
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>("24H");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [realMetrics, setRealMetrics] = useState<MetricsSummary | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [activityData, setActivityData] = useState<ActivityDataPoint[]>([]);
  const [activityMeta, setActivityMeta] = useState<ActivityMeta | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [latestConversations, setLatestConversations] = useState<ConversationSummary[]>([]);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Sem fallback - apenas dados reais
  const metrics = realMetrics ? [
    {
      title: t('dashboard.metrics.aiResponse'),
      value: `${realMetrics.aiResponseRate.toFixed(1)}%`,
      change: "—",
      trend: "up" as const,
      icon: Zap,
      description: t('dashboard.metrics.last24h'),
      progress: Math.min(realMetrics.aiResponseRate, 100),
    },
    {
      title: t('dashboard.metrics.messages'),
      value: realMetrics.totalMessages.toString(),
      change: "—",
      trend: "up" as const,
      icon: MessageSquare,
      description: t('dashboard.metrics.today'),
      progress: Math.min((realMetrics.totalMessages / 100) * 100, 100),
    },
    {
      title: "Conversas Ativas",
      value: realMetrics.activeConversations.toString(),
      change: "—",
      trend: "up" as const,
      icon: Users,
      description: "Total de conversas ativas",
      progress: Math.min((realMetrics.activeConversations / 50) * 100, 100),
    },
    {
      title: "Total de Conversas",
      value: realMetrics.totalConversations.toString(),
      change: "—",
      trend: "up" as const,
      icon: MessageSquare,
      description: "Todas as conversas",
      progress: Math.min((realMetrics.totalConversations / 100) * 100, 100),
    },
  ] : [];

  const hasInsights = insights.length > 0;
  const displayedInsights = showAllInsights ? insights : insights.slice(0, 3);
  const activityStats = [
    {
      label: "Total no período",
      value: activityMeta?.totalMessages ?? 0,
      description: `Janela ${activeTimeRange}`,
    },
    {
      label: "Participação IA",
      value: activityMeta ? `${activityMeta.aiShare.toFixed(1)}%` : "0.0%",
      description: "Mensagens respondidas pela IA",
    },
    {
      label: "Pico de atividade",
      value: activityMeta?.peakValue ?? 0,
      description: activityMeta?.peakLabel ? `por volta de ${activityMeta.peakLabel}` : "Sem picos registrados",
    },
  ];
  const lastUpdatedText = lastUpdatedAt ? formatDistanceToNow(lastUpdatedAt, { addSuffix: true, locale: ptBR }) : null;

  const handleExportReport = () => {
    setIsExporting(true);
    toast.success("Gerando relatório Excel...");
    
    setTimeout(() => {
      // Criar dados para o Excel
      const workbook = XLSX.utils.book_new();
      
      // Aba de Métricas
      const metricsData = metrics.map(m => ({
        'Métrica': m.title,
        'Valor': m.value,
        'Variação': m.change,
        'Tendência': m.trend === 'up' ? 'Crescimento' : 'Declínio',
        'Progresso': `${m.progress}%`
      }));
      const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, "Métricas");
      
      // Aba de Insights
      const insightsData = insights.map(i => ({
        'Tipo': i.type === 'success' ? 'Sucesso' : i.type === 'warning' ? 'Atenção' : 'Info',
        'Título': i.title,
        'Descrição': i.description,
        'Hora': i.time
      }));
      const insightsSheet = XLSX.utils.json_to_sheet(insightsData);
      XLSX.utils.book_append_sheet(workbook, insightsSheet, "Insights");
      
      // Exportar arquivo
      XLSX.writeFile(workbook, `relatorio-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setIsExporting(false);
      toast.success("Relatório Excel exportado com sucesso!");
    }, 1500);
  };

  const handleToggleLiveMode = () => {
    const next = !isLiveMode;
    setIsLiveMode(next);
    if (next) {
      loadRealMetrics(true);
    }
    toast.success(next ? "Live Mode ativado - atualizações contínuas" : "Live Mode desativado");
  };

  const loadActivityData = useCallback(async (ids: string[], range: TimeRange, userId: string | null, forceRefresh = false) => {
    if (!ids.length) {
      setActivityData([]);
      setActivityMeta(null);
      return;
    }
    if (!userId) {
      setActivityData([]);
      setActivityMeta(null);
      return;
    }
    const signature = buildSignature(ids);
    const cacheKey = buildCacheKey(userId, `activity:${range}`);
    if (!forceRefresh) {
      const cached = getCache<ActivityCachePayload>(cacheKey);
      if (cached && cached.signature === signature) {
        setActivityData(cached.points);
        setActivityMeta(cached.meta);
        return;
      }
    }
    setIsLoadingActivity(true);
    try {
      const config = ACTIVITY_RANGE_CONFIG[range] ?? ACTIVITY_RANGE_CONFIG["24H"];
      const now = new Date();
      const start = new Date(now.getTime() - config.windowMs);

      const { data, error } = await supabase
        .from('omnichannel_messages')
        .select('id,sender_type,created_at')
        .in('conversation_id', ids)
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: true })
        .limit(5000);

      if (error) throw error;

      const normalized = buildActivityBuckets((data as RawMessagePoint[]) || [], start, now, config);
      setActivityData(normalized.points);
      setActivityMeta(normalized.meta);
      setCache<ActivityCachePayload>(cacheKey, { points: normalized.points, meta: normalized.meta, signature }, ACTIVITY_CACHE_TTL);
    } catch (error) {
      console.error('Error loading activity data:', error);
      toast.error("Não foi possível carregar o gráfico de atividade.");
      setActivityData([]);
      setActivityMeta(null);
    } finally {
      setIsLoadingActivity(false);
    }
  }, []);

  const loadRealMetrics = useCallback(async (forceRefresh = false) => {
    setIsLoadingMetrics(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRealMetrics(null);
        setNotifications([]);
        setInsights([]);
        setActivityData([]);
        setActivityMeta(null);
        setLatestConversations([]);
        setConversationIds([]);
        setCurrentUserId(null);
        setIsLoadingMetrics(false);
        return;
      }
      setCurrentUserId(user.id);
      const metricsCacheKey = buildCacheKey(user.id, "metrics");
      if (!forceRefresh) {
        const cached = getCache<MetricsCachePayload>(metricsCacheKey);
        if (cached) {
          setRealMetrics(cached.summary);
          setNotifications(cached.notifications);
          setLatestConversations(cached.conversations);
          setConversationIds(cached.conversationIds);
          setLastUpdatedAt(cached.updatedAt ? new Date(cached.updatedAt) : new Date());
          setIsLoadingMetrics(false);
          return;
        }
      }

      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('id,status,ai_status,unread_count,last_message_at,created_at,platform,contact:contacts(name)')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      const conversationList: ConversationSummary[] = conversationsData || [];
      const conversationIds = conversationList.map((c) => c.id);

      let totalMessages = 0;
      let aiMessages = 0;

      if (conversationIds.length) {
        const [
          totalMessagesRes,
          aiMessagesRes,
        ] = await Promise.all([
          supabase
            .from('omnichannel_messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', conversationIds),
          supabase
            .from('omnichannel_messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .eq('sender_type', 'ai'),
        ]);

        if (totalMessagesRes.error) throw totalMessagesRes.error;
        if (aiMessagesRes.error) throw aiMessagesRes.error;

        totalMessages = totalMessagesRes.count ?? 0;
        aiMessages = aiMessagesRes.count ?? 0;
      }

      const summary: MetricsSummary = {
        totalConversations: conversationList.length,
        activeConversations: conversationList.filter((c) => c.status === 'active').length,
        totalMessages,
        aiResponseRate: totalMessages > 0 ? (aiMessages / totalMessages) * 100 : 0,
        waitingReview: conversationList.filter((c) => c.ai_status === 'waiting_review').length,
      };

      const notificationItems: NotificationItem[] = conversationList
        .filter((c) => (c.unread_count ?? 0) > 0)
        .slice(0, 5)
        .map((conversation) => {
          const referenceDate = conversation.last_message_at ?? conversation.created_at ?? new Date().toISOString();
          const unread = conversation.unread_count ?? 0;
          const priority: "high" | "medium" | "low" =
            unread >= 5 ? "high" : unread >= 2 ? "medium" : "low";
          return {
            id: conversation.id,
            title: `${conversation.unread_count} mensagens pendentes`,
            message: conversation.contact?.name ?? conversation.platform,
            type: conversation.platform,
            time: formatDistanceToNow(new Date(referenceDate), { addSuffix: true, locale: ptBR }),
            sentAt: referenceDate,
            read: false,
            priority,
          };
        });

      const now = new Date();
      setRealMetrics(summary);
      setLatestConversations(conversationList);
      setConversationIds(conversationIds);
      setNotifications(notificationItems);
      setCache(metricsCacheKey, {
        summary,
        notifications: notificationItems,
        conversations: conversationList,
        conversationIds,
        updatedAt: now.toISOString(),
      }, METRICS_CACHE_TTL);
      setLastUpdatedAt(now);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error("Não foi possível carregar as métricas do dashboard.");
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    loadRealMetrics();
  }, [loadRealMetrics]);

  useEffect(() => {
    if (!conversationIds.length || !currentUserId) {
      setActivityData([]);
      setActivityMeta(null);
      return;
    }
    loadActivityData(conversationIds, activeTimeRange, currentUserId, isLiveMode);
  }, [conversationIds, activeTimeRange, loadActivityData, currentUserId, isLiveMode]);

  useEffect(() => {
    if (!realMetrics || latestConversations.length === 0) {
      setInsights([]);
      return;
    }
    setInsights(buildInsights(realMetrics, latestConversations, activityMeta));
  }, [realMetrics, latestConversations, activityMeta]);

  useEffect(() => {
    if (!isLiveMode) return;
    const interval = setInterval(() => {
      loadRealMetrics(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isLiveMode, loadRealMetrics]);

  const unreadNotifications = notifications.filter(n => !n.read).length;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t('dashboard.title')}
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          {lastUpdatedText && (
            <p className="text-xs text-muted-foreground">
              Atualizado {lastUpdatedText}
            </p>
          )}
          <div className="flex gap-3">
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
              className="relative border-border/50 hover:border-green-500/50"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </Button>

            {showNotifications && (
              <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-auto z-50 glass-card">
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold">Notificações</h3>
                </div>
                <div className="p-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "p-3 rounded-lg mb-2 cursor-pointer hover:bg-accent/50 transition-colors",
                        !notif.read && "bg-primary/10"
                      )}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
                        )
                      }
                    >
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <Button
            variant="outline"
            className="border-border/50 hover:border-green-500/50"
            onClick={handleExportReport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-400" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </>
            )}
          </Button>

          <Button
            className={cn(
              "bg-gradient-to-r from-green-500 to-pink-500 hover:from-green-600 hover:to-pink-600 shadow-[0_0_20px_rgba(72,187,120,0.2)]",
              isLiveMode && "animate-pulse"
            )}
            onClick={handleToggleLiveMode}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isLiveMode ? "Live Mode ON" : "Live Mode"}
          </Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingMetrics ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-card p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-12 bg-muted rounded-xl" />
                <div className="h-8 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-32" />
                <div className="h-2 bg-muted rounded w-full" />
              </div>
            </Card>
          ))
        ) : metrics.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem dados disponíveis</h3>
            <p className="text-sm text-muted-foreground">
              Conecte suas redes sociais para começar a ver métricas em tempo real
            </p>
          </Card>
        ) : (
          metrics.map((metric, idx) => (
            <Card key={idx} className="glass-card hover:border-green-500/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div
                  className={cn(
                    "p-3 rounded-xl backdrop-blur-xl transition-all",
                    metric.trend === "up" ? "bg-green-500/10" : "bg-red-500/10"
                  )}
                >
                  <metric.icon className={cn("h-5 w-5", metric.trend === "up" ? "text-green-400" : "text-red-400")} />
                </div>
                <div className={cn("flex items-center gap-1 text-sm font-semibold", metric.trend === "up" ? "text-green-400" : "text-red-400")}>
                  {metric.trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {metric.change}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-pink-400 bg-clip-text text-transparent">{metric.value}</p>
                <p className="text-sm font-medium text-foreground">{metric.title}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
                <div className="pt-3">
                  <Progress value={metric.progress} className="h-1.5 bg-background/50" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Activity + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-card border-green-500/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-pink-400 bg-clip-text text-transparent">
                {t('dashboard.activity')}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Dados consolidados direto do Supabase nas últimas {activeTimeRange}
              </p>
            </div>
            <div className="flex gap-2">
              {TIME_RANGES.map((range) => (
                <Button
                  key={range}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveTimeRange(range);
                    toast.success(`Visualizando dados de ${range}`);
                  }}
                  className={cn("hover:bg-green-500/10 hover:text-green-400", activeTimeRange === range && "bg-green-500/20 text-green-400 border border-green-500/30")}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          {isLoadingActivity ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-green-400" />
            </div>
          ) : activityData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
              <Activity className="h-10 w-10" />
              <p className="text-sm">Ainda não há mensagens registradas neste intervalo de tempo.</p>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="aiGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="humanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.2} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="humanMessages"
                      stackId="1"
                      stroke="#a855f7"
                      fill="url(#humanGradient)"
                      name="Humanos"
                    />
                    <Area
                      type="monotone"
                      dataKey="aiMessages"
                      stackId="1"
                      stroke="#22c55e"
                      fill="url(#aiGradient)"
                      name="IA"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <span>IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#a855f7]" />
                  <span>Humanos</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
                {activityStats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border/40 bg-background/30 p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="glass-card border-green-500/20 p-6">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-green-400 to-pink-400 bg-clip-text text-transparent">{t('dashboard.insights')}</h2>
          <div className="space-y-3">
            {!hasInsights ? (
              <p className="text-sm text-muted-foreground">Nenhum insight disponível ainda. Conecte suas redes ou aguarde novas mensagens.</p>
            ) : (
              displayedInsights.map((insight, index) => (
                <div
                  key={`${insight.title}-${index}`}
                  className={cn(
                    "p-3 rounded-xl border-l-4 backdrop-blur-xl transition-all hover:scale-[1.02]",
                    insight.type === "success" && "bg-green-500/10 border-green-400",
                    insight.type === "warning" && "bg-yellow-500/10 border-yellow-400",
                    insight.type === "info" && "bg-green-500/10 border-green-400"
                  )}
                >
                  <p className={cn("text-sm font-semibold mb-1", insight.type === "success" && "text-green-400", insight.type === "warning" && "text-yellow-400", insight.type === "info" && "text-green-400")}>
                    {insight.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  <p className="text-xs text-muted-foreground/50 mt-2">{insight.time}</p>
                </div>
              ))
            )}
          </div>

          {hasInsights && insights.length > 3 && (
            <Button
              variant="gradient"
              className="w-full mt-4 backdrop-blur-xl bg-background/50 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10"
              onClick={() => setShowAllInsights(!showAllInsights)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showAllInsights ? "Mostrar menos" : "Ver todos insights"}
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
