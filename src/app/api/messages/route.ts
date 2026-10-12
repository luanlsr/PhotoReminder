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

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    
    // Remove possíveis aspas duplicadas e o /rest/v1 que o usuário pode ter colocado
    supabaseUrl = supabaseUrl.replace(/^"|"$/g, '').replace(/\/rest\/v1\/?$/, '').trim();
    supabaseKey = supabaseKey.replace(/^"|"$/g, '').trim();

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { user_id, guest_name, guest_email, guest_image, message } = body;

    if (!guest_name || !message) {
      return NextResponse.json({ error: "Nome e mensagem são obrigatórios" }, { status: 400 });
    }

    let { error } = await supabase
      .from('messages')
      .insert([
        { user_id: user_id || guest_email, guest_name, guest_email, guest_image, message }
      ]);

    if (error) {
      const fallback = await supabase
        .from('messages')
        .insert([
          { guest_name, guest_email, guest_image, message }
        ]);
      error = fallback.error;
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar mensagem:", error);
    return NextResponse.json({ error: "Erro ao salvar mensagem" }, { status: 500 });
  }
}
