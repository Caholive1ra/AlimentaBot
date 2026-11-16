import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }: React.ComponentProps<"a"> & { to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import { AlimentaExperience } from "@/components/experience/AlimentaExperience";

describe("AlimentaBot Experience", () => {
  it("abre pelo Doador e sincroniza a seleção entre rede e barra", () => {
    render(<AlimentaExperience />);

    expect(screen.getByRole("heading", { name: "Doador" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /selecionar perfil doador/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: /selecionar perfil Transportador/i }));

    expect(screen.getByRole("heading", { name: "Transportador" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /selecionar perfil transportador/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("link", { name: /explorar este perfil/i })).toHaveAttribute(
      "href",
      "/app?perfil=transportador",
    );
  });

  it("permite selecionar todos os perfis pela barra", () => {
    render(<AlimentaExperience />);

    for (const [index, profile] of [
      "Doador",
      "Gestor",
      "Operador",
      "Transportador",
      "Instituição",
    ].entries()) {
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`0${index + 1}\\s+${profile}`) }),
      );
      expect(screen.getByRole("heading", { name: profile })).toBeInTheDocument();
    }
  });
});
