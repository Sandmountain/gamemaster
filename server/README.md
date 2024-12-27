# WebSocket Server

A TypeScript-based WebSocket server using Express and WS.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory (already done with default values):

```bash
PORT=3000
NODE_ENV=development
```

## Development

Run the development server:

```bash
npm run dev
```

## Build

Build the project:

```bash
npm run build
```

## Production

Start the production server:

```bash
npm start
```

## WebSocket Connection

Connect to the WebSocket server at:

```
ws://localhost:3000
```

The server will send a welcome message upon connection and echo back any messages it receives.
