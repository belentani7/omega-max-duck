import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { readContactPayload } from "@/lib/contactForm";
import { ArrowRight, Disc3, LockKeyhole, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const studioAreas = [
  { icon: RadioTower, title: "Producción musical", copy: "Proyectos con etapas visibles, versiones y entregas autorizadas." },
  { icon: LockKeyhole, title: "Portal privado", copy: "Cada cliente ve únicamente sus proyectos y materiales aprobados." },
  { icon: ShieldCheck, title: "Control de operación", copy: "Automatizaciones auditables y cobros siempre bajo aprobación explícita." },
];

const services = [
  { number: "01", title: "Producción y dirección", copy: "Desarrollo de identidad, estructura y dirección de la producción." },
  { number: "02", title: "Mezcla y revisión", copy: "Rondas de revisión con versiones, comentarios temporales y estados visibles." },
  { number: "03", title: "Entrega organizada", copy: "Archivos y entregables autorizados desde un portal privado." },
];

export default function Home() {
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const contact = trpc.public.contact.useMutation({
    onSuccess: () => {
      formRef.current?.reset();
      setFormError(null);
      setFormSuccess(true);
      toast.success("Mensaje registrado correctamente.");
    },
    onError: error => {
      const message = error.message || "No se pudo enviar el mensaje. Inténtalo de nuevo.";
      setFormSuccess(false);
      setFormError(message);
      toast.error(message);
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (contact.isPending) return;
    setFormError(null);
    setFormSuccess(false);
    contact.mutate(readContactPayload(new FormData(event.currentTarget)));
    // Do not clear a user's message until the server confirms it was saved.
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#17110f] text-[#fff7ec]">
      <div className="pointer-events-none fixed inset-0 grain opacity-30" />
      <div className="glow-orb pointer-events-none fixed left-[-10rem] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[#c65332]" />
      <main className="relative">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
          <Link href="/" className="text-xs font-extrabold tracking-[0.22em]">DUCK / Ω-MAX</Link>
          <div className="flex items-center gap-4">
            <a className="hidden text-sm text-[#ead8c8] transition hover:text-white sm:block" href="#contacto">Contacto</a>
            <Button asChild size="sm" className="rounded-full bg-[#e69763] text-[#2a1610] hover:bg-[#f1ad81]"><Link href="/studio">Portal</Link></Button>
          </div>
        </nav>

        <section className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1.35fr_.65fr] lg:px-8">
          <div>
            <p className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.19em] text-[#e69763]"><Sparkles className="h-4 w-4" /> PRODUCCIÓN / DIRECCIÓN SONORA / STUDIO OS</p>
            <h1 className="display-face max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">El sonido necesita un <span className="text-[#e69763]">sistema.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#d8c5b5]">Duck convierte intención, voz y dirección artística en procesos de producción claros: proyecto, revisión, entrega y relación directa con cada cliente.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-[#e69763] px-6 text-[#29150f] hover:bg-[#f1ad81]"><a href="#contacto">Iniciar una conversación <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-[#765547] bg-transparent px-6 text-[#fff7ec] hover:bg-[#2b1d18] hover:text-white"><Link href="/studio">Acceso al portal</Link></Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-[2rem] border border-[#7f5849] bg-[#251814]/85 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between"><p className="text-xs tracking-[0.18em] text-[#e69763]">STUDIO SIGNAL</p><Disc3 className="h-5 w-5 text-[#e69763]" /></div>
              <div className="my-10 grid grid-cols-12 items-end gap-1">{[36, 65, 42, 80, 58, 94, 45, 73, 38, 87, 54, 66].map((height, index) => <span key={index} className="rounded-full bg-gradient-to-t from-[#8e2e21] to-[#e69763]" style={{ height: `${height}px` }} />)}</div>
              <div className="border-t border-[#725044] pt-4"><p className="text-lg font-semibold">Producción con trazabilidad.</p><p className="mt-1 text-sm leading-6 text-[#cbb5a5]">Un portal protegido para archivos, revisiones, comentarios y entregables autorizados.</p></div>
            </div>
            <p className="mt-4 text-center text-xs text-[#a98e7e]">Solo datos y relaciones vinculadas a Duck/Lucas.</p>
          </div>
        </section>

        <section className="border-y border-[#563c33] bg-[#1d1411]/80"><div className="mx-auto grid max-w-7xl gap-px bg-[#563c33] md:grid-cols-3">{studioAreas.map(item => <div className="bg-[#1d1411] p-8" key={item.title}><item.icon className="mb-5 h-5 w-5 text-[#e69763]" /><h2 className="text-xl font-semibold">{item.title}</h2><p className="mt-3 text-sm leading-6 text-[#cbb5a5]">{item.copy}</p></div>)}</div></section>

        <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.19em] text-[#e69763]">SERVICIOS</p><h2 className="display-face mt-4 text-5xl font-semibold leading-none">Un proceso para cada decisión sonora.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{services.map(service => <div className="rounded-2xl border border-[#563c33] bg-[#211613] p-6" key={service.number}><p className="text-xs font-bold text-[#e69763]">{service.number}</p><h3 className="mt-6 text-xl font-semibold">{service.title}</h3><p className="mt-3 text-sm leading-6 text-[#cbb5a5]">{service.copy}</p></div>)}</div></section>


        <section id="contacto" className="mx-auto grid max-w-7xl gap-10 px-5 py-24 lg:grid-cols-[.9fr_1.1fr] lg:px-8"><div><p className="text-xs font-bold tracking-[0.19em] text-[#e69763]">CONTACTO DIRECTO</p><h2 className="display-face mt-4 text-5xl font-semibold leading-none">Hablemos de la siguiente producción.</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#cbb5a5]">Comparte el objetivo, formato y momento del proyecto. El mensaje se registra únicamente en el sistema de Duck.</p></div><Card className="border-[#6a483c] bg-[#251814] text-[#fff7ec]"><CardContent className="p-6 sm:p-8"><form ref={formRef} className="grid gap-4" onSubmit={submit} onInput={() => setFormSuccess(false)} aria-label="Solicitud de contacto" aria-busy={contact.isPending}>
  <div className="grid gap-1.5">
    <label htmlFor="duck-contact-name" className="text-sm font-medium">Nombre</label>
    <Input id="duck-contact-name" className="border-[#6a483c] bg-[#1a110e] text-white placeholder:text-[#927365]" name="name" autoComplete="name" placeholder="Tu nombre" minLength={2} maxLength={180} required disabled={contact.isPending} />
  </div>
  <div className="grid gap-1.5">
    <label htmlFor="duck-contact-email" className="text-sm font-medium">Correo electrónico</label>
    <Input id="duck-contact-email" className="border-[#6a483c] bg-[#1a110e] text-white placeholder:text-[#927365]" name="email" autoComplete="email" type="email" placeholder="Email" required disabled={contact.isPending} />
  </div>
  <div className="grid gap-1.5">
    <label htmlFor="duck-contact-service" className="text-sm font-medium">Servicio (opcional)</label>
    <Input id="duck-contact-service" className="border-[#6a483c] bg-[#1a110e] text-white placeholder:text-[#927365]" name="service" maxLength={120} placeholder="Servicio o tipo de proyecto" disabled={contact.isPending} />
  </div>
  <div className="grid gap-1.5">
    <label htmlFor="duck-contact-message" className="text-sm font-medium">Mensaje</label>
    <Textarea id="duck-contact-message" className="min-h-32 border-[#6a483c] bg-[#1a110e] text-white placeholder:text-[#927365]" name="message" placeholder="Cuéntale a Duck qué necesitas." minLength={10} maxLength={5000} required disabled={contact.isPending} />
  </div>
  {formError ? <p className="rounded-lg border border-red-400/40 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{formError}</p> : null}
  {formSuccess ? <p className="rounded-lg border border-green-400/40 bg-green-950/30 p-3 text-sm text-green-100" role="status">Tu mensaje se ha registrado correctamente.</p> : null}
  <Button type="submit" disabled={contact.isPending} className="rounded-full bg-[#e69763] text-[#2a1610] hover:bg-[#f1ad81]">{contact.isPending ? "Enviando…" : "Enviar mensaje"}</Button>
</form></CardContent></Card></section>
      </main>
    </div>
  );
}
