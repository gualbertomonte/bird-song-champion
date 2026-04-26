import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Check, Trash2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Lead {
  id: string;
  nome: string;
  whatsapp: string;
  email: string | null;
  mensagem: string;
  respondido: boolean;
  respondido_em: string | null;
  created_at: string;
}

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todos" | "pendentes" | "respondidos">("pendentes");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar mensagens");
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const marcar = async (id: string, respondido: boolean) => {
    const { error } = await supabase
      .from("contact_leads")
      .update({
        respondido,
        respondido_em: respondido ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success(respondido ? "Marcado como respondido" : "Marcado como pendente");
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta mensagem?")) return;
    const { error } = await supabase.from("contact_leads").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Mensagem excluída");
    load();
  };

  const filtered = leads.filter((l) => {
    if (filter === "pendentes") return !l.respondido;
    if (filter === "respondidos") return l.respondido;
    return true;
  });

  const pendentes = leads.filter((l) => !l.respondido).length;

  const whatsappLink = (numero: string, nome: string) => {
    const limpo = numero.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${nome}, recebi sua mensagem no Meu Plantel Pro.`);
    return `https://wa.me/${limpo}?text=${msg}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-secondary" />
            Mensagens "Fale Conosco"
          </h2>
          <p className="text-sm text-muted-foreground">
            {pendentes} pendente{pendentes !== 1 ? "s" : ""} de {leads.length} total
          </p>
        </div>
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl">
          {(["pendentes", "respondidos", "todos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filter === f
                  ? "bg-card text-secondary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-secondary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhuma mensagem {filter !== "todos" ? filter : ""}.
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <Card key={lead.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{lead.nome}</h3>
                    {lead.respondido ? (
                      <Badge variant="secondary" className="text-xs">Respondido</Badge>
                    ) : (
                      <Badge className="text-xs">Pendente</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                    <a
                      href={whatsappLink(lead.whatsapp, lead.nome)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-secondary"
                    >
                      <Phone className="w-3 h-3" /> {lead.whatsapp}
                    </a>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="flex items-center gap-1 hover:text-secondary"
                      >
                        <Mail className="w-3 h-3" /> {lead.email}
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(lead.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </div>

              <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">
                {lead.mensagem}
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => marcar(lead.id, !lead.respondido)}
                >
                  <Check className="w-4 h-4 mr-1" />
                  {lead.respondido ? "Marcar pendente" : "Marcar respondido"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => excluir(lead.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
