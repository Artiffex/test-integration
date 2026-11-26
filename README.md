# DeFi Dashboard — Staking Rewards Calculator

The staking rewards calculator is integrated into the existing React dashboard and powered by the project's Express server.

## Requirements and setup

- Node.js 18 or later
- npm

```sh
npm install
npm start
```

The React app runs at `http://localhost:3000`; the API runs at `http://localhost:5025`. The development proxy forwards `/api` requests to Express. To run either process independently, use `npm run client` or `npm run server`.

For a production build, run `npm run build`, set `NODE_ENV=production`, then start the Express server. The server serves the generated `build/` directory. `PORT` can be set to change the API port.

## Docker

Build and start the production dashboard and API with Docker Compose:

```sh
docker compose up --build
```

Open `http://localhost:5025`. To stop the container, run `docker compose down`. The image builds the React app in a separate stage and serves it from the Express container; no database or `.env` file is required for the calculator.

## API

`POST /api/calculate-rewards`

```json
{
  "principal": 1000,
  "apy": 5,
  "duration": 365,
  "durationUnit": "days",
  "compoundingFrequency": "daily",
  "tokenPrice": 2
}
```

`tokenPrice` is optional. Supported units are `days` and `years`; frequencies are `daily`, `weekly`, `monthly`, and `annually`. A successful response includes `projectedBalance`, `rewardsEarned`, `normalizedDuration`, and 61 `chartData` samples. When a token price is supplied, the response also includes USD projections. Invalid input returns `400` with a human-readable `error` and a `details` array. Unexpected failures return `500`.

## Mathematical model

`apy` is an **effective annual percentage yield**, expressed as a percentage (for example, `5` means 5%). It is not interpreted as a nominal rate. For `n` periods per year, the equivalent period rate is:

```text
periodRate = (1 + APY)^(1/n) - 1
balance(t) = principal × (1 + periodRate)^(n × t)
```

Here APY is converted to a decimal in the formula, and `t` is years. This guarantees that one full year earns the requested effective APY, regardless of compounding frequency; fractional periods are allowed for fractional durations and chart samples. Duration in days is normalized using 365 days per year (leap years are not modeled).

The calculator accepts a principal greater than zero up to `1e12`, APY from 0% to 1000%, durations greater than zero up to 100 years, and an optional token price from zero to `1e12`.

The final-balance calculation is **O(1)**. Chart generation uses 61 evenly spaced samples and is **O(k)** time and **O(k)** space for `k` retained points. The chart sample count is fixed at 61 for a consistent, responsive visualization.

## Structure and trade-offs

- `server/routes/api/rewards.js` defines the endpoint.
- `server/controllers/rewardsController.js` validates the request and maps it to a response.
- `server/validation/rewardsValidation.js` owns request boundaries and allowed options.
- `server/services/rewardsService.js` normalizes duration and shapes the API response.
- `server/utils/rewardsCalculator.js` contains reusable, UI/HTTP-independent math.
- `src/components/staking/RewardsCalculator.tsx` contains the dashboard widget, request states, and interactive SVG chart.

No database is needed because projections are stateless. The chart is drawn in SVG rather than adding a charting dependency. USD values are estimates from the optional user-provided token price; they do not account for price changes, fees, taxes, or protocol-specific reward rules.

## Tests

```sh
npm run test:server
npm test -- --watchAll=false
```
