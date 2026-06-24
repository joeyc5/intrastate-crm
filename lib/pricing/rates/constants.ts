// The Item 310 minimum-weight columns (ANY-QTY <1000, then 1000..16000).
// Shared by the rate loader's completeness check and the weight-break lookup.
export const ITEM310_WEIGHT_COLUMNS = [0, 1000, 2000, 5000, 8000, 12000, 16000] as const;
