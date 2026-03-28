import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

interface CategorizeRequest {
  nomeProduto: string
}

interface CategorizeResponse {
  nome_amigavel: string
  categoria: string
  subcategoria?: string
}

const CATEGORIAS_VALIDAS = [
  'Hortifruti',
  'Açougue',
  'Laticínios',
  'Padaria',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Mercearia',
  'Congelados',
  'Pet',
  'Outros',
]

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nomeProduto } = await req.json() as CategorizeRequest

    if (!nomeProduto) {
      return new Response(
        JSON.stringify({ error: 'Nome do produto é obrigatório' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY não configurada')
      // Retorna categoria padrão se a API key não estiver configurada
      return new Response(
        JSON.stringify({
          nome_amigavel: nomeProduto,
          categoria: 'Outros',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const prompt = `Você é um assistente especializado em categorizar produtos de supermercado brasileiro.

Analise o produto abaixo e retorne APENAS um JSON válido (sem markdown, sem \`\`\`json) com as seguintes informações:
- nome_amigavel: nome limpo e amigável do produto (ex: "Coca-Cola 2L" ao invés de "REFRIG COCA COLA 2LT")
- categoria: uma das categorias abaixo
- subcategoria: (opcional) subcategoria mais específica

Categorias válidas: ${CATEGORIAS_VALIDAS.join(', ')}

Produto para categorizar: "${nomeProduto}"

Responda apenas com o JSON, exemplo:
{"nome_amigavel": "Coca-Cola 2L", "categoria": "Bebidas", "subcategoria": "Refrigerantes"}`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 200,
        },
      }),
    })

    if (!response.ok) {
      console.error('Erro na API do Gemini:', response.status, response.statusText)
      return new Response(
        JSON.stringify({
          nome_amigavel: nomeProduto,
          categoria: 'Outros',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await response.json()
    
    // Extrai o texto da resposta do Gemini
    const textoGerado = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textoGerado) {
      console.error('Resposta vazia do Gemini')
      return new Response(
        JSON.stringify({
          nome_amigavel: nomeProduto,
          categoria: 'Outros',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Tenta parsear o JSON da resposta
    try {
      // Remove possíveis marcadores de markdown
      const jsonLimpo = textoGerado.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      const resultado = JSON.parse(jsonLimpo) as CategorizeResponse

      // Valida se a categoria é válida
      if (!CATEGORIAS_VALIDAS.includes(resultado.categoria)) {
        resultado.categoria = 'Outros'
      }

      return new Response(JSON.stringify(resultado), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (parseError) {
      console.error('Erro ao parsear JSON do Gemini:', parseError, textoGerado)
      return new Response(
        JSON.stringify({
          nome_amigavel: nomeProduto,
          categoria: 'Outros',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})