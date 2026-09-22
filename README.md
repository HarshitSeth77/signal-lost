# SIGNAL / LOST

A cooperative spaceship survival game for 2–6 players. No accounts, no build step, no package installation. Requires Node.js 18 or newer.

## Run locally

Open a terminal in this folder and run `node server.js`, then open http://localhost:3000.

For a second device on the same Wi-Fi, open `http://YOUR-COMPUTER-IP:3000` while the server is running. Windows may require allowing Node.js through the firewall on your private network. Use separate browser tabs for a quick two-player test; each tab has its own crew session.

Create a crew, share the four-letter code, and have every player ready up. Keep a separate voice call open for remote play. Every player receives instructions for another station. Communicate those instructions and set your own controls correctly. Survive five sectors together.

## Reliability checks

Run `node --test test.js`. The test plays a complete two-player mission and verifies private player views, rejected unauthorized actions, wrong-answer damage, repeat-action protection, synchronized scoring, replay reset, reconnection and captain handover.

## Local version limitations

This build is local, not publicly hosted. Players on different networks need a hosted server or a separately configured secure tunnel; a room code alone does not connect networks. Voice chat is external. Rooms live in server memory and disappear on restart or after three hours of inactivity. Refreshing restores your session in the same tab. Leaving a screen disconnects the player; the captain can remove disconnected players in the lobby. During a mission, disconnected stations can rejoin; unresolved systems incur timeout damage. Fonts load from Google Fonts when available, with local fallbacks.

The server owns timers, answers, scoring and game progression. It sends each player only their own controls and assigned instructions. Room creation is intended for local trusted groups; public deployment should add rate limits and capacity controls first.
