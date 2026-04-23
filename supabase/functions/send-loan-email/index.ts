import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/microsoft_outlook'

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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

type LoanEmailKind = 'novo_emprestimo' | 'solicitacao_devolucao' | 'devolucao_confirmada'

interface Payload {
  kind: LoanEmailKind
  recipientEmail: string
  birdName?: string
  birdCode?: string
  ownerName?: string
  borrowerName?: string
  prazo?: string
}

function buildContent(p: Payload) {
  const SITE_URL = 'https://plantelpro.lovable.app'
  const titles: Record<LoanEmailKind, string> = {
    novo_emprestimo: '🤝 Você recebeu uma ave por empréstimo',
    solicitacao_devolucao: '📩 Pedido de devolução de ave',
    devolucao_confirmada: '✅ Devolução confirmada',
  }
  const safeOwner = esc(p.ownerName || 'Um criador')
  const safeBorrower = esc(p.borrowerName || 'O recebedor')
  const safeOwner2 = esc(p.ownerName || 'O dono da ave')
  const subtitle: Record<LoanEmailKind, string> = {
    novo_emprestimo: `${safeOwner} emprestou uma ave para você no Meu Plantel Pro. Os filhotes gerados durante o período do empréstimo ficarão registrados no SEU plantel.`,
    solicitacao_devolucao: `${safeOwner2} solicitou a devolução da ave que está em seu plantel.`,
    devolucao_confirmada: `${safeBorrower} confirmou a devolução. A ave voltou ao seu plantel.`,
  }
  const safeBirdName = esc(p.birdName || '—')
  const safeBirdCode = esc(p.birdCode || '—')
  const safePrazo = p.prazo ? esc(p.prazo) : ''
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0B3B2A, #0A0F0D); padding: 24px; border-radius: 12px; color: white;">
        <h1 style="color: #D4AF37; margin: 0 0 16px;">${titles[p.kind]}</h1>
        <p style="color: #ccc; margin: 0 0 20px;">${subtitle[p.kind]}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #999; width: 140px;">Ave:</td><td style="padding: 8px 0; color: #fff; font-weight: bold;">${safeBirdName}</td></tr>
          <tr><td style="padding: 8px 0; color: #999;">Anilha:</td><td style="padding: 8px 0; color: #D4AF37; font-family: monospace;">${safeBirdCode}</td></tr>
          ${safePrazo ? `<tr><td style="padding: 8px 0; color: #999;">Prazo previsto:</td><td style="padding: 8px 0; color: #fff;">${safePrazo}</td></tr>` : ''}
        </table>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 20px 0;" />
        <div style="text-align: center; margin: 20px 0;">
          <a href="${SITE_URL}/emprestimos" style="display: inline-block; background: linear-gradient(135deg, #D4AF37, #B8962E); color: #0A0F0D; font-weight: bold; padding: 12px 32px; border-radius: 8px; text-decoration: none;">Abrir Empréstimos</a>
        </div>
      </div>
      <p style="color: #666; font-size: 11px; text-align: center; margin-top: 16px;">E-mail automático do Meu Plantel Pro.</p>
    </div>
  `
  return { subject: `${titles[p.kind]} — ${esc(p.birdName || p.birdCode || '')}`, html }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Require authenticated caller
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')
    const MICROSOFT_OUTLOOK_API_KEY = Deno.env.get('MICROSOFT_OUTLOOK_API_KEY')
    if (!MICROSOFT_OUTLOOK_API_KEY) throw new Error('MICROSOFT_OUTLOOK_API_KEY is not configured')

    const payload = await req.json() as Payload
    if (!payload.recipientEmail || !payload.kind) {
      return new Response(JSON.stringify({ error: 'recipientEmail and kind required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { subject, html } = buildContent(payload)

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
          toRecipients: [{ emailAddress: { address: payload.recipientEmail } }],
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
    console.error('send-loan-email error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
