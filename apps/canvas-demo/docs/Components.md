# Components Documentation

## Overview

This documentation covers two key components in the application: `CanvasComponent` and `DataWrapper`. These components work together to provide interactive economic data visualization capabilities.

## CanvasComponent

### Purpose

The `CanvasComponent` serves as a draggable, interactive container for economic data visualizations. It provides a card-based interface with a title, description, and configurable chart display.

### Features

1. **Drag and Drop**

   - Uses `@dnd-kit/sortable` for drag functionality
   - Smooth animations and transitions
   - Visual feedback during dragging

2. **UI Elements**
   - Title and description display
   - Drag handle with hover effect
   - Card-based layout

### Props Interface

```typescript
interface CanvasComponentProps {
  id: string;
  title: string;
  description?: string;
  fredParams: ExtendedFredParams;
  height?: number;
  inputs: InputConfig[];
}
```

### Usage Example

```typescript
<CanvasComponent
  id="gdp-chart"
  title="GDP Growth"
  description="Quarterly GDP growth rate"
  fredParams={{
    series_id: "GDP",
    frequency: "q",
    units: "pch"
  }}
  height={300}
  inputs={[...]}
/>
```

## DataWrapper

### Purpose

The `DataWrapper` component manages data fetching, state management, and user interactions for FRED economic data visualization. It provides a complete interface for data configuration and display.

### Key Features

1. **State Management**

   - Handles FRED parameters
   - Manages loading states
   - Error handling
   - Dirty state tracking

2. **Date Range Selection**

   - Custom date picker
   - Preset time horizons
   - Date validation

3. **Input Controls**

   - Series selection (multi-select)
   - Frequency selection
   - Units selection
   - Update button with loading state

4. **Data Visualization**
   - Line chart display
   - Multi-series support
   - Dual axis capability
   - Dynamic data merging

### Props Interface

```typescript
interface DataWrapperProps {
  initialParams?: ExtendedFredParams;
  inputs?: InputConfig[];
  showControls?: boolean;
  height?: number;
}
```

### Data Flow

1. User selects parameters (series, frequency, dates, etc.)
2. Component marks state as dirty
3. User triggers update
4. Data is fetched from FRED
5. Data is transformed for visualization
6. Chart is updated with new data

### Example Usage

```typescript
<DataWrapper
  initialParams={{
    series_id: "GDP",
    frequency: "q",
    units: "lin"
  }}
  inputs={[
    {
      type: "multi-select",
      key: "series_id",
      label: "Series",
      options: [...]
    },
    // ... other inputs
  ]}
  showControls={true}
  height={400}
/>
```

## Component Interaction

### Data Flow

```
CanvasComponent
    ↓
DataWrapper
    ↓
FRED API → Data Transform → Chart Display
```

### State Management

1. `CanvasComponent` provides the container and configuration
2. `DataWrapper` handles:
   - Data fetching
   - State management
   - User interactions
   - Chart rendering

### Best Practices

1. **Performance**

   - Use memoization for expensive calculations
   - Implement efficient data transformations
   - Handle loading states appropriately

2. **Error Handling**

   - Display user-friendly error messages
   - Provide fallback UI
   - Log errors for debugging

3. **Accessibility**

   - Include ARIA labels
   - Ensure keyboard navigation
   - Provide alternative text for charts

4. **Responsiveness**
   - Adapt to different screen sizes
   - Handle mobile interactions
   - Maintain usability across devices
