import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  HandHeart,
  ShieldCheck,
  Store,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./alimentabot-experience.css";

type ProfileId = "doador" | "gestor" | "operador" | "transportador" | "instituicao";
type Profile = {
  id: ProfileId;
  name: string;
  eyebrow: string;
  description: string;
  to: "/app/doador" | "/app/gestor" | "/app/operador" | "/app/transportador" | "/app/instituicao";
  icon: LucideIcon;
  point: [number, number];
};

const experienceProfiles: readonly Profile[] = [
  {
    id: "doador",
    name: "Doador",
    eyebrow: "01 / 05 · ORIGEM",
    description:
      "Cadastre alimentos excedentes e acompanhe o início da jornada de cada lote fictício.",
    to: "/app/doador",
    icon: Store,
    point: [88, 184],
  },
  {
    id: "gestor",
    name: "Gestor",
    eyebrow: "02 / 05 · SUPERVISÃO",
    description:
      "Visualize indicadores, registre revisões hipotéticas e acompanhe a rastreabilidade da operação.",
    to: "/app/gestor",
    icon: ShieldCheck,
    point: [270, 94],
  },
  {
    id: "operador",
    name: "Operador",
    eyebrow: "03 / 05 · COORDENAÇÃO",
    description:
      "Conecte lotes, destinos e transporte com critérios de compatibilidade e acompanhamento.",
    to: "/app/operador",
    icon: ClipboardCheck,
    point: [472, 157],
  },
  {
    id: "transportador",
    name: "Transportador",
    eyebrow: "04 / 05 · MOBILIDADE",
    description: "Acompanhe oportunidades, confirme coletas e registre as etapas de transporte.",
    to: "/app/transportador",
    icon: Truck,
    point: [682, 84],
  },
  {
    id: "instituicao",
    name: "Instituição",
    eyebrow: "05 / 05 · RECEBIMENTO",
    description:
      "Confira os lotes direcionados, registre a conferência e confirme o recebimento simulado.",
    to: "/app/instituicao",
    icon: HandHeart,
    point: [890, 174],
  },
];

const path = "M88 184 C146 184 174 85 270 94 S390 185 472 157 S590 56 682 84 S806 210 890 174";
const compactPath =
  "M240 70 C218 110 178 116 155 165 S222 224 260 265 S198 330 145 365 S212 430 245 465";
const compactPoints: Record<ProfileId, [number, number]> = {
  doador: [240, 70],
  gestor: [155, 165],
  operador: [260, 265],
  transportador: [145, 365],
  instituicao: [245, 465],
};

