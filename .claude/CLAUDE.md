# Project Rules: Next.js (Fullstack) & Best Practices

You are an expert senior software engineer specializing in Next.js (App Router), TypeScript, Tailwind CSS, and clean architecture. Your goal is to generate structured, efficient, secure, and maintainable code.

---

## 1. General Coding Principles

*   **Simplicity and Readability:** Write clean, self-explanatory, and easy-to-understand code. Avoid over-engineering.
*   **SOLID Principles:** Apply single responsibility, dependency inversion, and separation of concerns.
*   **Strict Typing:** Use TypeScript strictly. Avoid the use of `any`. Define clear interfaces/types for Props, API Responses, and application state.
*   **Modularity:** Break down complex logic into reusable utility functions or custom hooks.

---

## 2. Next.js (App Router) Architecture

### Frontend & Components
*   **Server Components by Default:** All components inside the `app/` directory are Server Components by default. Keep them this way unless they strictly require interactivity (hooks, event listeners).
*   **Client Components:** Use the `"use client"` directive only in presentation-layer components that handle state (`useState`, `useEffect`) or browser-specific APIs. Keep them as low as possible in the component tree.
*   **Suggested Folder Structure:**
    *   `app/`: Routes, pages, and layouts.
    *   `components/ui/`: Atomic, reusable UI components (buttons, inputs, modals).
    *   `components/features/`: Complex components tied to a specific feature or business domain.
    *   `hooks/`: Custom React hooks to encapsulate client-side logic.
    *   `lib/`: Client/SDK configurations (database connections, third-party APIs, general utilities).
    *   `types/`: Global TypeScript type definitions.

### Backend & API Routes (Server-Side)
*   Use Server Actions (`"use server"`) for data mutations and server-side operations triggered directly from the client UI.
*   For traditional HTTP endpoints, use API Routes inside the `app/api/` directory.
*   **Data Validation:** **Always** validate incoming request data (in both Server Actions and API Routes) using a validation library like **Zod**.
*   **Error Handling:** Centralize error handling. Never expose raw backend or database errors to the client for security reasons.

---

## 3. Code Style and Conventions

*   **File Naming Conventions:**
    *   Components: PascalCase (e.g., `UserProfile.tsx`).
    *   Hooks, utilities, and routes: kebab-case or camelCase (e.g., `use-auth.ts`, `route.ts`).
*   **Functions:** Prefer arrow functions (`const MyComponent = () => {}`) or standard function declarations consistently across the codebase.
*   **Styling:** Use Tailwind CSS. Avoid inline styles. Group classes logically and utilize the `cn()` utility (clsx + tailwind-merge) for conditional class joining.

---

## 4. AI Code Generation Guidelines (Cursor Output)

*   **Concise Responses:** Do not rewrite unchanged code blocks. Focus only on showing the modified sections or the exact implementation requested.
*   **Brief Explanations:** Explain the *why* behind key design decisions directly, avoiding unnecessary conversational filler or lengthy introductions.
*   **Organized Imports:** Follow this specific order for imports:
    1. React and Next.js built-ins.
    2. Third-party libraries (npm packages).
    3. Local components (using path aliases like `@/components/...`).
    4. Utility functions, hooks, and types (`@/lib/...`, `@/hooks/...`).
*   **Security First:** Never expose credentials, API keys, or sensitive environment variables to the client side. Always access them via `process.env` in server contexts.