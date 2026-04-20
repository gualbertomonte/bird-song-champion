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
      await response.text()
      await new Promise(r => setTimeout(r, delay))
      continue
    }
    return response
  }
  throw new Error('Max retries exceeded')
}

interface Payload {
  newUserEmail: string
  newUserName?: string
  signupAt?: string
  totalUsers?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')
    const MICROSOFT_OUTLOOK_API_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY')
    if (!MICROSOFT_OUTLOOK_API_KEY) throw new Error('MICROSOFT_OUTLOOK_API_KEY is not configured')
    const ADMIN_NOTIFY_EMAIL = Deno.env.get('ADMIN_NOTIFY_EMAIL')
    if (!ADMIN_NOTIFY_EMAIL) throw new Error('ADMIN_NOTIFY_EMAIL is not configured')

    const payload = await req.json() as Payload
    if (!payload.newUserEmail) {
      return new Response(JSON.stringify({ error: 'newUserEmail required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const SITE_URL = 'https://plantelpro.lovable.app'
    const when = payload.signupAt
      ? new Date(payload.signupAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const subject = `🎉 Novo usuário no MeuPlantelPro: ${payload.newUserName || payload.newUserEmail}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0B3B2A, #0A0F0D); padding: 24px; border-radius: 12px; color: white;">
          <h1 style="color: #D4AF37; margin: 0 0 16px;">🎉 Novo cadastro no MeuPlantelPro</h1>
          <p style="color: #ccc; margin: 0 0 20px;">Um novo criador acaba de se inscrever no sistema.</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #999; width: 140px;">Nome:</td><td style="padding: 8px 0; color: #fff; font-weight: bold;">${payload.newUserName || '—'}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">E-mail:</td><td style="padding: 8px 0; color: #D4AF37; font-family: monospace;">${payload.newUserEmail}</td></tr>
            <tr><td style="padding: 8px 0; color: #999;">Quando:</td><td style="padding: 8px 0; color: #fff;">${when}</td></tr>
            ${payload.totalUsers ? `<tr><td style="padding: 8px 0; color: #999;">Total de usuários:</td><td style="padding: 8px 0; color: #fff; font-weight: bold;">${payload.totalUsers}</td></tr>` : ''}
          </table>
          <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
          <div style="text-align: center; margin: 20px 0;">
            <a href="${SITE_URL}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37, #B8962E); color: #0A0F0D; font-weight: bold; padding: 12px 32px; border-radius: 8px; text-decoration: none;">Abrir MeuPlantelPro</a>
          </div>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 16px;">Notificação automática do MeuPlantelPro.</p>
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
          subject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: ADMIN_NOTIFY_EMAIL } }],
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Outlook API failed [${response.status}]: ${errorData}`)
    }
    await response.text()

    return new Response(JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: unknown) {
    console.error('notify-admin-new-signup error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
