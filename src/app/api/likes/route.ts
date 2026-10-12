import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    supabaseUrl = supabaseUrl.replace(/^"|"$/g, '').replace(/\/rest\/v1\/?$/, '').trim();
    supabaseKey = supabaseKey.replace(/^"|"$/g, '').trim();

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { photo_id, guest_email, user_id } = body;
    const userId = user_id || guest_email;

    if (!photo_id || !guest_email) {
      return NextResponse.json({ error: "Faltando dados" }, { status: 400 });
    }

    // Verificar se já curtiu
    let { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('photo_id', photo_id)
      .or(`user_id.eq.${userId},guest_email.eq.${guest_email}`)
      .maybeSingle();

    if (checkError) {
      const fallback = await supabase
        .from('likes')
        .select('id')
        .eq('photo_id', photo_id)
        .eq('guest_email', guest_email)
        .maybeSingle();
      existingLike = fallback.data;
      checkError = fallback.error;
    }

    if (checkError) throw checkError;

    if (existingLike) {
      // Remover curtida
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
      
      if (deleteError) throw deleteError;
      return NextResponse.json({ liked: false });
    } else {
      // Adicionar curtida
      let { error: insertError } = await supabase
        .from('likes')
        .insert([{ photo_id, guest_email, user_id: userId }]);

      if (insertError) {
        const fallback = await supabase
          .from('likes')
          .insert([{ photo_id, guest_email }]);
        insertError = fallback.error;
      }
      
      if (insertError) throw insertError;
      return NextResponse.json({ liked: true });
    }
  } catch (error: any) {
    console.error("Erro ao curtir:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