export function AlimentaExperience() {
  const [selectedId, setSelectedId] = useState<ProfileId>("doador");
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const selected =
    experienceProfiles.find((profile) => profile.id === selectedId) ?? experienceProfiles[0]!;
  const selectProfile = (id: ProfileId) => setSelectedId(id);
  const onKeyDown = (event: React.KeyboardEvent<SVGGElement>, id: ProfileId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectProfile(id);
    }
  };
  const exploreProfile = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.assign(`/app?perfil=${selected.id}`);
      return;
    }
    setIsLeaving(true);
    timerRef.current = window.setTimeout(
      () => window.location.assign(`/app?perfil=${selected.id}`),
      520,
    );
  };
  useEffect(() => () => window.clearTimeout(timerRef.current), []);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setIsCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const activePath = isCompact ? compactPath : path;
  const nodeRadius = isCompact ? 25 : 18.5;
  const haloRadius = isCompact ? 34 : 27;
  const iconSize = isCompact ? 20 : 18;
  const labelOffset = isCompact ? 52 : 46;

  return (
    <section
      className={`abx abx--page ${isLeaving ? "is-leaving" : ""}`}
      aria-labelledby="experience-title"
    >
      <div className="abx__ambient" aria-hidden="true" />
      <header className="abx__header">
        <Link className="abx__brand" to="/" aria-label="Voltar ao site AlimentaBot">
          <span className="abx__mark" aria-hidden="true" />
          <span>AlimentaBot</span>
        </Link>
        <span>EXPERIÊNCIA INTERATIVA / 2026</span>
      </header>
      <div className="abx__intro">
        <p>UMA REDE. DIFERENTES PERSPECTIVAS.</p>
        <h1 id="experience-title">Veja como tudo se conecta.</h1>
        <p className="abx__subtitle">
          Do excedente ao recebimento: descubra a jornada do alimento sob a perspectiva de cada
          participante.
        </p>
      </div>
      <div
        className={`abx__network ${isCompact ? "abx__network--compact" : ""}`}
        aria-label="Rede de perfis demonstrativos"
      >
        <span className="abx__edge abx__edge--start">ORIGEM</span>
        <span className="abx__edge abx__edge--end">DESTINO</span>
        <svg
          viewBox={isCompact ? "0 0 400 540" : "30 15 920 240"}
          role="img"
          aria-label="Fluxo da doação fictícia entre os cinco perfis"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="abx-flow" x1="0" x2="1">
              <stop stopColor="#A7D63D" />
              <stop offset=".48" stopColor="#168B62" />
              <stop offset="1" stopColor="#A7D63D" />
            </linearGradient>
            <filter id="abx-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <path id="abx-path" d={activePath} />
          </defs>
          <path className="abx__path-base" d={activePath} />
          <path className="abx__path-glow" d={activePath} />
          <path className="abx__path-flow" d={activePath} />
          <circle className="abx__particle abx__particle--one" r="5" filter="url(#abx-glow)">
            <animateMotion dur="5.6s" repeatCount="indefinite" rotate="auto">
              <mpath href="#abx-path" />
            </animateMotion>
          </circle>
          <circle className="abx__particle abx__particle--two" r="3" filter="url(#abx-glow)">
            <animateMotion dur="5.6s" begin="-2.8s" repeatCount="indefinite" rotate="auto">
              <mpath href="#abx-path" />
            </animateMotion>
          </circle>
          {experienceProfiles.map((profile) => {
            const Icon = profile.icon;
            const active = profile.id === selectedId;
            const point = isCompact ? compactPoints[profile.id] : profile.point;
            return (
              <g
                key={profile.id}
                className={`abx__node ${active ? "is-selected" : ""}`}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`Selecionar perfil ${profile.name}`}
                onClick={() => selectProfile(profile.id)}
                onKeyDown={(event) => onKeyDown(event, profile.id)}
              >
                {active && (
                  <circle className="abx__halo" cx={point[0]} cy={point[1]} r={haloRadius} />
                )}
                <circle className="abx__node-disc" cx={point[0]} cy={point[1]} r={nodeRadius} />
                <foreignObject
                  x={point[0] - iconSize / 2}
                  y={point[1] - iconSize / 2}
                  width={iconSize}
                  height={iconSize}
                >
                  <Icon aria-hidden="true" size={iconSize} strokeWidth={1.8} />
                </foreignObject>
                <text x={point[0]} y={point[1] + labelOffset} textAnchor="middle">
                  {profile.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <article className="abx__panel" key={selected.id} aria-live="polite">
        <p className="abx__eyebrow">{selected.eyebrow}</p>
        <div>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
        </div>
        <a className="abx__explore" href={`/app?perfil=${selected.id}`} onClick={exploreProfile}>
          Explorar este perfil <span aria-hidden="true">↗</span>
        </a>
      </article>
      <nav className="abx__tabs" aria-label="Selecionar perspectiva demonstrativa">
        {experienceProfiles.map((profile, index) => (
          <button
            key={profile.id}
            type="button"
            className={profile.id === selectedId ? "is-selected" : ""}
            onClick={() => selectProfile(profile.id)}
            aria-pressed={profile.id === selectedId}
          >
            <span>0{index + 1}</span>
            {profile.name}
          </button>
        ))}
      </nav>
      <p className="abx__notice">DEMONSTRAÇÃO ACADÊMICA&nbsp; · &nbsp;DADOS FICTÍCIOS</p>
    </section>
  );
}
