import { render, screen } from "@testing-library/react";
import CLIAuthPage from "./page";
import { api } from "@/trpc/react";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseClient } from "@/app/utils/supabase";

// Mock the necessary dependencies
jest.mock("@/trpc/react", () => ({
  api: {
    project: {
      getUserProjects: {
        useQuery: jest.fn(),
      },
      getApiKeys: {
        useQuery: jest.fn(),
      },
      removeApiKey: {
        useMutation: jest.fn(),
      },
      generateApiKey: {
        useMutation: jest.fn(),
      },
      createProject: {
        useMutation: jest.fn(),
      },
      addProviderKey: {
        useMutation: jest.fn(),
      },
      getProviderKeys: {
        useQuery: jest.fn(),
      },
    },
  },
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: jest.fn(),
}));

jest.mock("@/app/utils/supabase", () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock("@/components/sections/header", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

describe("CLIAuthPage", () => {
  beforeEach(() => {
    // Setup mocks with default values
    (api.project.getUserProjects.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (api.project.getApiKeys.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    (api.project.removeApiKey.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (api.project.generateApiKey.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (api.project.createProject.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    (api.project.addProviderKey.useMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (api.project.getProviderKeys.useQuery as jest.Mock).mockReturnValue({
      data: [],
      refetch: jest.fn(),
    });

    (useToast as jest.Mock).mockReturnValue({
      toast: jest.fn(),
    });

    (getSupabaseClient as jest.Mock).mockReturnValue({
      auth: {
        signOut: jest.fn(),
      },
    });
  });

  it("renders without the auth step since authentication is handled by the layout", () => {
    render(<CLIAuthPage />);

    // Verify the header is rendered
    expect(screen.getByTestId("header")).toBeInTheDocument();

    // Check that the page starts with project selection (skipping auth step)
    expect(
      screen.getByText("Choose a project to generate your API key"),
    ).toBeInTheDocument();

    // The auth step should not be shown
    expect(
      screen.queryByText("Sign in to get started with tambo"),
    ).not.toBeInTheDocument();
  });

  it("loads projects when the page renders", () => {
    render(<CLIAuthPage />);

    // Verify that the getUserProjects query was called
    expect(api.project.getUserProjects.useQuery).toHaveBeenCalled();
  });

  it("shows the logout button since we are in an authenticated context", () => {
    render(<CLIAuthPage />);

    // Check that logout button is always visible
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
});
