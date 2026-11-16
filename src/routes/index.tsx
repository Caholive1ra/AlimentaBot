import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Building2,
  ChefHat,
  ClipboardCheck,
  Code2,
  HandHeart,
  Leaf,
  Lock,
  PackageOpen,
  Route as RouteIcon,
  ShieldCheck,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "@/components/brand/Logo";
import hero from "@/assets/hero-alimentos.jpg";
import inst from "@/assets/instituicao-alimentos.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlimentaBot — Excedentes seguros até quem precisa" },
      {
        name: "description",
        content:
          "AlimentaBot liga excedentes seguros de alimentos a pessoas e instituições, com revisão humana e rotas de retirada inteligentes.",
      },
      { property: "og:title", content: "AlimentaBot — Alimento bom não deveria virar desperdício" },
      {
        property: "og:description",
        content:
          "Plataforma FoodTech que conecta doadores, transportadores e instituições com segurança alimentar em primeiro lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const etapas = [
  {
    i: Store,
    t: "Publicar",
    d: "O doador cadastra o excedente com validade, conservação e janela segura de coleta.",
  },
  {
    i: ClipboardCheck,
    t: "Revisão humana",
    d: "Um operador confere as informações antes de qualquer liberação.",
  },
  {
    i: RouteIcon,
    t: "Matching e retirada",
    d: "O sistema sugere transportador e destino compatíveis; a pessoa aceita e coleta.",
  },
  {
    i: HandHeart,
    t: "Recebimento",
    d: "A instituição confere e confirma. Toda a custódia fica registrada.",
  },
];
const publico = [
  {
    i: ChefHat,
    t: "Doadores",
    d: "Mercados, padarias, restaurantes e cozinhas com excedentes seguros.",
  },
  {
    i: Truck,
    t: "Transportadores",
    d: "Voluntários e operadores logísticos com capacidade disponível.",
  },
  {
    i: Building2,
    t: "Instituições",
    d: "Cozinhas comunitárias, abrigos e organizações que distribuem refeições.",
  },
  {
    i: Users,
    t: "Gestores",
    d: "Equipes que revisam lotes e acompanham o ciclo com rastreabilidade.",
  },
];
const faq: [string, string][] = [
  [
    "O AlimentaBot já está em operação?",
    "Não. Este é um MVP acadêmico da FIAP Global Solution 2026. A plataforma usa somente dados sintéticos guardados no seu navegador.",
  ],
  [
    "Quem garante a segurança do alimento?",
    "A plataforma organiza informações e exige revisão humana antes da liberação. Na demonstração, essa revisão é hipotética e não substitui avaliação sanitária real.",
  ],
  [
    "A IA decide para onde vai a comida?",
    "Não. O matching apenas sugere combinações que passam por bloqueios de validade, conservação, capacidade e janela. Pessoas aceitam ou recusam.",
  ],
  [
    "E os robôs e smart lockers?",
    "São visão futura, condicionada a licenças, regulamentação e validações de segurança. Não fazem parte do MVP.",
  ],
  [
    "Existe pagamento ou recompensa por entrega?",
    "Não. O MVP não implementa pagamentos, recompensas ou patrocínios.",
  ],
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Logo tone="light" />
          <nav
            className="hidden items-center gap-7 text-sm text-primary-foreground/80 md:flex"
            aria-label="Seções"
          >
            <a href="#como-funciona" className="hover:text-primary-foreground">
              Como funciona
            </a>
            <a href="#publico" className="hover:text-primary-foreground">
              Para quem
            </a>
            <a href="#tecnologia" className="hover:text-primary-foreground">
              Tecnologia
            </a>
            <a href="#duvidas" className="hover:text-primary-foreground">
              Dúvidas
            </a>
          </nav>
          <Button asChild variant="lime" size="sm">
            <Link to="/app">Acessar plataforma</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-32 md:px-8 lg:grid-cols-2 lg:pb-28 lg:pt-40">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-3 py-1 text-xs font-medium text-accent">
              <Leaf className="h-3.5 w-3.5" /> FoodTech de redistribuição segura
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] md:text-6xl">
              Alimento bom não deveria virar <span className="text-accent">desperdício.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-primary-foreground/80">
              O AlimentaBot liga excedentes seguros de quem produz e vende alimentos a pessoas e
              instituições que precisam — com revisão humana, rastreabilidade e rotas de retirada
              mais eficientes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="lime" size="lg">
                <Link to="/app">
                  Acessar plataforma <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <a href="#como-funciona">Como funciona</a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="blob absolute -inset-4 bg-accent/25" aria-hidden />
            <img
              src={hero}
              alt="Caixas com pães, frutas, verduras e um bowl de refeição"
              width={1280}
              height={1024}
              className="blob relative aspect-[5/4] w-full object-cover shadow-lift"
            />
            <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl bg-card p-3 pr-5 text-card-foreground shadow-lift">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/30 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">Revisão humana</p>
                <p className="text-xs text-muted-foreground">antes de cada liberação</p>
              </div>
            </div>
          </div>
        </div>
        <svg
          viewBox="0 0 1440 80"
          className="block w-full fill-background"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 80 C 360 0 1080 0 1440 80 Z" />
        </svg>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-success">
              Problema e oportunidade
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Excedente seguro existe. O que falta é conexão confiável.
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Alimentos próprios para consumo são descartados todos os dias porque doar exige tempo,
              coordenação e confiança: quem pode buscar? Para onde levar? Ainda está dentro da
              validade e conservado corretamente?
            </p>
            <p>
              A oportunidade está em organizar essas informações num fluxo simples, com regras
              claras e uma pessoa responsável revisando cada lote antes de ele seguir viagem.
            </p>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-10 bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-success">
            Como funciona
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold md:text-4xl">
            Quatro etapas, do excedente ao prato.
          </h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-4">
            {etapas.map((e, idx) => (
              <li key={e.t} className="relative rounded-3xl border bg-card p-6 shadow-soft">
                <span className="font-display text-5xl font-extrabold text-accent/60">
                  0{idx + 1}
                </span>
                <e.i className="mt-3 h-6 w-6 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">{e.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{e.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="publico" className="scroll-mt-10 mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={inst}
            alt="Mãos organizando caixas com alimentos frescos"
            width={1280}
            height={896}
            loading="lazy"
            className="aspect-[4/3] w-full rounded-[2.5rem] rounded-tr-[6rem] object-cover shadow-lift"
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-success">Para quem</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Um painel para cada papel da cadeia.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {publico.map((p) => (
                <div key={p.t} className="rounded-2xl border bg-card p-5">
                  <p.i className="h-5 w-5 text-success" />
                  <p className="mt-2 font-semibold">{p.t}</p>
                  <p className="text-sm text-muted-foreground">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Valor proposto
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold md:text-4xl">
            Menos desperdício, mais confiança em cada doação.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              [
                "Segurança primeiro",
                "Validade, conservação, capacidade e janela bloqueiam sugestões inadequadas antes de chegarem a alguém.",
              ],
              [
                "Rastreabilidade",
                "Cada etapa gera um registro de custódia: quem publicou, revisou, coletou e recebeu.",
              ],
              [
                "Menos esforço operacional",
                "Sugestões de matching reduzem ligações e planilhas para encontrar quem busca e quem recebe.",
              ],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-6"
              >
                <h3 className="text-lg font-semibold text-accent">{t}</h3>
                <p className="mt-2 text-sm text-primary-foreground/75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tecnologia" className="scroll-mt-10 mx-auto max-w-7xl px-5 py-20 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-success">Tecnologia</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold md:text-4xl">
          Hoje um MVP de interface. Amanhã, uma plataforma integrada.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              i: Code2,
              t: "MVP atual",
              d: "Front-end React + TypeScript com regras de negócio e dados sintéticos no navegador.",
            },
            {
              i: PackageOpen,
              t: "Próximo passo",
              d: "API REST planejada em Python/FastAPI com PostgreSQL, ainda a ser desenvolvida.",
            },
            {
              i: Bot,
              t: "Visão futura",
              d: "Robôs de entrega e smart lockers, somente se houver licenças, regulamentação e segurança validadas.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border bg-card p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-accent">
                <c.i className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="duvidas" className="scroll-mt-10 bg-secondary/60 py-20">
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <h2 className="text-center text-3xl font-bold md:text-4xl">Dúvidas frequentes</h2>
          <Accordion type="single" collapsible className="mt-8 rounded-3xl border bg-card px-6">
            {faq.map(([q, a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger className="text-left font-semibold">{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-hero px-8 py-14 text-center text-primary-foreground md:px-16">
          <Lock className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold md:text-4xl">
            Veja o fluxo completo em 3 minutos.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/75">
            Sem login. Dados sintéticos só no seu navegador, reiniciáveis a qualquer momento.
          </p>
          <Button asChild variant="lime" size="lg" className="mt-8">
            <Link to="/app">
              Acessar plataforma <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3 md:px-8">
          <div>
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground">
              Projeto acadêmico — FIAP Global Solution 2026.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Equipe</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Carolina Feitosa — RM 563049</li>
              <li>Guilherme Machado — RM 564658</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground md:text-right">
            Demonstração com dados sintéticos. Sem parceiros, clientes ou resultados operacionais
            reais.
          </p>
        </div>
      </footer>
    </div>
  );
}
