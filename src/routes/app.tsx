import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChartNoAxesCombined,
  HandHeart,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Truck,
  ArrowLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { DemoChip } from "@/components/app/ui-kit";
import { useDemo } from "@/hooks/use-demo";
import { fmtData } from "@/lib/format";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Plataforma AlimentaBot — Demonstração" },
      {
        name: "description",
        content:
          "MVP demonstrativo do AlimentaBot com dados sintéticos: doador, gestor, transportador e instituição.",
      },
      { property: "og:title", content: "Plataforma AlimentaBot — Demonstração" },
      { property: "og:description", content: "MVP demonstrativo com dados sintéticos locais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppLayout,
});

const nav = [
  { to: "/app", label: "Visão geral", icon: LayoutDashboard },
  { to: "/app/doador", label: "Doador", icon: Store },
  { to: "/app/gestor", label: "Gestor / Operador", icon: ShieldCheck },
  { to: "/app/transportador", label: "Transportador", icon: Truck },
  { to: "/app/instituicao", label: "Instituição", icon: HandHeart },
  { to: "/app/simulador", label: "Simulador de matching", icon: ChartNoAxesCombined },
] as const;

function AppLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname.replace(/\/$/, "") });
  const s = useDemo();
  const atual = nav.find((n) => n.to === path)?.label ?? "Plataforma";
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="px-3 py-4">
            <Link to="/" className="flex items-center" aria-label="Voltar à página inicial">
              <Logo
                tone="light"
                className="group-data-[collapsible=icon]:[&>span:last-child]:hidden"
              />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Ambiente demonstrativo</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map((n) => (
                    <SidebarMenuItem key={n.to}>
                      <SidebarMenuButton asChild isActive={path === n.to} tooltip={n.label}>
                        <Link to={n.to}>
                          <n.icon />
                          <span>{n.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Voltar ao site">
                  <Link to="/">
                    <ArrowLeft />
                    <span>Voltar ao site</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
            <SidebarTrigger aria-label="Abrir ou recolher menu" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-semibold">{atual}</p>
            </div>
            <DemoChip className="hidden sm:inline-flex" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
                  <Bell />
                  {s.notificacoes.length > 0 && (
                    <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {Math.min(s.notificacoes.length, 9)}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <p className="border-b px-4 py-3 text-sm font-semibold">Notificações (simuladas)</p>
                <ul className="max-h-80 divide-y overflow-y-auto">
                  {s.notificacoes.slice(0, 12).map((n) => (
                    <li key={n.id} className="px-4 py-2.5 text-sm">
                      <p>{n.texto}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtData(n.ts)} · para {n.papel}
                      </p>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </header>
          <div className="px-4 pt-3 sm:hidden">
            <DemoChip />
          </div>
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
