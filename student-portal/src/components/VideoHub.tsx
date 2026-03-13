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
      <nav className="h-20 border-b border-purple-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 purple-gradient rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-gray-900 tracking-tight">
            Poitsix<span className="text-purple-600">Coaching</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
            <button className="text-gray-500 hover:text-purple-600 font-medium transition-colors">Courses</button>
            <button className="px-5 py-2.5 purple-gradient text-white rounded-full font-semibold shadow-purple-200 shadow-xl hover:scale-105 transition-transform">Get Started</button>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Video & Comments */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Main Video Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black glow-purple"
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

          <div className="p-4">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">{activeVideo?.title}</h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-3xl">{activeVideo?.description}</p>
          </div>

          {/* Doubt/Comment Section */}
          <section className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <MessageCircle className="text-purple-600 w-6 h-6" />
              <h3 className="text-2xl font-heading font-bold text-gray-900">Doubt Section</h3>
            </div>

            <div className="flex gap-4 mb-10">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100 shrink-0">
                <User className="text-purple-400 w-6 h-6" />
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ask a doubt about this class..."
                  className="w-full bg-purple-50/30 border border-purple-100 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all text-gray-700 min-h-[100px]"
                />
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={handleAddComment}
                    className="px-6 py-2.5 purple-gradient text-white rounded-xl font-bold shadow-lg shadow-purple-100 hover:opacity-90 transition-opacity"
                  >
                    Post Question
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {comments.map((comment) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-4 p-4 rounded-2xl hover:bg-purple-50/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-white border border-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="text-purple-400 w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{comment.profiles?.display_name || "Student"}</span>
                        <span className="text-xs text-gray-400">• {new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{comment.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Sidebar Playlist */}
        <div className="lg:col-span-4">
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
                <h4 className="text-xl font-heading font-bold mb-2">Expert Certificate</h4>
                <p className="text-white/80 text-sm mb-4">Complete all chapters and pass the final exam to earn your certificate.</p>
                <button className="w-full bg-white text-purple-600 py-3 rounded-xl font-bold hover:bg-violet-50 transition-colors">Apply Now</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
