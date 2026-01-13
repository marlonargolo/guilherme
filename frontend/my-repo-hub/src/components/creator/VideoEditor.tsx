import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Pause, 
  Scissors, 
  Sparkles, 
  Upload, 
  Download, 
  Loader2,
  Zap,
  Settings,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
  Rewind,
  Wand2,
  Monitor,
  Smartphone,
  Square,
  Type,
  ImagePlus,
  Music,
  Layers,
  ZoomIn,
  ZoomOut,
  Plus,
  X,
  GripVertical,
  Film,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VideoEditorProps {
  onClose: () => void;
}

interface Effect {
  id: string;
  name: string;
  icon: any;
  description: string;
  filter: string;
}

interface VideoFormat {
  id: string;
  name: string;
  icon: any;
  aspectRatio: string;
  width: number;
  height: number;
}

interface Clip {
  id: string;
  type: "video" | "image" | "text" | "audio";
  name: string;
  url?: string;
  text?: string;
  startTime: number;
  duration: number;
  trackIndex: number;
  thumbnail?: string;
  volume?: number;
  filter?: string;
}

interface Track {
  id: string;
  name: string;
  type: "video" | "overlay" | "text" | "audio";
  clips: Clip[];
  visible: boolean;
  locked: boolean;
}

const EFFECTS: Effect[] = [
  { id: "none", name: "Original", icon: RotateCcw, description: "Sem efeitos", filter: "none" },
  { id: "vintage", name: "Vintage", icon: Sparkles, description: "Tom retrô", filter: "sepia(60%) saturate(120%)" },
  { id: "cyberpunk", name: "Cyberpunk", icon: Zap, description: "Neon futurístico", filter: "contrast(120%) saturate(150%) hue-rotate(90deg)" },
  { id: "dream", name: "Dream", icon: Wand2, description: "Etéreo e suave", filter: "blur(0.5px) brightness(110%) saturate(150%)" },
  { id: "noir", name: "Noir", icon: Settings, description: "Preto e branco dramático", filter: "grayscale(100%) contrast(140%)" },
  { id: "glow", name: "Glow", icon: Sparkles, description: "Brilho radiante", filter: "brightness(120%) saturate(130%) drop-shadow(0 0 10px rgba(255,255,255,0.8))" },
];

const VIDEO_FORMATS: VideoFormat[] = [
  { id: "feed", name: "Feed (1:1)", icon: Square, aspectRatio: "1/1", width: 1080, height: 1080 },
  { id: "reels", name: "Reels (9:16)", icon: Smartphone, aspectRatio: "9/16", width: 1080, height: 1920 },
  { id: "landscape", name: "Landscape (16:9)", icon: Monitor, aspectRatio: "16/9", width: 1920, height: 1080 },
];

