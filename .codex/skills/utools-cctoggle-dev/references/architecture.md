# Project Architecture

## Directory Structure

`
utools-ccswitch/
©À©¤©¤ src/
©¦ ©À©¤©¤ components/ # Reusable UI components
©¦ ©À©¤©¤ composables/ # State management & business logic
©¦ ©À©¤©¤ views/ # Page-level components
©¦ ©À©¤©¤ router/ # Vue Router config
©¦ ©À©¤©¤ data/ # Static data & presets
©¦ ©¸©¤©¤ style.css # Global CSS variables
©À©¤©¤ public/ # Static assets
©À©¤©¤ dist/ # Build output
©À©¤©¤ package.json
©À©¤©¤ vite.config.js
©¸©¤©¤ pnpm-lock.yaml
`

## Key Components

### ProviderCard.vue
- Displays provider information
- Shows current active provider
- Provides switch/edit/delete actions

### ProviderForm.vue
- Modal form for adding/editing providers
- Handles different app types

### TabBar.vue
- Switches between app types
- Uses icons and labels

## Composables

### useProviders.js
- Manages provider CRUD operations
- Wraps window.skillNest API
- Handles reactive state updates

### useRoutes.js
- Manages route configurations
- Handles proxy routing rules

## Data Flow

1. Providers stored in uTools storage via skillNest
2. Composables wrap skillNest methods
3. Components use composables for reactive state
4. Changes trigger loadProviders() to refresh
