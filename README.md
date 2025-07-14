# WebCal

A very simple, client-side-only CalDAV-compatible calendar UI built with React, Vite, and Tailwind CSS.

## Features

- **CalDAV support:** Connect to and display events from any CalDAV server.
- **Multiple calendars:** Add, edit, enable/disable, and color-code multiple calendars.
- **Modern UI:** Responsive, clean interface using FullCalendar and Tailwind CSS.
- **Views:** Month, week, day, and agenda (list) views.
- **Event management:** Create, edit, and delete events (if your CalDAV server supports it).
- **Import/Export:** Import/export calendar configurations as JSON.
- **No backend:** All logic runs in the browser; your credentials are never sent to a third-party server.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm

### Development

```bash
npm install
npm run dev
```

Visit [http://localhost:8080](http://localhost:8080) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

Visit [http://localhost:8080](http://localhost:8080) in your browser.

### Docker

Build and run a production container using Caddy to serve the static files:

```bash
docker build -t webcal .
docker run -p 8080:80 webcal
```

Visit [http://localhost:8080](http://localhost:8080) in your browser.

## Usage

1. **Add a CalDAV calendar:** Click "Add Calendar" and enter your CalDAV server URL, username, and password.
2. **Enable/disable calendars:** Use the sidebar or calendar modal to toggle visibility.
3. **Switch views:** Use the toolbar to switch between month, week, day, and agenda views.
4. **Manage events:** Click on a date to add an event, or click an event to edit/delete it.
5. **Import/Export:** Use the sidebar buttons to save or load your calendar configuration.

## Security & Privacy

- All operations are performed in your browser.
- Credentials are stored in localStorage and only sent directly to your CalDAV server.
- No data is sent to any third-party server.

## Limitations

- No server-side component; all data is stored in the browser.
- Only supports CalDAV servers that allow CORS requests from browsers.
- No push notifications or background sync.
