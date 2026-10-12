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
    const { photo_id, user_id, guest_name, guest_email, guest_image, text } = body;

    if (!photo_id || !guest_name || !text) {
      return NextResponse.json({ error: "Faltando dados obrigatórios" }, { status: 400 });
    }

    let { data, error } = await supabase
      .from('comments')
      .insert([
        { photo_id, user_id: user_id || guest_email, guest_name, guest_email, guest_image, text }
      ])
      .select()
      .single();

    if (error) {
      const fallback = await supabase
        .from('comments')
        .insert([
          { photo_id, guest_name, guest_email, guest_image, text }
        ])
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return NextResponse.json({ success: true, comment: data });
  } catch (error: any) {
    console.error("Erro ao comentar:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
