import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Payload {
  path: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  device_type?: string
  session_id?: string
  user_id?: string | null
}

function clip(s: unknown, max = 500): string | null {
  if (s === undefined || s === null) return null
  const str = String(s)
  return str.length > max ? str.slice(0, max) : str
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const body = (await req.json()) as Payload
    if (!body.path || typeof body.path !== 'string') {
      return new Response(JSON.stringify({ error: 'path required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const ua = req.headers.get('user-agent') || ''

    const { error } = await supabase.from('page_views').insert({
      path: clip(body.path, 500)!,
      referrer: clip(body.referrer, 500),
      utm_source: clip(body.utm_source, 100),
      utm_medium: clip(body.utm_medium, 100),
      utm_campaign: clip(body.utm_campaign, 100),
      user_agent: clip(ua, 500),
      device_type: clip(body.device_type, 20),
      session_id: clip(body.session_id, 64),
      user_id: body.user_id || null,
    })

    if (error) {
      console.error('track-pageview insert error:', error)
      return new Response(JSON.stringify({ ok: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('track-pageview error:', e)
    return new Response(JSON.stringify({ ok: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
