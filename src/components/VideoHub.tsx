"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Play, ChevronRight, Pause, RotateCcw, RotateCw } from "lucide-react";
import { motion } from "framer-motion";

interface Video {
  id: number;
  title: string;
  youtube_url: string;
  description: string;
  index: number;
}

const VIDEOS: Video[] = [
  {
    id: 1,
    title: "Class 1",
    youtube_url: "https://www.youtube.com/watch?v=BiMQ-yiRim4",
    description: "Introduction to the course and fundamental concepts.",
    index: 1,
  },
  {
    id: 2,
    title: "Class 2",
    youtube_url: "https://www.youtube.com/watch?v=OIYajFhu1Ys",
    description: "Deep dive into specialized techniques and workflows.",
    index: 2,
  },
  {
    id: 3,
    title: "Class 3",
    youtube_url: "https://www.youtube.com/watch?v=3yBARf2h3Rg",
    description: "Advanced strategies for peak performance.",
    index: 3,
  },
  {
    id: 4,
    title: "Class 4",
    youtube_url: "https://www.youtube.com/watch?v=7panxaURIBY",
    description: "Practical applications and real-world case studies.",
    index: 4,
  },
  {
    id: 5,
    title: "Class 5",
    youtube_url: "https://www.youtube.com/watch?v=GDl7S8TR1u4",
    description: "Optimizing results and scaling your process.",
    index: 5,
  },
  {
    id: 6,
    title: "Class 6",
    youtube_url: "https://www.youtube.com/watch?v=Ed3BvIOW4Mc",
    description: "Masterclass on professional implementation.",
    index: 6,
  },
  {
    id: 7,
    title: "Class 7",
    youtube_url: "https://www.youtube.com/watch?v=z09SVKUzQc8",
    description: "Final review, troubleshooting, and next steps.",
    index: 7,
  },
  {
    id: 8,
    title: "CLASS 8",
    youtube_url: "https://www.youtube.com/watch?v=Pu0kzTY_naI",
    description: "Continuation of the journey with advanced modules and strategic patterns.",
    index: 8,
  },
  {
    id: 9,
    title: "CLASS 9",
    youtube_url: "https://www.youtube.com/watch?v=kcIDdp4prHo",
    description: "Deepening your expertise with specialized workflows and hands-on examples.",
    index: 9,
  },
];

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function VideoHub() {
  const [activeVideo, setActiveVideo] = useState<Video>(VIDEOS[0]);
  const [loading, setLoading] = useState(true);

  // Video Player state
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadYoutubeAPI();
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  function loadYoutubeAPI() {
    if (window.YT) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("YouTube API Ready");
    };
  }

  useEffect(() => {
    if (activeVideo && window.YT && window.YT.Player) {
      if (player) {
        player.loadVideoById(getYouTubeId(activeVideo.youtube_url));
        setIsPlaying(false);
      } else {
        const newPlayer = new window.YT.Player("custom-player", {
          videoId: getYouTubeId(activeVideo.youtube_url),
          playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startProgressTracker(event.target);
              } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                stopProgressTracker();
              }
            },
          },
        });
      }
    }
  }, [activeVideo, player]);

  function startProgressTracker(playerInstance: any) {
    stopProgressTracker();
    progressInterval.current = setInterval(() => {
      const currentTime = playerInstance.getCurrentTime();
      const videoDuration = playerInstance.getDuration();
      setDuration(videoDuration);
      setProgress((currentTime / videoDuration) * 100);
    }, 1000);
  }

  function stopProgressTracker() {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  }

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const skip = (amount: number) => {
    if (!player) return;
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + amount, true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!player) return;
    const seekTo = (parseFloat(e.target.value) / 100) * duration;
    player.seekTo(seekTo, true);
    setProgress(parseFloat(e.target.value));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-purple-600 font-heading text-2xl animate-pulse">Loading Premium Portal...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      <nav className="h-16 md:h-20 border-b border-purple-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 purple-gradient rounded-lg md:rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <Play className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
          </div>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-gray-900 tracking-tight">
            Poitsix<span className="text-purple-600">Coaching</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
            <button className="hidden sm:block text-gray-500 hover:text-purple-600 font-medium transition-colors">Courses</button>
            <button className="px-4 py-2 md:px-5 md:py-2.5 purple-gradient text-white rounded-full text-sm md:text-base font-semibold shadow-purple-200 shadow-xl hover:scale-105 transition-transform">Get Started</button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          <div className="relative group">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl bg-black glow-purple relative"
            >
                <div id="custom-player" className="w-full h-full pointer-events-none"></div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
                    <div className="relative w-full mb-4 md:mb-6">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:h-2 transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 md:gap-8">
                            <button onClick={() => skip(-10)} className="text-white hover:text-purple-400 transition-colors p-2 bg-white/10 rounded-full backdrop-blur-sm">
                                <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            
                            <button onClick={togglePlay} className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95">
                                {isPlaying ? <Pause className="fill-white w-6 h-6 md:w-8 md:h-8" /> : <Play className="fill-white translate-x-1 w-6 h-6 md:w-8 md:h-8" />}
                            </button>

                            <button onClick={() => skip(10)} className="text-white hover:text-purple-400 transition-colors p-2 bg-white/10 rounded-full backdrop-blur-sm">
                                <RotateCw className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <div className="hidden sm:block text-white/80 font-mono text-sm">
                            {Math.floor((progress / 100 * duration) / 60)}:{(Math.floor((progress / 100 * duration) % 60)).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>
            </motion.div>
          </div>

          <div className="px-1">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2 md:mb-3 leading-tight">{activeVideo.title}</h2>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-3xl">{activeVideo.description}</p>
          </div>

          {/* Curriculum - Mobile Only View */}
          <div className="lg:hidden">
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-4 flex items-center justify-between">
                    Course Curriculum
                    <span className="text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Chapter {activeVideo.index} of {VIDEOS.length}</span>
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {VIDEOS.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setActiveVideo(v)}
                            className={cn(
                                "flex-shrink-0 w-64 snap-start p-3 rounded-xl flex items-center gap-3 border transition-all",
                                activeVideo.id === v.id 
                                    ? "bg-purple-600 border-purple-600 text-white" 
                                    : "bg-purple-50/50 border-purple-100 text-gray-600"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                activeVideo.id === v.id ? "bg-white/20" : "bg-purple-100"
                            )}>
                                {activeVideo.id === v.id ? <Play className="w-3 h-3 text-white fill-white" /> : <span className="text-xs font-bold text-purple-600">{v.index}</span>}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-xs font-bold truncate">{v.title}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28">
            <div className="premium-glass rounded-3xl p-6 border border-purple-100">
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-6 underline decoration-purple-100 underline-offset-8">Course Curriculum</h3>
              <div className="space-y-3">
                {VIDEOS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVideo(v)}
                    className={cn(
                      "w-full group text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300",
                      activeVideo.id === v.id 
                        ? "bg-purple-600 text-white shadow-xl shadow-purple-200 scale-[1.02]" 
                        : "hover:bg-purple-50 text-gray-600 hover:text-purple-600"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                      activeVideo.id === v.id ? "bg-white/20" : "bg-purple-100 group-hover:bg-purple-200"
                    )}>
                      {activeVideo.id === v.id ? <Play className="w-4 h-4 text-white fill-white" /> : <span className="text-sm font-bold text-purple-600">{v.index}</span>}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold truncate">{v.title}</div>
                      <div className={cn("text-[10px] uppercase tracking-wider font-bold mt-0.5", activeVideo.id === v.id ? "text-white/60" : "text-gray-400")}>Chapter {v.index}</div>
                    </div>
                    <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", activeVideo.id === v.id && "opacity-100")} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