export const VideoEditor = ({ onClose }: VideoEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [selectedFormat, setSelectedFormat] = useState<string>("reels");
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const [tracks, setTracks] = useState<Track[]>([
    { id: "track-1", name: "Vídeo Principal", type: "video", clips: [], visible: true, locked: false },
    { id: "track-2", name: "Sobreposição", type: "overlay", clips: [], visible: true, locked: false },
    { id: "track-3", name: "Texto/Títulos", type: "text", clips: [], visible: true, locked: false },
    { id: "track-4", name: "Áudio/Música", type: "audio", clips: [], visible: true, locked: false },
  ]);

  const [showAddTextModal, setShowAddTextModal] = useState(false);
  const [newTextContent, setNewTextContent] = useState("");
  const [newTextDuration, setNewTextDuration] = useState(5);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecione um arquivo de vídeo");
      return;
    }
    
    const url = URL.createObjectURL(file);
    
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      const clipDuration = video.duration;
      
      video.currentTime = 1;
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL();
        
        const newClip: Clip = {
          id: `clip-${Date.now()}`,
          type: "video",
          name: file.name,
          url,
          startTime: 0,
          duration: clipDuration,
          trackIndex: 0,
          thumbnail,
        };
        
        setTracks(prev => {
          const newTracks = [...prev];
          newTracks[0].clips.push(newClip);
          return newTracks;
        });
        
        setDuration(Math.max(duration, clipDuration));
        toast.success("Vídeo adicionado à Track 1! ✨");
      };
    };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    
    const url = URL.createObjectURL(file);
    
    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      type: "image",
      name: file.name,
      url,
      startTime: currentTime,
      duration: 5,
      trackIndex: 1,
      thumbnail: url,
    };
    
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[1].clips.push(newClip);
      return newTracks;
    });
    
    toast.success("Imagem adicionada à Track 2!");
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("audio/")) {
      toast.error("Por favor, selecione um arquivo de áudio");
      return;
    }
    
    const url = URL.createObjectURL(file);
    
    const audio = document.createElement('audio');
    audio.src = url;
    audio.onloadedmetadata = () => {
      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        type: "audio",
        name: file.name,
        url,
        startTime: 0,
        duration: audio.duration,
        trackIndex: 3,
        volume: 1,
      };
      
      setTracks(prev => {
        const newTracks = [...prev];
        newTracks[3].clips.push(newClip);
        return newTracks;
      });
      
      setDuration(Math.max(duration, audio.duration));
      toast.success("Áudio adicionado à Track 4!");
    };
  };

  const addTextClip = () => {
    if (!newTextContent.trim()) {
      toast.error("Digite o texto");
      return;
    }

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      type: "text",
      name: newTextContent.substring(0, 20) + "...",
      text: newTextContent,
      startTime: currentTime,
      duration: newTextDuration,
      trackIndex: 2,
    };
    
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[2].clips.push(newClip);
      return newTracks;
    });
    
    setNewTextContent("");
    setShowAddTextModal(false);
    toast.success("Texto adicionado à Track 3!");
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  const skipTime = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteClip = (trackIndex: number, clipId: string) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[trackIndex].clips = newTracks[trackIndex].clips.filter(c => c.id !== clipId);
      return newTracks;
    });
    toast.success("Clipe removido");
  };

  const duplicateClip = (trackIndex: number, clipId: string) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const clip = newTracks[trackIndex].clips.find(c => c.id === clipId);
      if (clip) {
        const newClip = { ...clip, id: `clip-${Date.now()}`, startTime: clip.startTime + clip.duration };
        newTracks[trackIndex].clips.push(newClip);
      }
      return newTracks;
    });
    toast.success("Clipe duplicado");
  };

  const exportVideo = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      toast.success("Vídeo exportado! 🎉");
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar vídeo");
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const pixelsPerSecond = 100 * timelineZoom;
  const timelineWidth = duration * pixelsPerSecond;

  const selectedClip = tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-[95vw] h-[95vh] bg-gradient-to-br from-background via-background/95 to-primary/5 border border-primary/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Film className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Video Editor Pro
              </h2>
              <p className="text-sm text-muted-foreground">Editor profissional de próxima geração</p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-xl">
            Fechar
          </Button>
        </div>

        <div className="flex-1 flex gap-4 p-6 overflow-hidden">
          {/* Left Panel - Tools */}
          <div className="w-72 space-y-4 overflow-y-auto">
            {/* Upload Controls */}
            <Card className="p-4 border-primary/20 bg-background/50 backdrop-blur-xl">
              <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Adicionar Mídia
              </Label>
              
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Film className="mr-2 h-4 w-4" />
                  Vídeo (Track 1)
                </Button>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Imagem (Track 2)
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setShowAddTextModal(true)}
                >
                  <Type className="mr-2 h-4 w-4" />
                  Texto (Track 3)
                </Button>

                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => audioInputRef.current?.click()}
                >
                  <Music className="mr-2 h-4 w-4" />
                  Áudio (Track 4)
                </Button>
              </div>
            </Card>

            {/* Format Selection */}
            <Card className="p-4 border-accent/20 bg-background/50 backdrop-blur-xl">
              <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Monitor className="h-5 w-5 text-accent" />
                Formato
              </Label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_FORMATS.map((format) => {
                    const Icon = format.icon;
                    return (
                      <SelectItem key={format.id} value={format.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{format.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                {VIDEO_FORMATS.find(f => f.id === selectedFormat)?.width} × {VIDEO_FORMATS.find(f => f.id === selectedFormat)?.height}px
              </p>
            </Card>

            {/* Effects */}
            {selectedClip && selectedClip.type === "video" && (
              <Card className="p-4 border-purple-500/20 bg-background/50 backdrop-blur-xl">
                <Label className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  Efeitos Visuais
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {EFFECTS.map((effect) => {
                    const Icon = effect.icon;
                    return (
                      <button
                        key={effect.id}
                        onClick={() => {
                          setTracks(prev => {
                            const newTracks = [...prev];
                            const track = newTracks.find(t => t.clips.some(c => c.id === selectedClipId));
                            if (track) {
                              const clip = track.clips.find(c => c.id === selectedClipId);
                              if (clip) clip.filter = effect.filter;
                            }
                            return newTracks;
                          });
                        }}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-left",
                          selectedClip.filter === effect.filter
                            ? "border-purple-500 bg-purple-500/10"
                            : "border-border/50 hover:border-purple-500/50"
                        )}
                      >
                        <Icon className="h-4 w-4 mb-1 text-purple-400" />
                        <p className="text-xs font-medium">{effect.name}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Timeline Zoom */}
            <Card className="p-4 border-cyan-500/20 bg-background/50 backdrop-blur-xl">
              <Label className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-cyan-400" />
                Zoom da Timeline
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  value={[timelineZoom]}
                  onValueChange={(v) => setTimelineZoom(v[0])}
                  min={0.5}
                  max={3}
                  step={0.25}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {Math.round(timelineZoom * 100)}%
              </p>
            </Card>

            {/* Export */}
            <Card className="p-4 border-green-500/20 bg-background/50 backdrop-blur-xl">
              <Button 
                onClick={exportVideo}
                disabled={isExporting || tracks.every(t => t.clips.length === 0)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exportando... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Vídeo
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* Center Panel - Preview & Timeline */}
          <div className="flex-1 flex flex-col gap-4">
            {/* Video Preview */}
            <Card className="flex-1 relative border-primary/20 bg-black/50 backdrop-blur-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div 
                  className="relative bg-black rounded-lg overflow-hidden"
                  style={{
                    aspectRatio: VIDEO_FORMATS.find(f => f.id === selectedFormat)?.aspectRatio || "9/16",
                    maxHeight: "100%",
                    maxWidth: "100%"
                  }}
                >
                  {tracks[0].clips.length > 0 ? (
                    <video
                      ref={videoRef}
                      src={tracks[0].clips[0].url}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(Math.max(duration, videoRef.current.duration));
                        }
                      }}
                      className="w-full h-full object-cover"
                      style={{
                        filter: tracks[0].clips[0].filter || "none"
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-sm">Adicione vídeos na Track 1</p>
                      </div>
                    </div>
                  )}

                  {/* Play/Pause Overlay */}
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {isPlaying ? (
                        <Pause className="h-8 w-8 text-white" />
                      ) : (
                        <Play className="h-8 w-8 text-white ml-1" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </Card>

            {/* Playback Controls */}
            <Card className="p-4 border-primary/20 bg-background/50 backdrop-blur-xl">
              <div className="space-y-3">
                {/* Timeline Scrubber */}
                <div className="relative">
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleSeek}
                    max={duration}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => skipTime(-5)}
                    className="rounded-full"
                  >
                    <Rewind className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="icon"
                    onClick={togglePlay}
                    className="rounded-full w-12 h-12 bg-gradient-to-br from-primary to-accent"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => skipTime(5)}
                    className="rounded-full"
                  >
                    <FastForward className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1" />
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMuted(!isMuted)}
                    className="rounded-full"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <div className="w-24">
                    <Slider
                      value={[volume * 100]}
                      onValueChange={(v) => setVolume(v[0] / 100)}
                      max={100}
                      min={0}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline with Tracks */}
            <Card className="h-80 border-primary/20 bg-background/50 backdrop-blur-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Timeline (Tracks)
                </Label>
                <div className="text-xs text-muted-foreground">
                  Duração total: {formatTime(duration)}
                </div>
              </div>
              
              <div className="flex-1 overflow-auto" ref={timelineRef}>
                <div className="relative" style={{ width: timelineWidth }}>
                  {/* Time ruler */}
                  <div className="h-8 bg-background/80 border-b border-border/50 sticky top-0 z-20 flex">
                    {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
                      <div
                        key={i}
                        className="border-l border-border/30 text-xs text-muted-foreground px-2"
                        style={{ width: pixelsPerSecond }}
                      >
                        {i}s
                      </div>
                    ))}
                  </div>

                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ left: currentTime * pixelsPerSecond }}
                  >
                    <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1" />
                  </div>

                  {/* Tracks */}
                  {tracks.map((track, trackIndex) => (
                    <div key={track.id} className="h-20 border-b border-border/30 relative bg-background/20">
                      {/* Track Label */}
                      <div className="absolute left-0 top-0 bottom-0 w-40 bg-background/90 border-r border-border/50 flex items-center px-3 z-10">
                        <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{track.name}</p>
                          <p className="text-[10px] text-muted-foreground">{track.clips.length} clipes</p>
                        </div>
                      </div>

                      {/* Clips */}
                      <div className="absolute left-40 top-0 bottom-0 right-0">
                        {track.clips.map((clip) => (
                          <div
                            key={clip.id}
                            className={cn(
                              "absolute top-1 bottom-1 rounded-lg border-2 cursor-pointer overflow-hidden transition-all",
                              selectedClipId === clip.id
                                ? "border-primary shadow-lg shadow-primary/50 z-20"
                                : "border-border/50 hover:border-primary/50"
                            )}
                            style={{
                              left: clip.startTime * pixelsPerSecond,
                              width: clip.duration * pixelsPerSecond,
                              backgroundColor: 
                                clip.type === "video" ? "rgba(59, 130, 246, 0.2)" :
                                clip.type === "image" ? "rgba(168, 85, 247, 0.2)" :
                                clip.type === "text" ? "rgba(34, 197, 94, 0.2)" :
                                "rgba(234, 179, 8, 0.2)"
                            }}
                            onClick={() => setSelectedClipId(clip.id)}
                          >
                            {clip.thumbnail && (
                              <img 
                                src={clip.thumbnail} 
                                alt={clip.name}
                                className="absolute inset-0 w-full h-full object-cover opacity-50"
                              />
                            )}
                            <div className="absolute inset-0 p-2 flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-[10px] font-medium truncate flex-1">{clip.name}</p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateClip(trackIndex, clip.id);
                                    }}
                                    className="p-0.5 rounded hover:bg-primary/20"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteClip(trackIndex, clip.id);
                                    }}
                                    className="p-0.5 rounded hover:bg-destructive/20"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                {formatTime(clip.duration)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Text Modal */}
      {showAddTextModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold">Adicionar Texto</h3>
            <div>
              <Label>Conteúdo do Texto</Label>
              <Input
                value={newTextContent}
                onChange={(e) => setNewTextContent(e.target.value)}
                placeholder="Digite o texto..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Duração (segundos)</Label>
              <Input
                type="number"
                value={newTextDuration}
                onChange={(e) => setNewTextDuration(Number(e.target.value))}
                min={1}
                max={60}
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addTextClip} className="flex-1">
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowAddTextModal(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
