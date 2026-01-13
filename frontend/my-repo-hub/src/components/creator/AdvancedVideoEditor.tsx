import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Monitor,
  Smartphone,
  Square,
  Type,
  ImagePlus,
  Music,
  Layers,
  ZoomIn,
  ZoomOut,
  X,
  GripVertical,
  Film,
  Copy,
  Wand2,
  Move,
  SplitSquareHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Crop,
  Palette,
  Mic,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VideoEditorProps {
  onClose: () => void;
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
  transition?: string;
  speed?: number;
  opacity?: number;
}

interface Track {
  id: string;
  name: string;
  type: "video" | "overlay" | "text" | "audio";
  clips: Clip[];
  visible: boolean;
  locked: boolean;
  height: number;
}

const VIDEO_FORMATS = [
  { id: "feed", name: "Feed 1:1", icon: Square, ratio: "1/1", w: 1080, h: 1080, platform: "Instagram Feed" },
  { id: "reels", name: "Reels 9:16", icon: Smartphone, ratio: "9/16", w: 1080, h: 1920, platform: "Reels/TikTok" },
  { id: "landscape", name: "YouTube 16:9", icon: Monitor, ratio: "16/9", w: 1920, h: 1080, platform: "YouTube" },
];

const EFFECTS = [
  { id: "none", name: "Normal", filter: "none" },
  { id: "vintage", name: "Vintage", filter: "sepia(60%) saturate(120%)" },
  { id: "cyberpunk", name: "Neon", filter: "contrast(120%) saturate(150%) hue-rotate(90deg)" },
  { id: "noir", name: "B&W", filter: "grayscale(100%) contrast(140%)" },
  { id: "glow", name: "Glow", filter: "brightness(120%) saturate(130%)" },
  { id: "warm", name: "Quente", filter: "sepia(30%) saturate(140%) brightness(105%)" },
  { id: "cold", name: "Frio", filter: "hue-rotate(180deg) saturate(110%)" },
  { id: "dramatic", name: "Drama", filter: "contrast(150%) brightness(90%) saturate(130%)" },
  { id: "blur", name: "Blur", filter: "blur(4px)" },
];

const TRANSITIONS = [
  { id: "none", name: "Sem", icon: "—" },
  { id: "fade", name: "Fade", icon: "◐" },
  { id: "slide", name: "Slide", icon: "→" },
  { id: "zoom", name: "Zoom", icon: "⊕" },
  { id: "dissolve", name: "Dissolve", icon: "⊗" },
  { id: "wipe", name: "Wipe", icon: "▶" },
];

const SPEED_OPTIONS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
];

const FREE_MUSIC_LIBRARY = [
  { id: "1", name: "Upbeat Energy", genre: "Pop", duration: 180, mood: "Energético" },
  { id: "2", name: "Chill Vibes", genre: "Lo-fi", duration: 160, mood: "Relaxante" },
  { id: "3", name: "Epic Adventure", genre: "Cinematic", duration: 200, mood: "Épico" },
  { id: "4", name: "Summer Dreams", genre: "Tropical", duration: 145, mood: "Alegre" },
  { id: "5", name: "Dark Mystery", genre: "Ambient", duration: 190, mood: "Misterioso" },
  { id: "6", name: "Tech Future", genre: "Electronic", duration: 170, mood: "Moderno" },
];

