"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, UploadCloud, X, CheckCircle2, Heart, AlertCircle, LogOut, Home as HomeIcon, LayoutGrid, MessageSquare, User, Send, Users, Film } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn, signOut } from "next-auth/react";

// --- Tipos ---
type Photo = {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  guest_image?: string;
  media_type?: string;
  likes: { guest_email: string }[];
  comments: Comment[];
};

type Comment = {
  id: string;
  guest_name: string;
  guest_image: string;
  text: string;
  created_at: string;
};

type Message = {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_image: string;
  message: string;
  created_at: string;
};

const loginPhotoStyles = [
  "login-photo--portrait login-photo--one",
  "login-photo--landscape login-photo--two",
  "login-photo--square login-photo--three",
  "login-photo--portrait login-photo--four",
  "login-photo--landscape login-photo--five",
  "login-photo--square login-photo--six",
];

const loginPhotos = Array.from({ length: 19 }, (_, index) => ({
  src: `/image/login-${String(index + 1).padStart(2, "0")}.jpg`,
  alt: `Foto do casal ${index + 1}`,
  className: loginPhotoStyles[index % loginPhotoStyles.length],
}));

const loginCarouselPhotos = loginPhotos.slice(0, 10);

export default function Home() {
  const { data: session, status } = useSession();
  const [authError, setAuthError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"home" | "gallery" | "messages" | "profile">("home");
  const [gallerySubTab, setGallerySubTab] = useState<"all" | "videos" | "likes">("all");

  // Data State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [contentError, setContentError] = useState("");

  // Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // Messages State
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [selectedPhotoForComments, setSelectedPhotoForComments] = useState<Photo | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSendingComment, setIsSendingComment] = useState(false);
  
  const [selectedMedia, setSelectedMedia] = useState<Photo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleLike = async (photoId: string) => {
    if (!session?.user?.email) return;

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        body: JSON.stringify({
          photo_id: photoId,
          guest_email: session.user.email
        })
      });

      if (res.ok) {
        fetchPhotos(); // Atualiza contagem de likes
      }
    } catch (error) {
      console.error("Erro ao curtir:", error);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPhotoForComments || !session?.user) return;

    setIsSendingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          photo_id: selectedPhotoForComments.id,
          guest_name: session.user.name,
          guest_email: session.user.email,
          guest_image: session.user.image,
          text: newComment
        })
      });

      if (res.ok) {
        setNewComment("");
        fetchPhotos(); // Recarrega para mostrar o comentário
        // Opcional: atualizar o selectedPhotoForComments também
        const data = await res.json();
        if (selectedPhotoForComments) {
          setSelectedPhotoForComments(prev => prev ? { ...prev, comments: [...prev.comments, data.comment] } : null);
        }
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
    } finally {
      setIsSendingComment(false);
    }
  };

  // --- Fetch Data ---
  const fetchPhotos = async () => {
    try {
      setContentError("");
      const res = await fetch("/api/gallery", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar galeria");
      }
      if (data.photos) setPhotos(data.photos);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
      setContentError("Nao foi possivel carregar a galeria. Atualize a pagina ou tente novamente em alguns instantes.");
    } finally {
      setLoadingPhotos(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar mensagens");
      }
      if (data.messages) setMessages(data.messages);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      setContentError("Nao foi possivel carregar as mensagens. Atualize a pagina ou tente novamente em alguns instantes.");
    }
  };

  useEffect(() => {
    if (session) {
      fetchPhotos();
      fetchMessages();
    }
  }, [session]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) {
      setAuthError("");
      return;
    }

    const messages: Record<string, string> = {
      OAuthCallback: "Não foi possível concluir o retorno do Google. Tente entrar novamente pela mesma aba.",
      OAuthSignin: "Não foi possível iniciar o login com Google. Verifique a configuração do OAuth.",
      OAuthAccountNotLinked: "Este e-mail já existe com outro método de login.",
      AccessDenied: "O acesso foi recusado para esta conta.",
      Configuration: "A configuração do login com Google precisa ser revisada.",
      Verification: "O link de login expirou. Tente novamente.",
    };

    setAuthError(messages[error] || "Não foi possível entrar com Google. Tente novamente.");
  }, []);

  // --- Upload Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const guestName = session?.user?.name || "Anonimo";
    const guestEmail = session?.user?.email || "";
    const guestImage = session?.user?.image || "";

    try {
      let completed = 0;

      const uploadPromises = files.map(async (file) => {
        const urlParams = new URLSearchParams({
          filename: file.name,
          fileType: file.type,
          guestName,
          guestEmail,
          guestImage
        });

        const response = await fetch(`/api/upload?${urlParams.toString()}`, {
          method: 'POST',
          body: file,
        });

        if (!response.ok) {
          let errorMsg = 'Falha no upload de um dos arquivos';
          try {
            const errorData = await response.json();
            if (errorData.error) errorMsg = errorData.error;
          } catch (e) { }
          throw new Error(errorMsg);
        }

        completed++;
        setUploadProgress(10 + Math.floor((completed / files.length) * 90));
      });

      await Promise.all(uploadPromises);

      // Recarrega as fotos para aparecerem no feed/galeria
      fetchPhotos();

      setIsSuccess(true);
      setIsUploading(false);
      setFiles([]);
      setUploadProgress(0);

    } catch (error: any) {
      console.error(error);
      setIsUploading(false);
      setUploadProgress(0);
      setErrorModal({
        show: true,
        message: error.message || "Ops! Ocorreu um erro na hora de enviar. Verifique sua conexão e tente novamente."
      });
    }
  };

  // --- Send Message Logic ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: session?.user?.name || "Anonimo",
          guest_email: session?.user?.email || "",
          guest_image: session?.user?.image || "",
          message: newMessage
        })
      });

      if (res.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // --- Renders de Autenticação ---
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-[#faf9f8]">Carregando...</div>;
  }

  if (!session) {
    return (
      <main className="login-page">
        <div className="login-collage" aria-hidden="true">
          <div className="login-collage__track login-collage__track--top">
            {[...loginCarouselPhotos, ...loginCarouselPhotos].map((photo, index) => (
              <div className={`login-photo ${photo.className}`} key={`top-${photo.src}-${index}`}>
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 42vw, 24vw"
                  quality={58}
                  loading={index < 3 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <div className="login-collage__track login-collage__track--bottom">
            {[...loginCarouselPhotos, ...loginCarouselPhotos].map((photo, index) => (
              <div className={`login-photo ${photo.className}`} key={`bottom-${photo.src}-${index}`}>
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 42vw, 24vw"
                  quality={58}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="login-page__glow login-page__glow--top" aria-hidden="true" />
        <div className="login-page__glow login-page__glow--bottom" aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="login-card"
        >
          <div className="login-card__eyebrow">
            <span className="login-card__line" />
            <span>Nosso álbum</span>
            <span className="login-card__line" />
          </div>

          <div className="login-card__heart" aria-hidden="true">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          <h1 className="login-card__title">Laís <span>&</span> Luan</h1>
          <p className="login-card__date">Um lugar para guardar cada instante</p>

          <div className="login-card__divider" aria-hidden="true">
            <span />
            <Heart className="h-3 w-3 fill-current" />
            <span />
          </div>

          <p className="login-card__description">
            Entre para compartilhar suas fotos e reviver a nossa história com todos os convidados.
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="login-card__button"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </button>

          {authError && (
            <p className="login-card__error" role="alert">
              {authError}
            </p>
          )}

          <p className="login-card__hint">Apenas convidados podem acessar o álbum</p>
        </motion.div>
      </main>
    );
  }

  // --- Render Tabs ---
  return (
    <main className="flex flex-col h-[100dvh] bg-[#faf9f8] overflow-hidden relative">

      {/* Esconder a UI principal se estiver na tela de envio (com arquivos selecionados) */}
      {!files.length && !isSuccess && (
        <div className="flex-1 overflow-y-auto pb-20">

          {/* TAB HOME (FEED INSTAGRAM) */}
          {activeTab === "home" && (
            <div className="flex flex-col">
              <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-gray-100 flex justify-center items-center">
                <h1 className="font-serif text-2xl text-wedding-dark">Laís & Luan</h1>
              </div>

              <div className="flex flex-col gap-6 py-4">
                {contentError ? (
                  <div className="mx-4 rounded-2xl bg-red-50 p-4 text-center text-sm text-red-600">
                    {contentError}
                  </div>
                ) : loadingPhotos ? (
                  <div className="text-center p-8 text-gray-400">Carregando feed...</div>
                ) : [...photos.map(p => ({ type: 'photo' as const, data: p })), ...messages.map(m => ({ type: 'message' as const, data: m }))]
                  .sort((a, b) => {
                    const dateA = a.type === 'photo' ? new Date(a.data.createdAt) : new Date(a.data.created_at);
                    const dateB = b.type === 'photo' ? new Date(b.data.createdAt) : new Date(b.data.created_at);
                    return dateB.getTime() - dateA.getTime();
                  }).length === 0 ? (
                  <div className="text-center p-8 text-gray-400">Nenhuma foto ou mensagem ainda. Seja o primeiro!</div>
                ) : (
                  [...photos.map(p => ({ type: 'photo' as const, data: p })), ...messages.map(m => ({ type: 'message' as const, data: m }))]
                    .sort((a, b) => {
                      const dateA = a.type === 'photo' ? new Date(a.data.createdAt) : new Date(a.data.created_at);
                      const dateB = b.type === 'photo' ? new Date(b.data.createdAt) : new Date(b.data.created_at);
                      return dateB.getTime() - dateA.getTime();
                    }).map((item, index) => {

                      if (item.type === 'photo') {
                        const photo = item.data;
                        const isLiked = photo.likes.some(l => l.guest_email === session?.user?.email);

                        return (
                          <motion.div
                            key={`photo-${photo.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-y sm:border border-gray-100"
                          >
                            <div className="flex items-center p-3 gap-3">
                              {photo.guest_image ? (
                                <img src={photo.guest_image} className="w-8 h-8 rounded-full object-cover" alt={photo.name} referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-8 h-8 bg-wedding-rose rounded-full flex items-center justify-center text-wedding-gold font-bold text-xs uppercase">
                                  {photo.name.charAt(0)}
                                </div>
                              )}
                              <span className="font-medium text-sm text-gray-800">{photo.name}</span>
                            </div>
                            <div 
                              className="aspect-square w-full bg-black relative cursor-pointer"
                              onClick={() => setSelectedMedia(photo)}
                            >
                              {photo.media_type === 'video' ? (
                                <video
                                  src={photo.url}
                                  className="w-full h-full object-contain"
                                  controls
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={photo.url}
                                  alt="Momento do casamento"
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="p-3">
                              <div className="flex gap-4 text-gray-800 mb-2 items-center">
                                <button onClick={() => handleLike(photo.id)} className="flex items-center gap-1 transition-transform active:scale-90">
                                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                                  {photo.likes.length > 0 && <span className="text-xs font-semibold">{photo.likes.length}</span>}
                                </button>
                                <button onClick={() => setSelectedPhotoForComments(photo)} className="flex items-center gap-1">
                                  <MessageSquare className="w-6 h-6" />
                                  {photo.comments.length > 0 && <span className="text-xs font-semibold">{photo.comments.length}</span>}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      } else {
                        const msg = item.data;
                        return (
                          <motion.div
                            key={`msg-${msg.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border-y sm:border border-gray-100 p-4 px-5"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {msg.guest_image ? (
                                <img src={msg.guest_image} className="w-10 h-10 rounded-full object-cover" alt={msg.guest_name} referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 bg-wedding-rose rounded-full flex items-center justify-center text-wedding-gold font-bold">
                                  {msg.guest_name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <h4 className="font-medium text-gray-900">{msg.guest_name}</h4>
                                <span className="text-xs text-gray-400">
                                  {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-800 text-sm leading-relaxed">{msg.message}</p>
                          </motion.div>
                        );
                      }
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB GALLERY (GRID) */}
          {activeTab === "gallery" && (
            <div className="flex flex-col bg-white min-h-full">
              <div className="sticky top-0 bg-white z-10">
                <div className="flex justify-around items-center border-b border-gray-200">
                  <button
                    onClick={() => setGallerySubTab("all")}
                    className={`flex-1 py-3 flex justify-center border-b-2 ${gallerySubTab === 'all' ? 'border-[#fc7474]' : 'border-transparent'}`}
                  >
                    <LayoutGrid className={`w-6 h-6 ${gallerySubTab === 'all' ? 'text-gray-800' : 'text-gray-300'}`} />
                  </button>
                  <button
                    onClick={() => setGallerySubTab("videos")}
                    className={`flex-1 py-3 flex justify-center border-b-2 ${gallerySubTab === 'videos' ? 'border-[#fc7474]' : 'border-transparent'}`}
                  >
                    <Film className={`w-6 h-6 ${gallerySubTab === 'videos' ? 'text-gray-800' : 'text-gray-300'}`} />
                  </button>
                  <button
                    onClick={() => setGallerySubTab("likes")}
                    className={`flex-1 py-3 flex justify-center border-b-2 ${gallerySubTab === 'likes' ? 'border-[#fc7474]' : 'border-transparent'}`}
                  >
                    <Heart className={`w-6 h-6 ${gallerySubTab === 'likes' ? 'text-gray-800' : 'text-gray-300'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-[2px] p-[2px]">
                {loadingPhotos ? (
                  <div className="col-span-3 text-center p-8 text-gray-400">Carregando galeria...</div>
                ) : (
                  photos
                    .filter(p => {
                      if (gallerySubTab === 'videos') return p.media_type === 'video';
                      if (gallerySubTab === 'likes') return p.likes.some(l => l.guest_email === session?.user?.email);
                      return true;
                    })
                    .map((photo) => (
                      <div 
                        key={photo.id} 
                        className="aspect-square bg-gray-100 relative group cursor-pointer"
                        onClick={() => setSelectedMedia(photo)}
                      >
                        {photo.media_type === 'video' ? (
                          <>
                            <video src={photo.url} className="w-full h-full object-cover" />
                            <div className="absolute top-1 right-1">
                              <Film className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          </>
                        ) : (
                          <img
                            src={photo.url}
                            alt="Miniatura"
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB MESSAGES (GUESTBOOK) */}
          {activeTab === "messages" && (
            <div className="flex flex-col min-h-full">
              <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-gray-100 flex justify-center items-center shadow-sm">
                <h1 className="font-serif text-2xl text-wedding-dark">Mensagens</h1>
              </div>

              <div className="flex-1 p-4 flex flex-col gap-4">
                {/* Formulário de Nova Mensagem */}
                <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                  <textarea
                    placeholder="Deixe um recadinho para os noivos..."
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm border-none focus:ring-1 focus:ring-wedding-gold resize-none outline-none"
                    rows={3}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      disabled={isSendingMessage || !newMessage.trim()}
                      className="bg-[#fc7474] text-white px-5 py-2 rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-opacity"
                    >
                      {isSendingMessage ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar</>}
                    </button>
                  </div>
                </form>

                {/* Lista de Mensagens */}
                <div className="flex flex-col gap-4 mt-4">
                  {messages.length === 0 ? (
                    <div className="text-center p-8 text-gray-400">Seja o primeiro a deixar uma mensagem!</div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                        <div className="flex items-center gap-3 mb-2">
                          {msg.guest_image ? (
                            <img src={msg.guest_image} className="w-10 h-10 rounded-full object-cover" alt={msg.guest_name} referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-wedding-rose rounded-full flex items-center justify-center text-wedding-gold font-bold">
                              {msg.guest_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{msg.guest_name}</h4>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB PROFILE */}
          {activeTab === "profile" && (
            <div className="flex flex-col items-center justify-center p-6 h-full">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center w-full max-w-sm">
                {session.user?.image ? (
                  <img src={session.user.image} alt={session.user.name || "User"} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-[#fc7474]/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-24 h-24 bg-[#fc7474]/10 rounded-full flex items-center justify-center mb-4">
                    <User className="w-10 h-10 text-[#fc7474]" />
                  </div>
                )}
                <h2 className="font-serif text-2xl text-gray-900 mb-1">{session.user?.name}</h2>
                <p className="text-gray-500 text-sm mb-8">{session.user?.email}</p>

                {session.user?.email === 'luan.ramalhosilva@gmail.com' && (
                  <button
                    onClick={() => window.open('/slideshow', '_blank')}
                    className="w-full bg-wedding-dark text-wedding-gold font-medium py-4 rounded-full flex items-center justify-center gap-2 mb-3 shadow-lg shadow-wedding-dark/20 hover:scale-[1.02] transition-transform"
                  >
                    < Film className="w-5 h-5" />
                    Abrir Painel do Telão
                  </button>
                )}
                
                <button
                  onClick={() => signOut()}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-4 rounded-full flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Upload Flow Overlays (Secreta as abas e foca no envio) */}
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {files.length > 0 && !isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            className="fixed inset-0 z-50 bg-[#faf9f8] flex flex-col"
          >
            <div className="pt-12 pb-4 px-6 flex justify-between items-center bg-white border-b border-gray-100 shadow-sm">
              <h2 className="font-serif text-xl text-wedding-dark">Fotos Selecionadas ({files.length})</h2>
              <button onClick={() => setFiles([])} className="p-2 bg-gray-100 rounded-full text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative aspect-square rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 pb-safe">
              {isUploading ? (
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium text-gray-700">
                    <span>Enviando fotos...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-wedding-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ ease: "easeInOut" }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="w-full bg-[#fc7474] text-white font-medium py-4 rounded-full flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-[#fc7474]/30"
                >
                  <UploadCloud className="w-5 h-5" />
                  Enviar {files.length} {files.length === 1 ? 'foto' : 'fotos'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Screen Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-[#faf9f8] flex items-center justify-center p-6"
          >
            <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center max-w-sm w-full text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="font-serif text-3xl font-medium mb-4 text-gray-900">Sucesso!</h1>
              <p className="text-gray-600 mb-8 font-sans">
                Suas fotos já estão na galeria.
              </p>
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setActiveTab("home");
                }}
                className="w-full bg-[#fc7474] text-white font-medium py-4 rounded-full transition-transform active:scale-95"
              >
                Voltar para o Feed
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Erro */}
      <AnimatePresence>
        {errorModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-medium mb-2 text-gray-900">Algo deu errado</h3>
              <p className="text-gray-500 font-sans mb-6 text-sm">
                {errorModal.message}
              </p>
              <button
                onClick={() => setErrorModal({ show: false, message: "" })}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-full transition-colors active:scale-95"
              >
                Entendi, tentar novamente
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Visualização Fullscreen */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center gap-3">
                {selectedMedia.guest_image ? (
                  <img src={selectedMedia.guest_image} className="w-8 h-8 rounded-full" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-wedding-rose rounded-full flex items-center justify-center text-wedding-gold font-bold text-xs">
                    {selectedMedia.name.charAt(0)}
                  </div>
                )}
                <span className="text-white font-medium text-sm">{selectedMedia.name}</span>
              </div>
              <button 
                onClick={() => setSelectedMedia(null)}
                className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="w-full h-full flex items-center justify-center p-4">
              {selectedMedia.media_type === 'video' ? (
                <video 
                  src={selectedMedia.url} 
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img 
                  src={selectedMedia.url} 
                  className="max-w-full max-h-full object-contain"
                  alt="Full size"
                />
              )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-8 bg-gradient-to-t from-black/60 to-transparent">
              <button onClick={() => handleLike(selectedMedia.id)} className="flex flex-col items-center gap-1">
                <Heart className={`w-8 h-8 ${selectedMedia.likes.some(l => l.guest_email === session?.user?.email) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                <span className="text-white text-xs font-medium">{selectedMedia.likes.length} curtidas</span>
              </button>
              <button onClick={() => setSelectedPhotoForComments(selectedMedia)} className="flex flex-col items-center gap-1">
                <MessageSquare className="w-8 h-8 text-white" />
                <span className="text-white text-xs font-medium">{selectedMedia.comments.length} comentários</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Comentários */}
      <AnimatePresence>
        {selectedPhotoForComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white rounded-t-[32px] sm:rounded-3xl w-full max-w-lg flex flex-col h-[80vh] sm:h-[600px] overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-serif text-xl text-gray-900">Comentários</h3>
                <button onClick={() => setSelectedPhotoForComments(null)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {selectedPhotoForComments.comments.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-20">
                    <MessageSquare className="w-12 h-12 opacity-20" />
                    <p className="text-sm">Nenhum comentário ainda. Comece a conversa!</p>
                  </div>
                ) : (
                  selectedPhotoForComments.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      {comment.guest_image ? (
                        <img src={comment.guest_image} className="w-10 h-10 rounded-full object-cover shrink-0" alt={comment.guest_name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 bg-wedding-rose rounded-full flex items-center justify-center text-wedding-gold font-bold shrink-0">
                          {comment.guest_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col bg-gray-50 p-3 rounded-2xl rounded-tl-none">
                        <div className="flex justify-between items-center gap-4 mb-1">
                          <span className="font-bold text-xs text-gray-900">{comment.guest_name}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-100 pb-safe">
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#fc7474]"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button
                    disabled={isSendingComment || !newComment.trim()}
                    className="bg-[#fc7474] text-white p-3 rounded-full disabled:opacity-50 transition-transform active:scale-95"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVIGATION BAR */}
      {!files.length && !isSuccess && (
        <nav className="fixed bottom-0 w-full h-[68px] bg-white border-t border-gray-100 z-40 flex justify-around items-center px-2 pb-safe shadow-[0_-2px_20px_rgba(0,0,0,0.03)]">
          <button onClick={() => setActiveTab("home")} className="p-3 text-gray-400">
            <HomeIcon className={`w-7 h-7 ${activeTab === 'home' ? 'text-[#fc7474]' : ''}`} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          </button>

          <button onClick={() => setActiveTab("gallery")} className="p-3 text-gray-400">
            <LayoutGrid className={`w-7 h-7 ${activeTab === 'gallery' ? 'text-[#fc7474]' : ''}`} strokeWidth={activeTab === 'gallery' ? 2.5 : 2} />
          </button>

          {/* FAB Central Button */}
          <div className="relative -top-6">
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  // Opcional: focar na câmera direto no celular
                  // fileInputRef.current.setAttribute("capture", "environment");
                  fileInputRef.current.click();
                }
              }}
              className="w-16 h-16 bg-[#fc7474] rounded-full flex items-center justify-center border-[6px] border-[#faf9f8] shadow-lg shadow-[#fc7474]/30 active:scale-95 transition-transform"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>

          <button onClick={() => setActiveTab("messages")} className="p-3 text-gray-400">
            <MessageSquare className={`w-7 h-7 ${activeTab === 'messages' ? 'text-[#fc7474]' : ''}`} strokeWidth={activeTab === 'messages' ? 2.5 : 2} />
          </button>

          <button onClick={() => setActiveTab("profile")} className="p-3">
            {session.user?.image ? (
              <img src={session.user.image} className={`w-8 h-8 rounded-full border-2 ${activeTab === 'profile' ? 'border-[#fc7474]' : 'border-transparent'}`} alt="Perfil" referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${activeTab === 'profile' ? 'border-[#fc7474]' : 'border-transparent'}`}>
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </button>
        </nav>
      )}
    </main>
  );
}

