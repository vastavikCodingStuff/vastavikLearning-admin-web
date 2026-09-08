# Admin Web: Neo-Brutalist Design System & Banned Storage

## Neo-Brutalist UI Theme
- Located directly above System Administration in the sidebar.
- Features Google Font `Roboto Slab`, 2px solid black borders, 4px bottom-right offset shadows, and high-contrast dark mode.
- Synchronized via `useUiStyleStore` and persistent zero-flicker `<head>` script.

## Banned & Archived Student Records
- Added a dedicated "Banned & Archived Storage" tab in `/dashboard/students`.
- Retrieves separately preserved snapshots from `/admin/students/archived`.
- Modal allows inspection of preserved attributes and data counts (chats, notes, transactions).
