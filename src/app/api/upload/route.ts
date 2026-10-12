import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';
    
    // Remove possíveis aspas duplicadas e o /rest/v1 que o usuário pode ter colocado
    supabaseUrl = supabaseUrl.replace(/^"|"$/g, '').replace(/\/rest\/v1\/?$/, '').trim();
    supabaseKey = supabaseKey.replace(/^"|"$/g, '').trim();

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const fileType = searchParams.get('fileType') || 'application/octet-stream';
    const guestName = searchParams.get('guestName') || 'Anonimo';
    const guestEmail = searchParams.get('guestEmail') || '';
    const userId = searchParams.get('userId') || guestEmail;

    if (!filename || !request.body) {
      return NextResponse.json({ error: 'Faltando arquivo ou nome' }, { status: 400 });
    }

    // Gerar um nome único e sanitizado
    const timestamp = new Date().getTime();
    const extension = filename.split('.').pop();
    // Remove caracteres especiais, acentos e espaços do nome original
    const sanitizedOriginalName = filename
      .split('.')[0]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_");
    
    const sanitizedGuestName = guestName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "_");

    const uniqueFilename = `${timestamp}-${sanitizedGuestName}-${sanitizedOriginalName}.${extension}`;

    // Upload para o Supabase Storage (Bucket 'wedding-photos')
    const { data: storageData, error: storageError } = await supabase.storage
      .from('wedding-photos')
      .upload(uniqueFilename, request.body, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: false,
        duplex: 'half' // Necessário no Next.js App Router para Streams
      });

    if (storageError) {
      throw storageError;
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(uniqueFilename);

    const publicUrl = publicUrlData.publicUrl;

    const guestImage = searchParams.get('guestImage') || '';
    const mediaType = fileType.startsWith('video/') ? 'video' : 'image';

    // Salvar no banco de dados
    let { error: dbError } = await supabase
      .from('photos')
      .insert([
        { url: publicUrl, guest_name: guestName, guest_email: guestEmail, guest_image: guestImage, user_id: userId, media_type: mediaType }
      ]);

    if (dbError) {
      const fallback = await supabase
        .from('photos')
        .insert([
          { url: publicUrl, guest_name: guestName, guest_image: guestImage, media_type: mediaType }
        ]);
      dbError = fallback.error;
    }

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Erro detalhado no upload para o Supabase:", error);
    return NextResponse.json(
      { error: "Erro interno: " + (error.message || JSON.stringify(error) || "Desconhecido") },
      { status: 500 }
    );
  }
}