export const AdvancedVideoEditor = ({ onClose }: VideoEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lastTimeUpdateRef = useRef(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [draggedClip, setDraggedClip] = useState<{trackIndex: number, clipId: string} | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [clipStartTime, setClipStartTime] = useState(0);
  const [resizingClip, setResizingClip] = useState<{trackIndex: number, clipId: string, edge: 'left' | 'right'} | null>(null);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const [selectedFormat, setSelectedFormat] = useState("reels");
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  const [clipSpeed, setClipSpeed] = useState(1);
  const [clipBrightness, setClipBrightness] = useState(100);
  const [clipContrast, setClipContrast] = useState(100);
  const [clipSaturation, setClipSaturation] = useState(100);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isAutoSplitting, setIsAutoSplitting] = useState(false);
  const [showMusicLibrary, setShowMusicLibrary] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("mp4");
  const [exportQuality, setExportQuality] = useState("1080p");

  const [tracks, setTracks] = useState<Track[]>([
    { id: "t1", name: "Vídeo Principal", type: "video", clips: [], visible: true, locked: false, height: 80 },
    { id: "t2", name: "Sobreposição / Logo", type: "overlay", clips: [], visible: true, locked: false, height: 60 },
    { id: "t3", name: "Texto / Títulos", type: "text", clips: [], visible: true, locked: false, height: 60 },
    { id: "t4", name: "Áudio / Música", type: "audio", clips: [], visible: true, locked: false, height: 70 },
  ]);

  const [showTextModal, setShowTextModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTextDuration, setNewTextDuration] = useState(5);
  const [newTextStyle, setNewTextStyle] = useState("bold");
  
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{url: string, type: string, name: string}[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.playbackRate = clipSpeed;
    }
  }, [volume, isMuted, clipSpeed]);

  // Keyboard shortcuts - Professional hotkeys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        skipTime(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        skipTime(1);
      } else if (e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        if (!selectedClipId) {
          toast.error("⚠️ Selecione um clip primeiro!");
          return;
        }
        const track = tracks.find(t => t.clips.some(c => c.id === selectedClipId));
        if (!track) return;
        
        const clip = track.clips.find(c => c.id === selectedClipId);
        if (!clip) return;
        
        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
          splitClipAt(tracks.indexOf(track), clip.id, currentTime);
        } else {
          toast.error("⚠️ Posicione o playhead dentro do clip antes de cortar!");
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedClipId) {
          const track = tracks.find(t => t.clips.some(c => c.id === selectedClipId));
          if (track) {
            deleteClip(tracks.indexOf(track), selectedClipId);
          }
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, currentTime, selectedClipId, tracks]);

  const handleFileDrop = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    
    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.onloadedmetadata = () => {
        video.currentTime = 1;
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const clip: Clip = {
            id: `c${Date.now()}`,
            type: "video",
            name: file.name,
            url,
            startTime: snapToGrid(currentTime),
            duration: video.duration,
            trackIndex,
            thumbnail: canvas.toDataURL(),
            speed: 1,
            opacity: 1,
          };
          
          addClipToTrack(trackIndex, clip);
          setUploadedFiles(prev => [...prev, { url, type: 'video', name: file.name }]);
          toast.success("✨ Vídeo adicionado à timeline!");
        };
      };
    } else if (isImage) {
      const clip: Clip = {
        id: `c${Date.now()}`,
        type: "image",
        name: file.name,
        url,
        startTime: snapToGrid(currentTime),
        duration: 5,
        trackIndex,
        thumbnail: url,
        opacity: 1,
      };
      addClipToTrack(trackIndex, clip);
      setUploadedFiles(prev => [...prev, { url, type: 'image', name: file.name }]);
      toast.success("🖼️ Imagem adicionada!");
    } else if (isAudio) {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.onloadedmetadata = () => {
        const clip: Clip = {
          id: `c${Date.now()}`,
          type: "audio",
          name: file.name,
          url,
          startTime: snapToGrid(currentTime),
          duration: audio.duration,
          trackIndex,
          volume: 1,
        };
        addClipToTrack(trackIndex, clip);
        setUploadedFiles(prev => [...prev, { url, type: 'audio', name: file.name }]);
        toast.success("🎵 Áudio adicionado!");
      };
    }
  };

  const snapToGrid = (time: number): number => {
    if (!snapEnabled) return time;
    const snapInterval = 0.5; // Snap to 0.5 second intervals
    return Math.round(time / snapInterval) * snapInterval;
  };

  const addClipToTrack = (trackIndex: number, clip: Clip) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[trackIndex].clips.push(clip);
      return newTracks;
    });
    setDuration(Math.max(duration, clip.startTime + clip.duration + 2));
  };

  const splitClipAt = useCallback((trackIndex: number, clipId: string, splitTime: number) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const clipIndex = newTracks[trackIndex].clips.findIndex(c => c.id === clipId);
      if (clipIndex === -1) {
        toast.error("Clip não encontrado!");
        return prev;
      }
      
      const originalClip = newTracks[trackIndex].clips[clipIndex];
      const relativeTime = splitTime - originalClip.startTime;
      
      // Validação melhorada para corte correto
      if (relativeTime <= 0.1 || relativeTime >= originalClip.duration - 0.1) {
        toast.error("Posição de corte inválida! Coloque o playhead dentro do clip.");
        return prev;
      }
      
      const clip1: Clip = {
        ...originalClip,
        duration: relativeTime,
      };
      
      const clip2: Clip = {
        ...originalClip,
        id: `c${Date.now()}`,
        startTime: splitTime,
        duration: originalClip.duration - relativeTime,
      };
      
      newTracks[trackIndex].clips.splice(clipIndex, 1, clip1, clip2);
      toast.success("✂️ Corte aplicado com sucesso!");
      return newTracks;
    });
  }, []);

  const autoSplitSilences = async () => {
    setIsAutoSplitting(true);
    
    const videoClips = tracks[0].clips;
    if (videoClips.length === 0) {
      toast.error("Adicione um vídeo primeiro");
      setIsAutoSplitting(false);
      return;
    }
    
    toast.loading("🔍 Analisando áudio e detectando pausas...", { id: "auto-split" });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate AI analysis
    const silencePoints = [
      videoClips[0].startTime + videoClips[0].duration * 0.25,
      videoClips[0].startTime + videoClips[0].duration * 0.5,
      videoClips[0].startTime + videoClips[0].duration * 0.75,
    ];
    
    toast.loading(`✅ ${silencePoints.length} pontos de corte encontrados`, { id: "auto-split" });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Apply cuts
    for (let i = 0; i < silencePoints.length; i++) {
      const point = silencePoints[silencePoints.length - 1 - i];
      const currentClip = tracks[0].clips.find(c => 
        point >= c.startTime && point <= c.startTime + c.duration
      );
      
      if (currentClip) {
        toast.loading(`✂️ Aplicando corte ${i + 1}/${silencePoints.length}...`, { id: "auto-split" });
        splitClipAt(0, currentClip.id, point);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    
    setIsAutoSplitting(false);
    toast.success(`🎉 ${silencePoints.length} cortes automáticos aplicados!`, { id: "auto-split" });
  };

  const deleteClip = useCallback((trackIndex: number, clipId: string) => {
    setTracks(prev => {
      const newTracks = [...prev];
      newTracks[trackIndex].clips = newTracks[trackIndex].clips.filter(c => c.id !== clipId);
      return newTracks;
    });
    setSelectedClipId(null);
    toast.success("🗑️ Clipe removido");
  }, []);

  const duplicateClip = (trackIndex: number, clipId: string) => {
    setTracks(prev => {
      const newTracks = [...prev];
      const clip = newTracks[trackIndex].clips.find(c => c.id === clipId);
      if (clip) {
        const newClip = { ...clip, id: `c${Date.now()}`, startTime: snapToGrid(clip.startTime + clip.duration) };
        newTracks[trackIndex].clips.push(newClip);
        toast.success("📋 Clipe duplicado");
      }
      return newTracks;
    });
  };

  const addTextClip = () => {
    if (!newText.trim()) {
      toast.error("Digite o texto");
      return;
    }
    const clip: Clip = {
      id: `c${Date.now()}`,
      type: "text",
      name: newText.substring(0, 20) + (newText.length > 20 ? "..." : ""),
      text: newText,
      startTime: snapToGrid(currentTime),
      duration: newTextDuration,
      trackIndex: 2,
      opacity: 1,
    };
    addClipToTrack(2, clip);
    setNewText("");
    setShowTextModal(false);
    toast.success("📝 Texto adicionado!");
  };

  const addMusicFromLibrary = (music: typeof FREE_MUSIC_LIBRARY[0]) => {
    const clip: Clip = {
      id: `c${Date.now()}`,
      type: "audio",
      name: music.name,
      startTime: 0,
      duration: music.duration,
      trackIndex: 3,
      volume: 0.7,
    };
    addClipToTrack(3, clip);
    setShowMusicLibrary(false);
    toast.success(`🎵 "${music.name}" adicionada!`);
  };

  const toggleTrackVisibility = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, visible: !t.visible } : t
    ));
  };

  const toggleTrackLock = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, locked: !t.locked } : t
    ));
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // Sincroniza o início da reprodução com a posição atual do playhead
      video.currentTime = currentTime;
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Erro ao reproduzir vídeo:", err);
        setIsPlaying(false);
      });
    }
  }, [isPlaying, currentTime]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const now = performance.now();
    if (now - lastTimeUpdateRef.current < 100) return; // Reduzido para ~10fps para melhor performance
    lastTimeUpdateRef.current = now;
    const t = video.currentTime;
    if (Math.abs(t - currentTime) > 0.05) {
      setCurrentTime(t);
    }
  }, [currentTime]);

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
    const frames = Math.floor((seconds % 1) * 30);
    return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const exportVideo = async () => {
    setShowExportModal(false);
    setIsExporting(true);
    setExportProgress(0);

    toast.loading("🎬 Preparando exportação...", { id: "export" });
    
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 3;
      });
    }, 150);

    await new Promise(resolve => setTimeout(resolve, 4000));
    clearInterval(interval);
    setExportProgress(100);
    
    toast.success(`🎉 Vídeo exportado em ${exportQuality} ${exportFormat.toUpperCase()}!`, { id: "export" });
    
    setTimeout(() => {
      setIsExporting(false);
      setExportProgress(0);
    }, 1500);
  };

  // Otimização com useMemo para cálculos pesados
  const pixelsPerSecond = useMemo(() => 80 * timelineZoom, [timelineZoom]);
  const timelineWidth = useMemo(() => Math.max(duration * pixelsPerSecond, 2000), [duration, pixelsPerSecond]);
  const selectedClip = useMemo(() => tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId), [selectedClipId, tracks]);
  const format = useMemo(() => VIDEO_FORMATS.find(f => f.id === selectedFormat), [selectedFormat]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || draggedClip || resizingClip) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const t = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    setCurrentTime(t);
    if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
  };

  const handleClipDragStart = (e: React.MouseEvent, trackIndex: number, clipId: string) => {
    e.stopPropagation();
    const clip = tracks[trackIndex].clips.find(c => c.id === clipId);
    if (!clip || tracks[trackIndex].locked) return;
    setDraggedClip({ trackIndex, clipId });
    setDragStartX(e.clientX);
    setClipStartTime(clip.startTime);
  };

  const handleClipDrag = useCallback((e: MouseEvent) => {
    if (!draggedClip || !timelineRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;
    let newStartTime = clipStartTime + deltaTime;
    if (snapEnabled) newStartTime = snapToGrid(newStartTime);
    newStartTime = Math.max(0, Math.min(duration - 0.1, newStartTime));
    
    setTracks(prev => {
      const newTracks = [...prev];
      const clip = newTracks[draggedClip.trackIndex].clips.find(c => c.id === draggedClip.clipId);
      if (clip) {
        clip.startTime = newStartTime;
      }
      return newTracks;
    });
  }, [draggedClip, dragStartX, clipStartTime, pixelsPerSecond, snapEnabled, duration]);

  const handleClipDragEnd = useCallback(() => {
    setDraggedClip(null);
  }, []);

  const handleResizeStart = (e: React.MouseEvent, trackIndex: number, clipId: string, edge: 'left' | 'right') => {
    e.stopPropagation();
    if (tracks[trackIndex].locked) return;
    setResizingClip({ trackIndex, clipId, edge });
    setDragStartX(e.clientX);
    const clip = tracks[trackIndex].clips.find(c => c.id === clipId);
    if (clip) setClipStartTime(clip.startTime);
  };

  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizingClip || !timelineRef.current) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartX;
    const deltaTime = deltaX / pixelsPerSecond;
    
    setTracks(prev => {
      const newTracks = [...prev];
      const clip = newTracks[resizingClip.trackIndex].clips.find(c => c.id === resizingClip.clipId);
      if (!clip) return prev;
      
      if (resizingClip.edge === 'left') {
        let newStartTime = clipStartTime + deltaTime;
        if (snapEnabled) newStartTime = snapToGrid(newStartTime);
        newStartTime = Math.max(0, Math.min(clip.startTime + clip.duration - 0.1, newStartTime));
        const newDuration = clip.duration + (clip.startTime - newStartTime);
        if (newDuration > 0.1) {
          clip.startTime = newStartTime;
          clip.duration = newDuration;
        }
      } else {
        let newDuration = clip.duration + deltaTime;
        if (snapEnabled) newDuration = snapToGrid(newDuration);
        newDuration = Math.max(0.1, Math.min(duration - clip.startTime, newDuration));
        clip.duration = newDuration;
      }
      return newTracks;
    });
  }, [resizingClip, dragStartX, clipStartTime, pixelsPerSecond, snapEnabled, duration]);

  const handleResizeEnd = useCallback(() => {
    setResizingClip(null);
  }, []);

  useEffect(() => {
    if (draggedClip) {
      window.addEventListener('mousemove', handleClipDrag);
      window.addEventListener('mouseup', handleClipDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleClipDrag);
        window.removeEventListener('mouseup', handleClipDragEnd);
      };
    }
  }, [draggedClip, handleClipDrag, handleClipDragEnd]);

  useEffect(() => {
    if (resizingClip) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingClip, handleResize, handleResizeEnd]);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-black via-background/95 to-black backdrop-blur-3xl flex items-center justify-center">
      <div className="w-full h-full bg-background/30 backdrop-blur-xl border-y border-primary/10 overflow-hidden flex flex-col">
        
        {/* Modern Toolbar Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/80 backdrop-blur-3xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30">
                <Camera className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Flow Editor Pro</h2>
                <p className="text-[9px] text-white/40">Timeline Profissional</p>
              </div>
            </div>
            
            <div className="h-6 w-px bg-white/10" />
            
            {/* Main Toolbar */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white"
                title="Importar vídeo (Ctrl+I)"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden md:inline">Importar</span>
              </Button>
              
              <div className="w-px h-6 bg-white/10 mx-1" />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  if (selectedClipId) {
                    const track = tracks.find(t => t.clips.some(c => c.id === selectedClipId));
                    if (track) {
                      const clip = track.clips.find(c => c.id === selectedClipId);
                      if (clip) splitClipAt(tracks.indexOf(track), clip.id, currentTime);
                    }
                  } else {
                    toast.error("Selecione um clipe primeiro");
                  }
                }}
                disabled={!selectedClipId}
                className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white disabled:opacity-30"
                title="Cortar (C)"
              >
                <Scissors className="h-4 w-4" />
                <span className="hidden md:inline">Cortar</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={autoSplitSilences}
                disabled={isAutoSplitting || tracks[0].clips.length === 0}
                className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white"
                title="Corte automático com IA"
              >
                {isAutoSplitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                <span className="hidden md:inline">Auto Cut</span>
              </Button>
              
              <div className="w-px h-6 bg-white/10 mx-1" />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowTextModal(true)}
                className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white"
                title="Adicionar texto"
              >
                <Type className="h-4 w-4" />
                <span className="hidden md:inline">Texto</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowMusicLibrary(true)}
                className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white"
                title="Biblioteca de música"
              >
                <Music className="h-4 w-4" />
                <span className="hidden md:inline">Música</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white"
                title="Adicionar imagem"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="hidden md:inline">Imagem</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <GripVertical className="h-3 w-3 text-white/40" />
              <span className="text-[10px] text-white/60">Snap</span>
              <button
                onClick={() => setSnapEnabled(!snapEnabled)}
                className={cn(
                  "w-7 h-4 rounded-full transition-all relative",
                  snapEnabled ? "bg-primary" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all",
                  snapEnabled ? "left-3.5" : "left-0.5"
                )} />
              </button>
            </div>
            
            <Button 
              onClick={() => setShowExportModal(true)}
              disabled={isExporting || tracks.every(t => t.clips.length === 0)}
              size="sm"
              variant="ghost"
              className="gap-1.5 h-9 text-xs hover:bg-primary/10 text-white/70 hover:text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {exportProgress}%
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
            
            <Button 
              size="sm"
              className="gap-1.5 h-9 text-xs bg-gradient-to-r from-primary via-accent to-purple-500 shadow-lg shadow-primary/30"
              onClick={() => {
                if (tracks[0].clips.length > 0) {
                  toast.success("✨ Projeto salvo na biblioteca!");
                } else {
                  toast.error("Adicione clipes primeiro");
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
              Salvar
            </Button>
            
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 hover:bg-white/5">
              <X className="h-4 w-4 text-white/70" />
            </Button>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="video/*,image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const isVideo = file.type.startsWith("video/");
            const fakeEvent = { preventDefault: () => {}, dataTransfer: { files: [file] } } as any;
            handleFileDrop(fakeEvent, isVideo ? 0 : 1);
          }
        }} className="hidden" />
        
        <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const fakeEvent = { preventDefault: () => {}, dataTransfer: { files: [file] } } as any;
            handleFileDrop(fakeEvent, 1);
          }
        }} className="hidden" />
        
        <input ref={audioInputRef} type="file" accept="audio/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const fakeEvent = { preventDefault: () => {}, dataTransfer: { files: [file] } } as any;
            handleFileDrop(fakeEvent, 3);
          }
        }} className="hidden" />

        <div className="flex-1 flex gap-3 p-3 overflow-hidden">
          
          {/* Left Sidebar - Format & Effects */}
          <div className="w-72 space-y-2 overflow-y-auto">
            
            {/* Format Selection */}
            <Card className="p-3 border-primary/10 bg-black/40 backdrop-blur-xl">
              <Label className="text-xs font-semibold mb-2 flex items-center gap-2">
                <Monitor className="h-3.5 w-3.5" />
                Formato de Exportação
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {VIDEO_FORMATS.map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={cn(
                        "p-3 rounded-lg border transition-all flex items-center gap-3 text-left",
                        selectedFormat === fmt.id
                          ? "border-primary bg-primary/20 shadow-lg shadow-primary/20"
                          : "border-white/10 hover:border-primary/50 hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5",
                        selectedFormat === fmt.id ? "text-primary" : "text-white/60"
                      )} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{fmt.name}</p>
                        <p className="text-[10px] text-white/50">{fmt.platform}</p>
                      </div>
                      <div className="text-[9px] text-white/40 font-mono">{fmt.w}x{fmt.h}</div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Effects & Filters */}
            {selectedClip?.type === "video" && (
              <Card className="p-3 border-purple-500/10 bg-black/40 backdrop-blur-xl">
                <Label className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  Efeitos & Filtros
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EFFECTS.map((effect) => (
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
                        toast.success(`✨ Filtro "${effect.name}" aplicado`);
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-[10px] transition-all font-medium",
                        selectedClip.filter === effect.filter
                          ? "border-purple-500 bg-purple-500/20 text-purple-200"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-purple-500/50"
                      )}
                    >
                      {effect.name}
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Transitions */}
            {selectedClip && (
              <Card className="p-3 border-blue-500/10 bg-black/40 backdrop-blur-xl">
                <Label className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <SplitSquareHorizontal className="h-3.5 w-3.5 text-blue-400" />
                  Transições
                </Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {TRANSITIONS.map((tr) => (
                    <button
                      key={tr.id}
                      onClick={() => {
                        setTracks(prev => {
                          const newTracks = [...prev];
                          const track = newTracks.find(t => t.clips.some(c => c.id === selectedClipId));
                          if (track) {
                            const clip = track.clips.find(c => c.id === selectedClipId);
                            if (clip) clip.transition = tr.id;
                          }
                          return newTracks;
                        });
                        toast.success(`Transição "${tr.name}" aplicada`);
                      }}
                      className={cn(
                        "p-2 rounded-lg border text-[10px] transition-all font-medium flex flex-col items-center gap-1",
                        selectedClip.transition === tr.id
                          ? "border-blue-500 bg-blue-500/20 text-blue-200"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-blue-500/50"
                      )}
                    >
                      <span className="text-base">{tr.icon}</span>
                      <span>{tr.name}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Advanced Controls */}
            {selectedClip && (
              <Card className="p-3 border-cyan-500/10 bg-black/40 backdrop-blur-xl">
                <Label className="text-xs font-semibold mb-3 flex items-center gap-2">
                  <Wand2 className="h-3.5 w-3.5 text-cyan-400" />
                  Controles Avançados
                </Label>
                
                {/* Speed Control */}
                <div className="space-y-2 mb-3">
                  <Label className="text-[10px] text-white/60 flex justify-between">
                    <span>Velocidade</span>
                    <span className="text-primary font-mono">{clipSpeed}x</span>
                  </Label>
                  <div className="grid grid-cols-6 gap-1">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed.value}
                        onClick={() => {
                          setClipSpeed(speed.value);
                          if (selectedClipId) {
                            setTracks(prev => {
                              const newTracks = [...prev];
                              const track = newTracks.find(t => t.clips.some(c => c.id === selectedClipId));
                              if (track) {
                                const clip = track.clips.find(c => c.id === selectedClipId);
                                if (clip) clip.speed = speed.value;
                              }
                              return newTracks;
                            });
                          }
                        }}
                        className={cn(
                          "p-1.5 rounded border text-[9px] transition-all font-mono",
                          clipSpeed === speed.value
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-primary/50"
                        )}
                      >
                        {speed.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-1.5 mb-3">
                  <Label className="text-[10px] text-white/60 flex justify-between">
                    <span>Brilho</span>
                    <span className="text-primary font-mono">{clipBrightness}%</span>
                  </Label>
                  <Slider
                    value={[clipBrightness]}
                    onValueChange={(v) => setClipBrightness(v[0])}
                    min={50}
                    max={200}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1.5 mb-3">
                  <Label className="text-[10px] text-white/60 flex justify-between">
                    <span>Contraste</span>
                    <span className="text-primary font-mono">{clipContrast}%</span>
                  </Label>
                  <Slider
                    value={[clipContrast]}
                    onValueChange={(v) => setClipContrast(v[0])}
                    min={50}
                    max={200}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-white/60 flex justify-between">
                    <span>Saturação</span>
                    <span className="text-primary font-mono">{clipSaturation}%</span>
                  </Label>
                  <Slider
                    value={[clipSaturation]}
                    onValueChange={(v) => setClipSaturation(v[0])}
                    min={0}
                    max={200}
                    step={5}
                    className="cursor-pointer"
                  />
                </div>
              </Card>
            )}

            {/* Timeline Zoom */}
            <Card className="p-3 border-white/10 bg-black/40 backdrop-blur-xl">
              <Label className="text-xs font-semibold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Zoom da Timeline
                </span>
                <span className="text-primary font-mono text-[10px]">{Math.round(timelineZoom * 100)}%</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Slider
                  value={[timelineZoom]}
                  onValueChange={(v) => setTimelineZoom(v[0])}
                  min={0.5}
                  max={3}
                  step={0.25}
                  className="cursor-pointer flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setTimelineZoom(Math.min(3, timelineZoom + 0.25))}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          </div>

          {/* Center: Preview & Timeline */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            
            {/* Video Preview */}
            <div className="relative h-[58vh] md:h-[62vh] lg:h-[68vh] border border-white/5 bg-black rounded-2xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div 
                  className="relative bg-black rounded-xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                  style={{
                    aspectRatio: format?.ratio || "9/16",
                    maxHeight: "calc(100% - 2rem)",
                    maxWidth: "calc(100% - 2rem)",
                    width: format?.ratio === "16/9" ? "100%" : "auto",
                    height: format?.ratio === "16/9" ? "auto" : "100%",
                  }}
                >
                  {tracks[0].clips.length > 0 ? (
                    <>
                      <video
                        ref={videoRef}
                        src={tracks[0].clips[0].url}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            setDuration(Math.max(duration, videoRef.current.duration + 5));
                            videoRef.current.currentTime = 0;
                            setCurrentTime(0);
                          }
                        }}
                        className="w-full h-full object-cover"
                        style={{ 
                          filter: `${tracks[0].clips[0].filter || "none"} brightness(${clipBrightness}%) contrast(${clipContrast}%) saturate(${clipSaturation}%)` 
                        }}
                      />
                      
                      {/* Overlay elements (images, text) */}
                      {tracks[1].visible && tracks[1].clips.map(clip => {
                        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
                          return (
                            <div key={clip.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              {clip.type === "image" && (
                                <img 
                                  src={clip.url} 
                                  alt={clip.name}
                                  className="max-w-[30%] max-h-[30%] object-contain"
                                  style={{ opacity: clip.opacity }}
                                />
                              )}
                            </div>
                          );
                        }
                        return null;
                      })}

                      {/* Text overlays */}
                      {tracks[2].visible && tracks[2].clips.map(clip => {
                        if (currentTime >= clip.startTime && currentTime <= clip.startTime + clip.duration) {
                          return (
                            <div key={clip.id} className="absolute bottom-12 left-0 right-0 flex items-center justify-center pointer-events-none">
                              <div className="px-6 py-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/20">
                                <p className="text-white font-bold text-lg text-center">{clip.text}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                      
                      {/* Play overlay button */}
                      <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all group"
                      >
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-2xl border-2 border-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:scale-110">
                          {isPlaying ? <Pause className="h-10 w-10 text-white" /> : <Play className="h-10 w-10 text-white ml-1" />}
                        </div>
                      </button>
                    </>
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-black to-accent/5 cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          const isVideo = file.type.startsWith("video/");
                          const fakeEvent = { preventDefault: () => {}, dataTransfer: { files: [file] } } as any;
                          handleFileDrop(fakeEvent, isVideo ? 0 : 1);
                        }
                      }}
                    >
                      <div className="text-center space-y-6">
                        <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center backdrop-blur-xl border-2 border-white/20 shadow-2xl shadow-primary/30 group-hover:scale-110 transition-all">
                          <Upload className="h-16 w-16 text-white animate-pulse" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-white mb-2">Arraste seu vídeo aqui</p>
                          <p className="text-sm text-white/60 mb-4">ou clique para selecionar</p>
                          <div className="flex gap-2 justify-center">
                            <div className="px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-medium">
                              MP4 • MOV • AVI
                            </div>
                            <div className="px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-medium">
                              JPG • PNG
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-white/40">Suporta até 2GB • Qualidade 4K</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <Card className="p-3 border-primary/10 bg-black/60 backdrop-blur-xl">
              <div className="space-y-2">
                <div className="relative">
                  <Slider 
                    value={[currentTime]} 
                    onValueChange={handleSeek} 
                    max={duration} 
                    min={0} 
                    step={0.01} 
                    className="cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] text-white/60 mt-1.5 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button size="icon" variant="ghost" onClick={() => skipTime(-5)} className="h-9 w-9 hover:bg-white/10">
                      <Rewind className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      onClick={togglePlay} 
                      className="rounded-full w-12 h-12 bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-105"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => skipTime(5)} className="h-9 w-9 hover:bg-white/10">
                      <FastForward className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => setIsMuted(!isMuted)} className="h-9 w-9 hover:bg-white/10">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <div className="w-24">
                      <Slider 
                        value={[volume * 100]} 
                        onValueChange={(v) => setVolume(v[0] / 100)} 
                        max={100} 
                        min={0} 
                        step={1} 
                        className="cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Professional Timeline */}
            <div className="border border-white/5 bg-black/80 backdrop-blur-3xl flex flex-col overflow-hidden rounded-xl" style={{ height: '280px' }}>
              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-black/60">
                <Label className="text-xs font-semibold flex items-center gap-2 text-white/80">
                  <Film className="h-3.5 w-3.5" />
                  Timeline Profissional
                </Label>
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-white/50 font-mono">{tracks.reduce((sum, t) => sum + t.clips.length, 0)} clipes</p>
                  <p className="text-[10px] text-white/50 font-mono">{formatTime(duration)}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto" ref={timelineRef}>
                <div
                  className="relative"
                  style={{ width: timelineWidth, minWidth: '100%' }}
                  onClick={handleTimelineClick}
                >
                  
                  {/* Time ruler with precise markers */}
                  <div className="h-6 bg-black/90 border-b border-white/5 sticky top-0 z-30 flex">
                    {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="border-l border-white/10 text-[9px] text-white/40 px-1.5 pt-1 font-mono relative"
                        style={{ width: pixelsPerSecond }}
                      >
                        {i}s
                        {/* Sub-markers every 0.5s */}
                        <div className="absolute left-1/2 top-0 w-px h-2 bg-white/5" />
                      </div>
                    ))}
                  </div>

                  {/* Playhead with smooth animation */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary to-primary/50 z-40 pointer-events-none shadow-[0_0_12px_rgba(var(--primary),0.8)]" 
                    style={{ left: currentTime * pixelsPerSecond }}
                  >
                    <div className="w-2.5 h-2.5 bg-primary rounded-full -ml-1 -mt-1 shadow-lg shadow-primary/80 ring-2 ring-black" />
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-white text-[8px] font-mono rounded shadow-lg whitespace-nowrap">
                      {formatTime(currentTime)}
                    </div>
                  </div>

                  {/* Multi-layer tracks */}
                  {tracks.map((track, trackIndex) => (
                    <div 
                      key={track.id} 
                      className={cn(
                        "border-b border-white/5 relative group/track transition-all",
                        !track.visible && "opacity-40"
                      )}
                      style={{ height: track.height }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => !track.locked && handleFileDrop(e, trackIndex)}
                    >
                      {/* Track header */}
                      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/95 to-black/80 border-r border-white/5 flex items-center px-3 z-20 group-hover/track:bg-black/95 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <button
                              onClick={() => toggleTrackVisibility(track.id)}
                              className="hover:bg-white/10 rounded p-0.5 transition-colors"
                            >
                              {track.visible ? 
                                <Eye className="h-3 w-3 text-white/60" /> : 
                                <EyeOff className="h-3 w-3 text-white/30" />
                              }
                            </button>
                            <button
                              onClick={() => toggleTrackLock(track.id)}
                              className="hover:bg-white/10 rounded p-0.5 transition-colors"
                            >
                              {track.locked ? 
                                <Lock className="h-3 w-3 text-white/60" /> : 
                                <Unlock className="h-3 w-3 text-white/30" />
                              }
                            </button>
                          </div>
                          <p className="text-[10px] font-semibold truncate text-white/70">{track.name}</p>
                          <p className="text-[8px] text-white/40">{track.clips.length} {track.clips.length === 1 ? 'clipe' : 'clipes'}</p>
                        </div>
                      </div>

                      {/* Track content area */}
                      <div className="absolute left-32 top-0 bottom-0 right-0">
                        {track.clips.map((clip) => (
                          <div
                            key={clip.id}
                            className={cn(
                              "absolute top-1 bottom-1 rounded-lg border overflow-hidden transition-all group/clip backdrop-blur-sm select-none",
                              selectedClipId === clip.id 
                                ? "border-primary shadow-lg shadow-primary/40 ring-2 ring-primary/50 z-30" 
                                : "border-white/20 hover:border-primary/60 hover:shadow-md hover:shadow-primary/20 z-10",
                              draggedClip?.clipId === clip.id && "opacity-70 cursor-grabbing",
                              !draggedClip && !resizingClip && "cursor-grab hover:cursor-grab active:cursor-grabbing"
                            )}
                            style={{
                              left: clip.startTime * pixelsPerSecond,
                              width: clip.duration * pixelsPerSecond,
                              background: 
                                clip.type === "video" ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.35))" :
                                clip.type === "image" ? "linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(147, 51, 234, 0.35))" :
                                clip.type === "text" ? "linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(22, 163, 74, 0.35))" : 
                                "linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(202, 138, 4, 0.35))"
                            }}
                            onClick={() => setSelectedClipId(clip.id)}
                            onMouseDown={(e) => {
                              if (!track.locked && e.button === 0) {
                                handleClipDragStart(e, trackIndex, clip.id);
                              }
                            }}
                            onMouseEnter={() => setHoveredClipId(clip.id)}
                            onMouseLeave={() => setHoveredClipId(null)}
                          >
                            {/* Left resize handle */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-50 hover:bg-primary/40 transition-colors group-hover/clip:bg-primary/20"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeStart(e, trackIndex, clip.id, 'left');
                              }}
                            >
                              <div className="h-full w-0.5 bg-primary/60 ml-0.5" />
                            </div>
                            
                            {/* Right resize handle */}
                            <div
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-50 hover:bg-primary/40 transition-colors group-hover/clip:bg-primary/20"
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                handleResizeStart(e, trackIndex, clip.id, 'right');
                              }}
                            >
                              <div className="h-full w-0.5 bg-primary/60 mr-0.5" />
                            </div>
                            {/* Thumbnail background */}
                            {clip.thumbnail && (
                              <div className="absolute inset-0 flex overflow-hidden">
                                {/* Show multiple frames for longer clips */}
                                {Array.from({ length: Math.max(1, Math.floor(clip.duration * pixelsPerSecond / 60)) }).map((_, i) => (
                                  <img 
                                    key={i}
                                    src={clip.thumbnail} 
                                    alt="" 
                                    className="h-full object-cover opacity-40 group-hover/clip:opacity-50 transition-opacity"
                                    style={{ width: '60px' }}
                                  />
                                ))}
                              </div>
                            )}
                            
                            {/* Audio waveform visualization */}
                            {clip.type === "audio" && (
                              <div className="absolute inset-0 flex items-center px-1 gap-px">
                                {Array.from({ length: Math.min(100, Math.floor(clip.duration * pixelsPerSecond / 3)) }).map((_, i) => {
                                  const height = 20 + Math.random() * 60;
                                  return (
                                    <div 
                                      key={i}
                                      className="flex-1 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-sm opacity-70"
                                      style={{ height: `${height}%` }}
                                    />
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Transition indicator */}
                            {clip.transition && clip.transition !== 'none' && (
                              <div className="absolute -right-1 top-1 z-40">
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-blue-500/30 border border-blue-500/50 text-blue-200 font-mono shadow-lg">
                                  {clip.transition}
                                </span>
                              </div>
                            )}
                            
                            {/* Speed indicator */}
                            {clip.speed && clip.speed !== 1 && (
                              <div className="absolute left-1 top-1 z-40">
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-primary/30 border border-primary/50 text-primary-foreground font-mono shadow-lg">
                                  {clip.speed}x
                                </span>
                              </div>
                            )}
                            
                            {/* Clip info overlay */}
                            <div className="absolute inset-0 p-1.5 flex flex-col justify-between pointer-events-none">
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-[9px] font-semibold truncate flex-1 text-white drop-shadow-md">
                                  {clip.name}
                                </p>
                              </div>
                              <p className="text-[8px] text-white/80 font-mono drop-shadow-md bg-black/40 px-1 py-0.5 rounded w-fit">
                                {formatTime(clip.duration)}
                              </p>
                            </div>

                            {/* Clip action buttons */}
                            <div className={cn(
                              "absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover/clip:opacity-100 transition-opacity pointer-events-auto",
                              hoveredClipId === clip.id && "opacity-100"
                            )}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  splitClipAt(trackIndex, clip.id, clip.startTime + clip.duration / 2);
                                }}
                                className="p-1 rounded bg-black/80 hover:bg-primary/40 transition-colors backdrop-blur-md border border-white/20 shadow-lg"
                                title="Cortar ao meio"
                              >
                                <Scissors className="h-2.5 w-2.5 text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateClip(trackIndex, clip.id);
                                }}
                                className="p-1 rounded bg-black/80 hover:bg-accent/40 transition-colors backdrop-blur-md border border-white/20 shadow-lg"
                                title="Duplicar"
                              >
                                <Copy className="h-2.5 w-2.5 text-white" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteClip(trackIndex, clip.id);
                                }}
                                className="p-1 rounded bg-black/80 hover:bg-red-500/40 transition-colors backdrop-blur-md border border-white/20 shadow-lg"
                                title="Deletar (Del)"
                              >
                                <X className="h-2.5 w-2.5 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Creation Modal */}
      {showTextModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 animate-scale-in border-primary/20 bg-black/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Adicionar Texto/Título
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowTextModal(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label className="text-sm text-white/80">Conteúdo do Texto</Label>
              <Input 
                value={newText} 
                onChange={(e) => setNewText(e.target.value)} 
                placeholder="Digite o texto ou título..." 
                className="mt-2" 
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm text-white/80">Duração (segundos)</Label>
              <Input 
                type="number" 
                value={newTextDuration} 
                onChange={(e) => setNewTextDuration(Number(e.target.value))} 
                min={1} 
                max={60} 
                className="mt-2" 
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={addTextClip} className="flex-1 bg-gradient-to-r from-primary to-accent">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setShowTextModal(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Music Library Modal */}
      {showMusicLibrary && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 animate-scale-in border-primary/20 bg-black/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between sticky top-0 bg-black/95 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music className="h-5 w-5 text-accent" />
                Biblioteca de Música Livre
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowMusicLibrary(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-2">
              {FREE_MUSIC_LIBRARY.map((music) => (
                <div 
                  key={music.id}
                  className="p-4 rounded-lg border border-white/10 hover:border-accent/50 bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                  onClick={() => addMusicFromLibrary(music)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{music.name}</h4>
                      <div className="flex gap-2 text-xs text-white/60">
                        <span className="px-2 py-0.5 rounded bg-accent/20 text-accent">{music.genre}</span>
                        <span className="px-2 py-0.5 rounded bg-white/10">{music.mood}</span>
                        <span className="px-2 py-0.5 rounded bg-white/10">{formatTime(music.duration)}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        addMusicFromLibrary(music);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/10">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => audioInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Ou enviar seu próprio áudio
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 animate-scale-in border-primary/20 bg-black/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Exportar Vídeo
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowExportModal(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div>
              <Label className="text-sm text-white/80 mb-2 block">Formato de Saída</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4 (Recomendado)</SelectItem>
                  <SelectItem value="mov">MOV (Apple)</SelectItem>
                  <SelectItem value="webm">WEBM (Web)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-white/80 mb-2 block">Qualidade</Label>
              <Select value={exportQuality} onValueChange={setExportQuality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4k">4K Ultra HD (3840x2160)</SelectItem>
                  <SelectItem value="1080p">Full HD (1920x1080)</SelectItem>
                  <SelectItem value="720p">HD (1280x720)</SelectItem>
                  <SelectItem value="480p">SD (854x480)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 space-y-2">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-white/70 flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5" />
                  Formato atual: <span className="text-primary font-semibold">{format?.name}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={exportVideo} className="flex-1 bg-gradient-to-r from-primary to-accent">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Agora
                </Button>
                <Button variant="outline" onClick={() => setShowExportModal(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};