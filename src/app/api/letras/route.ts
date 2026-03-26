import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Eres un experto en letras de canciones cristianas y gospel en español e inglés.

El usuario te pedirá la letra de una canción. Si conoces la letra REAL de esa canción, devuélvela completa y exacta.

REGLAS:
- Devuelve la letra REAL de la canción tal como es, con sus versos, coros y puentes.
- Usa saltos de línea simples entre versos y líneas vacías entre secciones (verso, coro, puente, etc.).
- NO inventes letras. Si no conoces la letra exacta de la canción, responde EXACTAMENTE con la palabra: NO_ENCONTRADA
- NO agregues encabezados como [Verso 1], [Coro], etc. Solo la letra pura.
- Si la canción es en inglés, devuelve la letra en inglés.
- Si la canción es en español, devuelve la letra en español.
- NO incluyas notas, explicaciones ni aclaraciones. SOLO la letra o NO_ENCONTRADA.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, artista } = body;

    console.log('[API Letras] Request received:', { titulo, artista });

    if (!titulo) {
      return NextResponse.json({ error: 'Se requiere un titulo' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[API Letras] API key present:', !!apiKey);

    if (!apiKey || apiKey === 'tu-api-key-aqui') {
      return NextResponse.json({
        letras: 'API key no configurada. No se puede buscar la letra.',
        encontrada: false,
      });
    }

    const userMessage = `Dame la letra completa de la cancion "${titulo}" de ${artista || 'artista desconocido'}.`;
    console.log('[API Letras] Calling Claude API...');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    console.log('[API Letras] Claude response status:', response.status);

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[API Letras] Claude API error:', response.status, errBody);
      return NextResponse.json({
        letras: `No se pudo buscar la letra (error ${response.status}).`,
        encontrada: false,
      });
    }

    const data = await response.json();
    const text: string = (data.content?.[0]?.text || '').trim();

    console.log('[API Letras] Response length:', text.length, 'First 100 chars:', text.substring(0, 100));

    if (!text || text === 'NO_ENCONTRADA' || text.includes('NO_ENCONTRADA')) {
      return NextResponse.json({
        letras: `No se encontro la letra de "${titulo}".`,
        encontrada: false,
      });
    }

    return NextResponse.json({
      letras: text,
      encontrada: true,
    });
  } catch (error) {
    console.error('[API Letras] Server error:', error);
    return NextResponse.json(
      { letras: 'Error interno del servidor.', encontrada: false },
      { status: 200 }
    );
  }
}
