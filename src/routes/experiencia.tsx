import { AlimentaExperience } from "@/components/experience/AlimentaExperience";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/experiencia")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "AlimentaBot Experience — Demonstração acadêmica" },
      {
        name: "description",
        content: "Experiência demonstrativa pública com dados fictícios do AlimentaBot.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AlimentaExperience,
});
