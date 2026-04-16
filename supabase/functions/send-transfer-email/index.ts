const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook'

async function sendWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options)
    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10)
      const delay = Math.max(retryAfter * 1000, (attempt + 1) * 2000)
      await response.text() // consume body
      console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
      await new Promise(r => setTimeout(r, delay))
      continue
    }
    return response
  }
  throw new Error('Max retries exceeded')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const MICROSOFT_OUTLOOK_API_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY')
    if (!MICROSOFT_OUTLOOK_API_KEY) throw new Error('MICROSOFT_OUTLOOK_API_KEY is not configured')

    const { recipientEmail, birdName, birdSpecies, birdCode, senderName } = await req.json()

    if (!recipientEmail || !birdCode) {
      return new Response(
        JSON.stringify({ error: 'recipientEmail and birdCode are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0B3B2A, #0A0F0D); padding: 24px; border-radius: 12px; color: white;">
          <h1 style="color: #D4AF37; margin: 0 0 16px;">🐦 Transferência de Ave — Plantel Pro+</h1>
          <p style="color: #ccc; margin: 0 0 20px;">Você recebeu uma transferência de ave. Confira os detalhes abaixo:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #999; width: 140px;">Nome da Ave:</td><td style="padding: 8px 0; color: #fff; font-weight: bold;">${birdName || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Espécie:</td><td style="padding: 8px 0; color: #fff;">${birdSpecies || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Código Anilha:</td><td style="padding: 8px 0; color: #D4AF37; font-family: monospace;">${birdCode}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Transferido por:</td><td style="padding: 8px 0; color: #fff;">${senderName || 'Usuário Plantel Pro+'}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
          <p style="color: #888; font-size: 12px; margin: 0;">Todos os dados da ave (histórico de saúde, torneios, observações) foram transferidos junto. Acesse o Plantel Pro+ para visualizar os detalhes completos.</p>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 16px;">Este é um e-mail automático enviado pelo sistema Plantel Pro+.</p>
      </div>
    `

    const response = await sendWithRetry(`${GATEWAY_URL}/me/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': MICROSOFT_OUTLOOK_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: `🐦 Transferência de Ave: ${birdName || birdCode} — Plantel Pro+`,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: recipientEmail } }],
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Outlook API failed [${response.status}]: ${errorData}`)
    }

    await response.text()

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error sending transfer email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
