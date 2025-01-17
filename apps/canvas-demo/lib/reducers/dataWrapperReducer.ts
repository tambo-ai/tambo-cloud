import type {
  ExtendedFredParams,
  SeriesMetadata,
  AvailableOptions,
} from "@/lib/schema";
import type { FredSeriesData } from "@/lib/fred";

export interface DataWrapperState {
  metadata: Record<string, SeriesMetadata>;
  data: Record<string, FredSeriesData> | null;
  availableOptions: AvailableOptions;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  isOpen: boolean;
  params: ExtendedFredParams;
}

type DataWrapperAction =
  | { type: "SET_METADATA"; payload: Record<string, SeriesMetadata> }
  | { type: "SET_DATA"; payload: Record<string, FredSeriesData> }
  | { type: "SET_OPTIONS"; payload: AvailableOptions }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DIRTY"; payload: boolean }
  | { type: "SET_OPEN"; payload: boolean }
  | { type: "UPDATE_PARAMS"; payload: Partial<ExtendedFredParams> };

export function dataWrapperReducer(
  state: DataWrapperState,
  action: DataWrapperAction
): DataWrapperState {
  switch (action.type) {
    case "SET_METADATA":
      return { ...state, metadata: action.payload };
    case "SET_DATA":
      return { ...state, data: action.payload };
    case "SET_OPTIONS":
      return { ...state, availableOptions: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_DIRTY":
      return { ...state, isDirty: action.payload };
    case "SET_OPEN":
      return { ...state, isOpen: action.payload };
    case "UPDATE_PARAMS":
      return {
        ...state,
        params: { ...state.params, ...action.payload },
      };
    default:
      return state;
  }
}
