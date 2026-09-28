# Chatzy Frontend Architecture

Chatzy uses a feature-based App Router structure. Route files stay thin and hand data into feature modules, while feature modules own their UI, state, services, and domain types.

## Folder Responsibilities

- `app/`: Next.js App Router entry points, root layout, metadata, and global CSS.
- `features/chat/`: Messaging dashboard domain. Contains chat UI, mock data, service contracts, local state, and chat-specific types.
- `features/chat/components/`: Dashboard composition split by product surface: navigation rail, chat list, conversation cards, active thread, and message composer.
- `features/chat/data/`: Local seed data used until the Spring Boot APIs are available.
- `features/chat/services/`: API boundary. `ChatService` can be replaced by an Axios-backed implementation without rewriting UI components.
- `features/chat/store/`: Zustand client state for selected conversation, search query, and filters.
- `features/chat/types/`: Conversation, message, presence, attachment, and snapshot models.
- `shared/`: Cross-feature primitives such as `Avatar` and the `cn` className helper.

## Component Hierarchy

`app/page.tsx` is a Server Component that gets a typed conversation snapshot from the service layer and renders `ChatDashboard`.

`ChatDashboard` is the client boundary for interactive dashboard state. It composes:

- `NavigationSidebar`
- `ChatListSidebar`
- `ConversationCard`
- `ActiveConversation`
- `MessageBubble`

## State Management

Zustand owns UI state that should survive component boundaries: selected conversation, search text, and unread filtering. Message composition is kept local to the active conversation component because it is transient form state.

Future state slices should stay feature-scoped first, then move to shared stores only when multiple features genuinely need them.

## API Layer

The current `MockChatService` implements the `ChatService` interface with local seed data. A production Spring Boot integration can add an Axios-backed class with the same contract, for example:

- `GET /api/conversations`
- `GET /api/conversations/{id}/messages`
- `POST /api/conversations/{id}/messages`
- `PATCH /api/messages/{id}/reactions`

UI components should call feature services or hooks rather than importing Axios directly.

## Scalability Notes

The structure is ready for one-to-one chats, groups, communities, calls, status, reactions, file sharing, presence, and push notifications because each product area can become a feature module with its own service contract and store slice. Shared primitives stay small and generic; domain rules stay inside feature folders.
