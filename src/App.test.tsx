import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RewardsCalculator from "./components/staking/RewardsCalculator";

const projection = {
  projectedBalance: 1050,
  rewardsEarned: 50,
  normalizedDuration: { years: 1, days: 365, unit: "years" as const },
  chartData: [
    { day: 0, year: 0, balance: 1000 },
    { day: 365, year: 1, balance: 1050 },
  ],
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("shows the idle state and submits a valid calculation", async () => {
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => projection,
  } as Response);

  render(<RewardsCalculator />);

  expect(
    screen.getByText(/enter your staking details to see an estimated final balance/i)
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /calculate rewards/i }));

  await waitFor(() => {
    expect(screen.getByText("1,050.00 tokens")).toBeInTheDocument();
    expect(screen.getByText("+50.00 tokens")).toBeInTheDocument();
  });
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/calculate-rewards",
    expect.objectContaining({ method: "POST" })
  );
});

test("shows useful validation feedback without calling the API", () => {
  const fetchMock = jest.spyOn(global, "fetch");
  render(<RewardsCalculator />);

  fireEvent.change(screen.getByLabelText(/principal amount/i), {
    target: { value: "0" },
  });
  fireEvent.click(screen.getByRole("button", { name: /calculate rewards/i }));

  expect(screen.getByRole("alert")).toHaveTextContent(/principal greater than 0/i);
  expect(fetchMock).not.toHaveBeenCalled();
});
