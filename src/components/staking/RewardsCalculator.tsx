import React, { FormEvent, PointerEvent, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";

type Frequency = "daily" | "weekly" | "monthly" | "annually";
type DurationUnit = "days" | "years";

type ChartPoint = {
  day: number;
  year: number;
  balance: number;
};

type CalculationResult = {
  projectedBalance: number;
  rewardsEarned: number;
  normalizedDuration: {
    years: number;
    days: number;
    unit: "years";
  };
  chartData: ChartPoint[];
  usdProjection?: {
    projectedBalance: number;
    rewardsEarned: number;
    currency: "USD";
  };
};

const formatTokenAmount = (value: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);

const formatUsd = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const validateForm = (
  principal: number,
  apy: number,
  duration: number,
  durationUnit: DurationUnit,
  tokenPrice?: number
) => {
  if (!Number.isFinite(principal) || principal <= 0 || principal > 1e12) {
    return "Enter a principal greater than 0 and no greater than 1 trillion.";
  }
  if (!Number.isFinite(apy) || apy < 0 || apy > 1000) {
    return "APY must be between 0% and 1,000%.";
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return "Enter a staking duration greater than zero.";
  }
  if (
    (durationUnit === "days" && duration > 36500) ||
    (durationUnit === "years" && duration > 100)
  ) {
    return "The maximum staking duration is 100 years.";
  }
  if (
    tokenPrice !== undefined &&
    (!Number.isFinite(tokenPrice) || tokenPrice < 0 || tokenPrice > 1e12)
  ) {
    return "Token price must be between 0 and 1 trillion.";
  }
  return undefined;
};

const GrowthChart = ({
  data,
  accent,
}: {
  data: ChartPoint[];
  accent: string;
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedPoint = data[selectedIndex];
  const width = 800;
  const height = 260;
  const left = 58;
  const right = 20;
  const top = 20;
  const bottom = 40;
  const values = data.map((point) => point.balance);
  const rawMinValue = Math.min(...values);
  const rawMaxValue = Math.max(...values);
  const flatPadding =
    rawMinValue === rawMaxValue
      ? Math.max(Math.abs(rawMaxValue) * 0.05, 1)
      : 0;
  const minValue = rawMinValue - flatPadding;
  const maxValue = rawMaxValue + flatPadding;
  const valueRange = maxValue - minValue || 1;
  const chartHeight = height - top - bottom;
  const chartWidth = width - left - right;
  const coordinates = data.map((point, index) => ({
    x: left + (index / Math.max(data.length - 1, 1)) * chartWidth,
    y: top + chartHeight - ((point.balance - minValue) / valueRange) * chartHeight,
  }));
  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1]?.x ?? left} ${
    height - bottom
  } L ${left} ${height - bottom} Z`;
  const active = coordinates[selectedIndex] ?? coordinates[0];

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const relativeX = (event.clientX - bounds.left) / bounds.width;
    setSelectedIndex(
      Math.min(
        data.length - 1,
        Math.max(0, Math.round(relativeX * (data.length - 1)))
      )
    );
  };

  return (
    <Box>
      <Box sx={{ width: "100%", overflow: "hidden" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          role="img"
          aria-label="Projected staking balance growth chart. Move your pointer over the chart to inspect a date."
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setSelectedIndex(0)}
          style={{ display: "block", touchAction: "pan-y" }}
        >
          {[0, 1, 2, 3].map((line) => {
            const y = top + (line / 3) * chartHeight;
            const value = maxValue - (line / 3) * (maxValue - minValue);
            return (
              <g key={line}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  opacity="0.1"
                />
                <text
                  x={left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="currentColor"
                  opacity="0.62"
                  fontSize="11"
                >
                  {formatTokenAmount(value)}
                </text>
              </g>
            );
          })}
          <path d={areaPath} fill={accent} opacity="0.12" />
          <path
            d={linePath}
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {active && (
            <>
              <line
                x1={active.x}
                x2={active.x}
                y1={top}
                y2={height - bottom}
                stroke={accent}
                strokeDasharray="4 4"
                opacity="0.55"
              />
              <circle
                cx={active.x}
                cy={active.y}
                r="6"
                fill={accent}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}
          <text
            x={left}
            y={height - 10}
            fill="currentColor"
            opacity="0.62"
            fontSize="11"
          >
            Day 0
          </text>
          <text
            x={width - right}
            y={height - 10}
            textAnchor="end"
            fill="currentColor"
            opacity="0.62"
            fontSize="11"
          >
            Day {data[data.length - 1]?.day ?? 0}
          </text>
        </svg>
      </Box>
      <input
        aria-label="Explore projected balance timeline"
        type="range"
        min={0}
        max={Math.max(data.length - 1, 0)}
        value={selectedIndex}
        onChange={(event) => setSelectedIndex(Number(event.target.value))}
        style={{ width: "100%", accentColor: accent, cursor: "pointer" }}
      />
      <Typography variant="body2" color="text.secondary" aria-live="polite">
        Day {selectedPoint?.day ?? 0} ·{" "}
        {formatTokenAmount(selectedPoint?.balance ?? 0)} tokens
      </Typography>
    </Box>
  );
};

const RewardsCalculator = () => {
  const theme = useTheme();
  const [principal, setPrincipal] = useState("1000");
  const [apy, setApy] = useState("5");
  const [duration, setDuration] = useState("365");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("days");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [tokenPrice, setTokenPrice] = useState("");
  const [result, setResult] = useState<CalculationResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const accent = theme.palette.mode === "dark" ? "#00dbe3" : "#078e9b";
  const inputValues = useMemo(
    () => ({
      principal: Number(principal),
      apy: Number(apy),
      duration: Number(duration),
      tokenPrice: tokenPrice.trim() === "" ? undefined : Number(tokenPrice),
    }),
    [principal, apy, duration, tokenPrice]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const validationMessage = validateForm(
      inputValues.principal,
      inputValues.apy,
      inputValues.duration,
      durationUnit,
      inputValues.tokenPrice
    );
    if (validationMessage) {
      setResult(undefined);
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setResult(undefined);
    try {
      const response = await fetch("/api/calculate-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principal: inputValues.principal,
          apy: inputValues.apy,
          duration: inputValues.duration,
          durationUnit,
          compoundingFrequency: frequency,
          ...(inputValues.tokenPrice === undefined
            ? {}
            : { tokenPrice: inputValues.tokenPrice }),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.details?.join(" ") || payload.error || "Calculation failed."
        );
      }
      setResult(payload as CalculationResult);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to calculate rewards. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      component="section"
      aria-labelledby="staking-calculator-title"
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[2],
        overflow: "visible",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, sm: 4 }, "&:last-child": { pb: 4 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              id="staking-calculator-title"
              variant="h5"
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              Staking rewards calculator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Estimate your rewards and explore balance growth over time.
            </Typography>
          </Box>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              color: accent,
              bgcolor: `${accent}18`,
              display: { xs: "none", sm: "grid" },
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <CalculateOutlinedIcon />
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <TextField
            label="Principal amount"
            type="number"
            value={principal}
            onChange={(event) => setPrincipal(event.target.value)}
            inputProps={{ min: 0, max: 1e12, step: "any" }}
            fullWidth
          />
          <TextField
            label="Annual percentage yield (APY)"
            type="number"
            value={apy}
            onChange={(event) => setApy(event.target.value)}
            inputProps={{ min: 0, max: 1000, step: "any" }}
            fullWidth
          />
          <TextField
            label="Staking duration"
            type="number"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            inputProps={{ min: 0, step: "any" }}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="duration-unit-label">Duration unit</InputLabel>
            <Select
              labelId="duration-unit-label"
              value={durationUnit}
              label="Duration unit"
              onChange={(event: SelectChangeEvent<DurationUnit>) =>
                setDurationUnit(event.target.value as DurationUnit)
              }
            >
              <MenuItem value="days">Days</MenuItem>
              <MenuItem value="years">Years</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="compounding-frequency-label">
              Compounding frequency
            </InputLabel>
            <Select
              labelId="compounding-frequency-label"
              value={frequency}
              label="Compounding frequency"
              onChange={(event: SelectChangeEvent<Frequency>) =>
                setFrequency(event.target.value as Frequency)
              }
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="annually">Annually</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Token price (optional, USD)"
            type="number"
            value={tokenPrice}
            onChange={(event) => setTokenPrice(event.target.value)}
            inputProps={{ min: 0, max: 1e12, step: "any" }}
            fullWidth
          />
          <Box
            sx={{
              gridColumn: { sm: "1 / -1" },
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              APY is treated as effective annual yield.
            </Typography>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <CalculateOutlinedIcon />
                )
              }
              sx={{
                minWidth: 190,
                bgcolor: accent,
                "&:hover": { bgcolor: theme.palette.mode === "dark" ? "#00bbc4" : "#067985" },
              }}
            >
              {loading ? "Calculating…" : "Calculate rewards"}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" role="alert" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box
            role="status"
            sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1.5 }}
          >
            <CircularProgress size={20} sx={{ color: accent }} />
            <Typography color="text.secondary">
              Calculating your projection…
            </Typography>
          </Box>
        )}

        {!loading && !error && !result && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: theme.palette.action.hover,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Enter your staking details to see an estimated final balance,
              rewards, and growth chart.
            </Typography>
          </Box>
        )}

        {!loading && result && (
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                mb: 3,
              }}
            >
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Projected final balance
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {formatTokenAmount(result.projectedBalance)} tokens
                </Typography>
                {result.usdProjection && (
                  <Typography variant="body2" color="text.secondary">
                    {formatUsd(result.usdProjection.projectedBalance)}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: `${accent}12`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Total rewards earned
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ color: accent, fontWeight: 700, mt: 0.5 }}
                >
                  +{formatTokenAmount(result.rewardsEarned)} tokens
                </Typography>
                {result.usdProjection && (
                  <Typography variant="body2" color="text.secondary">
                    {formatUsd(result.usdProjection.rewardsEarned)}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
                mb: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Projected balance growth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {result.normalizedDuration.years.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}{" "}
                years · {frequency} compounding
              </Typography>
            </Box>
            <GrowthChart data={result.chartData} accent={accent} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardsCalculator;
