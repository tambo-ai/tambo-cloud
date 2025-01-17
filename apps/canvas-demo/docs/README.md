# Documentation Index

## Introduction

This documentation covers the implementation of an AI-powered economic data visualization system that integrates Hydra AI with FRED (Federal Reserve Economic Data) services.

## Table of Contents

### 1. [Chat Context](./ChatContext.md)

- Context Provider Implementation
- State Management
- Message Handling
- Integration with AI Services
- Usage Examples and Best Practices

### 2. [Hydra Integration](./HydraIntegration.md)

- Client Configuration
- FRED Search Tool Integration
- Component Registration
- AI Integration Features
- Usage Guidelines

### 3. [Schema Definitions](./SchemaDefinitions.md)

- Input Schemas
- FRED Parameter Schemas
- Chart Schemas
- Component Props Schemas
- Validation Guidelines

### 4. [Components](./Components.md)

- CanvasComponent Implementation
- DataWrapper Functionality
- Component Interaction
- Best Practices

## Quick Start

### Setting Up

1. Ensure you have the required environment variables:

   ```
   NEXT_PUBLIC_HYDRA_API_KEY=your_api_key
   ```

2. Wrap your application with the ChatProvider:

   ```tsx
   import { ChatProvider } from "@/contexts/ChatContext";

   function App() {
     return (
       <ChatProvider>
         <YourApp />
       </ChatProvider>
     );
   }
   ```

### Basic Usage

1. **Creating a Chart Component**

   ```tsx
   <CanvasComponent
     id="economic-chart"
     title="Economic Indicators"
     fredParams={{
       series_id: "GDP",
       frequency: "q",
       units: "pch",
     }}
   />
   ```

2. **Using the Chat Context**
   ```tsx
   const { messages, handleSubmit } = useChatContext();
   ```

## Architecture Overview

```
Chat Context
    ↓
Hydra Integration
    ↓
Components (CanvasComponent, DataWrapper)
    ↓
FRED Data Visualization
```

## Key Features

1. **AI-Powered Visualization**

   - Intelligent chart generation
   - Natural language processing
   - Dynamic data analysis

2. **Economic Data Integration**

   - FRED data access
   - Multiple series support
   - Customizable visualizations

3. **Interactive Components**
   - Drag-and-drop interface
   - Real-time updates
   - Configurable parameters

## Development Guidelines

### Best Practices

1. Always validate FRED parameters
2. Handle loading and error states
3. Implement proper type checking
4. Follow accessibility guidelines

### Common Patterns

1. Use the ChatContext for state management
2. Implement memoization for performance
3. Follow schema definitions for type safety
4. Handle component lifecycle properly

## Contributing

When contributing to this project:

1. Follow the existing documentation structure
2. Update relevant schema definitions
3. Maintain type safety
4. Add appropriate tests
5. Update documentation as needed
