import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `Eres un experto en letras de canciones cristianas y gospel en español e inglés.

El usuario te pedirá la letra de una canción. Si conoces la letra REAL de esa canción, devuélvela completa y exacta.

REGLAS:
- Devuelve la letra REAL de la canción tal como es, con sus versos, coros y puentes.
- Usa saltos de línea simples entre versos y líneas vacías entre secciones (verso, coro, puente, etc.).
- NO inventes letras. Si no conoces la letra exacta de la canción, responde EXACTAMENTE: "NO_ENCONTRADA"
- NO agregues encabezados como [Verso 1], [Coro], etc. Solo la letra pura.
- Si la canción es en inglés, devuelve la letra en inglés.
- Si la canción es en español, devuelve la letra en español.`;

export async function POST(request: NextRequest) {
  try {
    const { titulo, artista } = await request.json();

    if (!titulo) {
      return NextResponse.json({ error: 'Se requiere un título' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'tu-api-key-aqui') {
      return NextResponse.json({
        letras: 'No se pudo buscar la letra: API key no configurada.',
        encontrada: false,
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Dame la letra completa de la canción "${titulo}" de ${artista || 'artista desconocido'}.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Error de Claude API al buscar letra:', response.status, errBody);
      return NextResponse.json({
        letras: 'Error al buscar la letra. Intenta de nuevo.',
        encontrada: false,
      });
    }

    const data = await response.json();
    const text: string = data.content[0].text.trim();

    if (text === 'NO_ENCONTRADA' || text.includes('NO_ENCONTRADA')) {
      return NextResponse.json({
        letras: `No se encontró la letra de "${titulo}" por ${artista || 'artista desconocido'}.`,
        encontrada: false,
      });
    }

    return NextResponse.json({
      letras: text,
      encontrada: true,
    });
  } catch (error) {
    console.error('Error en /api/letras:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
