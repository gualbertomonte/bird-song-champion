import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function FaleConoscoModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  const reset = () => {
    setNome("");
    setWhatsapp("");
    setEmail("");
    setMensagem("");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !whatsapp.trim() || !mensagem.trim()) {
      toast.error("Preencha nome, WhatsApp e mensagem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_leads").insert({
        nome: nome.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim() || null,
        mensagem: mensagem.trim(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      });
      if (error) throw error;

      toast.success("Mensagem enviada! Entraremos em contato em breve.");
      reset();
      setOpen(false);
    } catch (err: any) {
      console.error("[FaleConosco] insert error", err);
      toast.error("Não foi possível enviar. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Fale conosco"
          className="fixed bottom-6 right-6 z-50 group"
        >
          <span className="absolute inset-0 rounded-full bg-secondary/40 animate-ping" />
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-[0_10px_30px_-8px_hsl(var(--secondary)/0.6)] hover:bg-secondary hover:scale-105 active:scale-95 transition-all">
            <MessageCircle className="w-6 h-6" fill="currentColor" strokeWidth={0} />
          </span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-foreground text-secondary-foreground text-xs font-medium px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Fale conosco
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fale conosco</DialogTitle>
          <DialogDescription>
            Deixe seus dados que entraremos em contato em breve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fc-nome">Nome *</Label>
            <Input
              id="fc-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-whatsapp">WhatsApp *</Label>
            <Input
              id="fc-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              maxLength={30}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-email">E-mail (opcional)</Label>
            <Input
              id="fc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fc-mensagem">Mensagem *</Label>
            <Textarea
              id="fc-mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Como podemos te ajudar?"
              rows={4}
              maxLength={2000}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar mensagem
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
