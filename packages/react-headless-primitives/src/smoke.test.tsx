import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";

describe("test pipeline", () => {
  it("renders with React Testing Library", () => {
    render(<button type="button">Click me</button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<button type="button">Click me</button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
