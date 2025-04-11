# CLI Authentication Page

This directory contains the CLI Authentication flow components and page implementation. The page is used to help users set up the tambo CLI by generating an API key for a specific project.

## Authentication Flow

The CLI authentication page follows a simplified flow:

1. **Authentication** - Handled automatically by the `(authed)` layout, which redirects unauthenticated users to the login page
2. **Project Selection** - User selects an existing project or creates a new one
3. **API Key Management** - User generates a new API key or manages existing keys

## Components

The components in this directory handle different aspects of the CLI authentication flow:

- `CreateProjectDialog.tsx` - Modal for creating a new project
- `DeleteKeyDialog.tsx` - Modal for confirming API key deletion
- `KeyStep.tsx` - Component for API key generation and management
- `ProgressIndicator.tsx` - Progress bar showing the current step in the flow
- `ProjectStep.tsx` - Component for selecting or creating a project

## Security Considerations

- Authentication is enforced through the `(authed)` layout, which verifies the user session on every request
- User session is validated server-side in the layout before rendering any protected content
- API keys are only shown once for security reasons and are not stored in plain text
- A countdown timer automatically closes the window after key generation to reduce exposure

## Technical Notes

- The page uses the Supabase client for authentication operations
- TRPC is used for all server-side API calls
- The page is fully typed with TypeScript for type safety
- The UI follows the design system using shadcn components
