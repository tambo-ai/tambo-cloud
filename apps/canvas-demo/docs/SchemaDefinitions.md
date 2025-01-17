# Schema Definitions Documentation

## Overview

The schema definitions provide type safety and validation for the application's data structures, particularly focusing on FRED data visualization components and their configurations.

## Core Schemas

### Input Schemas

```typescript
// Base input option schema
const InputOptionSchema = {
  value: string,
  label: string,
};

// Input configuration types
type InputConfig =
  | MultiSelectInput // For series selection
  | SelectInput // For frequency/units
  | DateInput; // For observation dates
```

### FRED Parameter Schemas

#### Basic FRED Parameters

```typescript
const FredParamsSchema = {
  series_id: string | string[],
  frequency: "d" | "w" | "bw" | "m" | "q" | "sa" | "a",
  units: "lin" | "chg" | "ch1" | "pch" | "pc1" | "pca" | "cch" | "log",
  observation_start?: string,
  observation_end?: string
}
```

#### Extended FRED Parameters

Adds visualization options to basic parameters:

```typescript
const ExtendedFredParamsSchema = {
  ...FredParamsSchema,
  multiSeries?: boolean,
  dualAxis?: boolean
}
```

### Chart Schemas

#### Line Configuration

```typescript
const LineConfigSchema = {
  dataKey: string,
  stroke: string,
  yAxisId?: string
}
```

#### Chart Data Point

```typescript
const ChartDataPointSchema = {
  timestamp: string,
  [key: string]: string | number  // Dynamic data values
}
```

## Component Props Schemas

### DataWrapper Props

```typescript
const DataWrapperPropsSchema = {
  initialParams?: Partial<ExtendedFredParams>,
  inputs?: InputConfig[],
  showControls?: boolean,
  height?: number
}
```

### Canvas Component Props

```typescript
const CanvasComponentPropsSchema = {
  id: string,
  title: string,
  description?: string,
  fredParams: ExtendedFredParams,
  height?: number,
  inputs: InputConfig[]
}
```

## Usage Guidelines

### 1. Input Configuration

- Use appropriate input types based on the data being collected
- Provide clear labels and descriptions
- Include relevant options and defaults

### 2. FRED Parameters

- Specify correct frequency codes based on data availability
- Choose appropriate units for data visualization
- Consider date range limitations

### 3. Chart Configuration

- Configure line styles for clarity
- Handle multi-series data appropriately
- Consider axis scaling and labels

### 4. Validation

The schemas provide runtime validation through Zod:

- Type checking
- Required field validation
- Value constraints
- Custom validation rules
