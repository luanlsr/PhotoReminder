import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PhotoRow = {
  id: string;
  url: string;
  guest_name?: string;
  guest_email?: string;
  user_id?: string;
};

type LikeRow = {
  id: string;
  photo_id: string;
  guest_email?: string;
  user_id?: string;
  created_at: string;
};

type CommentRow = {
  id: string;
  photo_id: string;
  guest_name?: string;
  guest_email?: string;
  guest_image?: string;
  user_id?: string;
  text?: string;
  created_at: string;
};

const getDisplayName = (name?: string, email?: string) => {
  if (name?.trim()) return name;
  if (email?.includes("@")) return email.split("@")[0];
  return "Alguém";
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim() || "";
    const userId = searchParams.get("userId")?.trim() || "";

    if (!email) {
      return NextResponse.json({ activities: [] });
    }

    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    supabaseUrl = supabaseUrl.replace(/^"|"$/g, "").replace(/\/rest\/v1\/?$/, "").trim();
    supabaseKey = supabaseKey.replace(/^"|"$/g, "").trim();

    const supabase = createClient(supabaseUrl, supabaseKey);

    const photosResult = await supabase
      .from("photos")
      .select("id,url,guest_name,guest_email,user_id")
      .or(`user_id.eq.${userId || email},guest_email.eq.${email}`);
    let photos = photosResult.data as PhotoRow[] | null;
    let photosError = photosResult.error;

    if (photosError) {
      const fallback = await supabase
        .from("photos")
        .select("id,url,guest_name")
        .eq("guest_name", email);
      photos = fallback.data as PhotoRow[] | null;
      photosError = fallback.error;
    }

    if (photosError) throw photosError;
    if (!photos?.length) return NextResponse.json({ activities: [] });

    const ownedPhotos = photos as PhotoRow[];
    const photoIds = ownedPhotos.map((photo) => photo.id);
    const photoById = new Map(ownedPhotos.map((photo) => [photo.id, photo]));

    const likesResult = await supabase
      .from("likes")
      .select("id,photo_id,guest_email,user_id,created_at")
      .in("photo_id", photoIds)
      .order("created_at", { ascending: false });
    let likes = likesResult.data as LikeRow[] | null;
    let likesError = likesResult.error;

    if (likesError) {
      const fallback = await supabase
        .from("likes")
        .select("id,photo_id,guest_email,created_at")
        .in("photo_id", photoIds)
        .order("created_at", { ascending: false });
      likes = fallback.data as LikeRow[] | null;
      likesError = fallback.error;
    }

    if (likesError) throw likesError;

    const commentsResult = await supabase
      .from("comments")
      .select("id,photo_id,guest_name,guest_email,guest_image,user_id,text,created_at")
      .in("photo_id", photoIds)
      .order("created_at", { ascending: false });
    let comments = commentsResult.data as CommentRow[] | null;
    let commentsError = commentsResult.error;

    if (commentsError) {
      const fallback = await supabase
        .from("comments")
        .select("id,photo_id,guest_name,guest_email,guest_image,text,created_at")
        .in("photo_id", photoIds)
        .order("created_at", { ascending: false });
      comments = fallback.data as CommentRow[] | null;
      commentsError = fallback.error;
    }

    if (commentsError) throw commentsError;

    const isOwnerAction = (actorUserId?: string, actorEmail?: string) => {
      return Boolean(
        (userId && actorUserId && actorUserId === userId) ||
        (actorEmail && actorEmail.toLowerCase() === email.toLowerCase())
      );
    };

    const likeActivities = (likes || [])
      .filter((like) => !isOwnerAction(like.user_id, like.guest_email))
      .map((like) => {
        const photo = photoById.get(like.photo_id);
        return {
          id: `like-${like.id}`,
          type: "like" as const,
          photo_id: like.photo_id,
          photo_url: photo?.url || "",
          actor_name: getDisplayName(undefined, like.guest_email),
          actor_email: like.guest_email,
          created_at: like.created_at,
        };
      });

    const commentActivities = (comments || [])
      .filter((comment) => !isOwnerAction(comment.user_id, comment.guest_email))
      .map((comment) => {
        const photo = photoById.get(comment.photo_id);
        return {
          id: `comment-${comment.id}`,
          type: "comment" as const,
          photo_id: comment.photo_id,
          photo_url: photo?.url || "",
          actor_name: getDisplayName(comment.guest_name, comment.guest_email),
          actor_email: comment.guest_email,
          actor_image: comment.guest_image,
          text: comment.text,
          created_at: comment.created_at,
        };
      });

    const activities = [...likeActivities, ...commentActivities]
      .filter((activity) => activity.photo_url)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30);

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: error.message || "Erro ao buscar notificações" }, { status: 500 });
  }
}
