# Hydra Integration Documentation

## Overview

The Hydra integration system provides AI-powered chart generation capabilities through the Hydra AI service. It handles the communication between the application and Hydra AI, component registration, and FRED data integration.

## Core Components

### HydraClient Configuration

```typescript
export const hydraClient = new HydraClient({
  hydraApiKey: process.env.NEXT_PUBLIC_HYDRA_API_KEY,
});
```

### FRED Search Tool

A custom tool registered with Hydra for searching Federal Reserve Economic Data (FRED) series:

```typescript
const fredSearchTool: ComponentContextTool = {
  definition: {
    name: "searchFredSeries",
    description: "Search for FRED economic data series by keywords",
    parameters: [
      {
        name: "searchText",
        type: "string",
        description: "Keywords to search for in FRED series",
        isRequired: true,
      },
    ],
  },
  // ... implementation
};
```

### Component Registration

The system registers a `FredChart` component with Hydra AI with specific guidelines for:

- Series ID specification
- Frequency and units selection
- Input configuration
- Chart visualization parameters

## Key Features

1. **AI Integration**

   - Connects to Hydra AI service
   - Handles API key management
   - Provides component context tools

2. **FRED Integration**

   - Searches FRED series
   - Manages economic data retrieval
   - Handles data transformation

3. **Component Management**
   - Registers visualization components
   - Defines component schemas
   - Manages props and input configurations

## Usage Guidelines

### Component Generation Rules

1. Always specify explicit `series_id` values
2. Choose appropriate frequency and units
3. Provide both selected and alternative options
4. Consider using `multiSeries` for comparisons
5. Follow schema definitions for inputs

### Example Input Configuration

```typescript
inputs: [
  {
    type: "multi-select",
    key: "series_id",
    label: "Series",
    options: [
      { value: "GDP", label: "Gross Domestic Product" },
      { value: "RGDP", label: "Real Gross Domestic Product" },
    ],
  },
  {
    type: "select",
    key: "frequency",
    label: "Frequency",
    selected: "q",
    options: [
      { value: "q", label: "Quarterly" },
      { value: "a", label: "Annual" },
    ],
  },
];
```
