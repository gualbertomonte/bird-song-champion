import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, Copy, Trash2, Plus, MousePointerClick, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SITE = 'https://meuplantelpro.com.br';

interface TrackedLink {
  id: string;
  slug: string;
  destino: string;
  descricao: string | null;
  total_clicks: number;
  created_at: string;
}

export default function AdminLinks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [slug, setSlug] = useState('');
  const [destino, setDestino] = useState('/');
  const [descricao, setDescricao] = useState('');

  const { data: links, isLoading } = useQuery({
    queryKey: ['tracked-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracked_links')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TrackedLink[];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      if (!cleanSlug) throw new Error('Slug inválido');
      const { error } = await supabase.from('tracked_links').insert({
        slug: cleanSlug,
        destino: destino.trim() || '/',
        descricao: descricao.trim() || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Link criado!');
      setSlug(''); setDestino('/'); setDescricao('');
      qc.invalidateQueries({ queryKey: ['tracked-links'] });
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao criar link'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tracked_links').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Link removido');
      qc.invalidateQueries({ queryKey: ['tracked-links'] });
    },
  });

  const copyLink = (s: string) => {
    const url = `${SITE}/r/${s}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!', { description: url });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="heading-serif text-xl font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5 text-secondary" />
          Links rastreáveis
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Crie links curtos com tracking de cliques. Compartilhe no WhatsApp, Instagram, etc.
        </p>
      </div>

      {/* Criar novo */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo link
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="slug">Slug (curto)</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="whatsapp" />
            <p className="text-[10px] text-muted-foreground mt-1">
              Ficará: {SITE}/r/<strong>{slug || 'whatsapp'}</strong>
            </p>
          </div>
          <div>
            <Label htmlFor="destino">Destino</Label>
            <Input id="destino" value={destino} onChange={(e) => setDestino(e.target.value)} placeholder="/" />
            <p className="text-[10px] text-muted-foreground mt-1">URL ou caminho (default: /)</p>
          </div>
          <div>
            <Label htmlFor="desc">Descrição (interna)</Label>
            <Input id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="WhatsApp da feira" />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() => createMut.mutate()}
          disabled={!slug.trim() || createMut.isPending}
        >
          Criar link
        </Button>
      </Card>

      {/* Lista */}
      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)
        ) : !links || links.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Nenhum link rastreável criado ainda.
          </Card>
        ) : (
          links.map(link => (
            <Card key={link.id} className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-sm font-mono font-semibold text-foreground">
                    /r/{link.slug}
                  </code>
                  <span className="text-xs text-muted-foreground">→ {link.destino}</span>
                </div>
                {link.descricao && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{link.descricao}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  Criado em {format(new Date(link.created_at), 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="text-center flex-shrink-0">
                <p className="text-2xl heading-serif font-semibold text-secondary">{link.total_clicks}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">cliques</p>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => copyLink(link.slug)}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => window.open(`${SITE}/r/${link.slug}`, '_blank')}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Remover link /r/${link.slug}?`)) deleteMut.mutate(link.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
