
CREATE TABLE public.contact_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  email TEXT,
  respondido BOOLEAN NOT NULL DEFAULT false,
  respondido_em TIMESTAMP WITH TIME ZONE,
  respondido_por UUID,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa (anon e authenticated) pode criar lead
CREATE POLICY "anyone_can_insert_lead"
ON public.contact_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(nome) BETWEEN 1 AND 200
  AND length(whatsapp) BETWEEN 5 AND 30
  AND length(mensagem) BETWEEN 1 AND 2000
);

-- Apenas admins podem ler
CREATE POLICY "admin_select_leads"
ON public.contact_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem atualizar (marcar como respondido)
CREATE POLICY "admin_update_leads"
ON public.contact_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Apenas admins podem excluir
CREATE POLICY "admin_delete_leads"
ON public.contact_leads
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_contact_leads_created ON public.contact_leads(created_at DESC);
CREATE INDEX idx_contact_leads_respondido ON public.contact_leads(respondido, created_at DESC);
