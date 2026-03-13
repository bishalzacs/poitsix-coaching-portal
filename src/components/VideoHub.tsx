"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Play, MessageCircle, ChevronRight, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Video {
  id: number;
  title: string;
  youtube_url: string;
  description: string;
  index: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string; avatar_url: string };
}

export default function VideoHub() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (activeVideo) {
      fetchComments(activeVideo.id);
      // Subscribe to real-time comments
      const channel = supabase
        .channel(`video-comments-${activeVideo.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "comments",
            filter: `video_id=eq.${activeVideo.id}`,
          },
          (payload) => {
            setComments((prev) => [payload.new as Comment, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeVideo]);

  async function fetchVideos() {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("index", { ascending: true });
    if (data) {
      setVideos(data);
      setActiveVideo(data[0]);
    }
    setLoading(false);
  }

  async function fetchComments(videoId: number) {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(display_name, avatar_url)")
      .eq("video_id", videoId)
      .order("created_at", { ascending: false });
    if (data) setComments(data);
  }

  async function handleAddComment() {
    if (!newComment.trim() || !activeVideo) return;
    
    // In a real app, we'd ensure the user is logged in
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
        alert("Please sign in to post a doubt!");
        return;
    }

    const { error } = await supabase.from("comments").insert({
      video_id: activeVideo.id,
      user_id: userData.user.id,
      content: newComment,
    });

    if (!error) {
      setNewComment("");
      fetchComments(activeVideo.id); // Fallback for profile data
    }
  }

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-purple-600 font-heading text-2xl animate-pulse">Loading Premium Portal...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      {/* Header */}
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
        {/* Main Content: Video & Metadata */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          {/* Main Video Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl bg-black glow-purple"
          >
            {activeVideo && (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${getYouTubeId(activeVideo.youtube_url)}?autoplay=0&rel=0&modestbranding=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </motion.div>

          <div className="px-1">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2 md:mb-3 leading-tight">{activeVideo?.title}</h2>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-3xl">{activeVideo?.description}</p>
          </div>

          {/* Curriculum - Mobile Only View (placed between video and doubts) */}
          <div className="lg:hidden">
            <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm">
                <h3 className="text-lg font-heading font-bold text-gray-900 mb-4 flex items-center justify-between">
                    Course Curriculum
                    <span className="text-sm font-normal text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Chapter {activeVideo?.index} of {videos.length}</span>
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {videos.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setActiveVideo(v)}
                            className={cn(
                                "flex-shrink-0 w-64 snap-start p-3 rounded-xl flex items-center gap-3 border transition-all",
                                activeVideo?.id === v.id 
                                    ? "bg-purple-600 border-purple-600 text-white" 
                                    : "bg-purple-50/50 border-purple-100 text-gray-600"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                activeVideo?.id === v.id ? "bg-white/20" : "bg-purple-100"
                            )}>
                                {activeVideo?.id === v.id ? <Play className="w-3 h-3 text-white fill-white" /> : <span className="text-xs font-bold text-purple-600">{v.index}</span>}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="text-xs font-bold truncate">{v.title}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
          </div>

          {/* Doubt/Comment Section */}
          <section className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-8 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 md:mb-8">
              <MessageCircle className="text-purple-600 w-5 h-5 md:w-6 md:h-6" />
              <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-900">Doubt Section</h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8 md:mb-10">
              <div className="hidden sm:flex w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center border border-purple-100 shrink-0">
                <User className="text-purple-400 w-6 h-6" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a doubt about this class..."
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-gray-700 min-h-[100px] text-sm md:text-base"
                />
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={handleAddComment}
                    className="w-full sm:w-auto px-6 py-3 md:py-2.5 purple-gradient text-white rounded-xl font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-opacity"
                  >
                    Post Question
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <AnimatePresence mode="popLayout">
                {comments.map((comment) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-purple-50/50 transition-colors border border-transparent hover:border-purple-100"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="text-purple-400 w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm md:text-base text-gray-900">{comment.profiles?.display_name || "Student"}</span>
                        <span className="text-[10px] md:text-xs text-gray-400 capitalize">• {new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 text-sm md:text-base leading-relaxed">{comment.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Desktop Sidebar (Hidden on mobile) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28">
            <div className="premium-glass rounded-3xl p-6 border border-purple-100">
              <h3 className="text-xl font-heading font-bold text-gray-900 mb-6">Course Curriculum</h3>
              <div className="space-y-3">
                {videos.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setActiveVideo(v)}
                    className={cn(
                      "w-full group text-left p-4 rounded-2xl flex items-center gap-4 transition-all duration-300",
                      activeVideo?.id === v.id 
                        ? "bg-purple-600 text-white shadow-xl shadow-purple-200" 
                        : "hover:bg-purple-50 text-gray-600 hover:text-purple-600"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      activeVideo?.id === v.id ? "bg-white/20" : "bg-purple-100 group-hover:bg-purple-200"
                    )}>
                      {activeVideo?.id === v.id ? 
                        <Play className="w-4 h-4 text-white fill-white" /> : 
                        <span className="text-sm font-bold text-purple-600">{v.index}</span>
                      }
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold truncate">{v.title}</div>
                      <div className={cn(
                        "text-[10px] uppercase tracking-wider font-bold mt-0.5",
                        activeVideo?.id === v.id ? "text-white/60" : "text-gray-400"
                      )}>
                        Chapter {v.index}
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                      activeVideo?.id === v.id && "opacity-100"
                    )} />
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Upsell Card */}
            <div className="mt-6 purple-gradient rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4">
                    <div className="w-32 h-32 rounded-full border-8 border-white"></div>
                </div>
                <h4 className="text-xl font-heading font-bold mb-2 text-white">Expert Certificate</h4>
                <p className="text-white/80 text-sm mb-4">Complete all chapters and pass the final exam to earn your certificate.</p>
                <button className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold hover:bg-violet-50 transition-colors">Apply Now</button>
            </div>
          </div>
        </div>

        {/* Mobile-only Upsell Card (Fixed at bottom or below content) */}
        <div className="lg:hidden mt-4">
            <div className="purple-gradient rounded-2xl p-6 text-white shadow-xl">
                <h4 className="text-lg font-heading font-bold mb-1 text-white">Expert Certificate</h4>
                <p className="text-white/80 text-xs mb-4">Unlock your professional badge today.</p>
                <button className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold shadow-lg">Apply Now</button>
            </div>
        </div>
      </main>
    </div>
  );
}
