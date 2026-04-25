import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const SITE_URL = 'https://meuplantelpro.com.br'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')?.trim()

    if (!slug) {
      return new Response('Missing slug', { status: 400, headers: corsHeaders })
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    const ua = (req.headers.get('user-agent') || '').slice(0, 500)
    const referrer = (req.headers.get('referer') || '').slice(0, 500)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || ''

    const { data, error } = await supabase.rpc('increment_link_click', {
      _slug: slug,
      _ip: ip,
      _user_agent: ua,
      _referrer: referrer,
    })

    if (error) {
      console.error('increment_link_click error:', error)
      return Response.redirect(SITE_URL, 302)
    }

    const result = data as { found: boolean; destino?: string }
    if (!result?.found) {
      return Response.redirect(SITE_URL, 302)
    }

    let destino = result.destino || '/'
    // Se destino é caminho relativo, prepend SITE_URL
    if (destino.startsWith('/')) destino = SITE_URL + destino

    return Response.redirect(destino, 302)
  } catch (e) {
    console.error('track-link-click error:', e)
    return Response.redirect(SITE_URL, 302)
  }
})
