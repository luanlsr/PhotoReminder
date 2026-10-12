import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    
    // Remove possíveis aspas duplicadas e o /rest/v1 que o usuário pode ter colocado
    supabaseUrl = supabaseUrl.replace(/^"|"$/g, '').replace(/\/rest\/v1\/?$/, '').trim();
    supabaseKey = supabaseKey.replace(/^"|"$/g, '').trim();

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar fotos com curtidas e comentários. The fallback keeps production
    // working if the identity migration has not reached Supabase yet.
    let { data: photos, error } = await supabase
      .from('photos')
      .select(`
        *,
        likes:likes(guest_email, user_id),
        comments:comments(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      const fallback = await supabase
        .from('photos')
        .select(`
          *,
          likes:likes(guest_email),
          comments:comments(*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      photos = fallback.data;
      error = fallback.error;
    }

    if (error || !photos) {
      throw error;
    }

    // Formatando para o formato que o frontend espera
    const formattedPhotos = photos.map((photo: any) => ({
      id: photo.id,
      name: photo.guest_name,
      user_id: photo.user_id,
      guest_email: photo.guest_email,
      guest_image: photo.guest_image,
      url: photo.url,
      media_type: photo.media_type || 'image',
      createdAt: photo.created_at,
      likes: photo.likes || [],
      comments: photo.comments || []
    }));

    return NextResponse.json({ photos: formattedPhotos });
  } catch (error) {
    console.error("Erro ao buscar galeria no Supabase:", error);
    return NextResponse.json({ error: "Erro ao buscar galeria" }, { status: 500 });
  }
}
