# SIGNAL / LOST: ECHO LOOP

A cooperative multiplayer time-loop adventure for 2–6 players. Every player receives a private role, another player's solution, and a different interactive console. Requires Node.js 18 or newer.

## Run locally

Open a terminal in this folder and run `npm start`, then open http://localhost:3000.

For a second device on the same Wi-Fi, open `http://YOUR-COMPUTER-IP:3000` while the server is running. Windows may require allowing Node.js through the firewall on your private network. Use separate browser tabs for a quick two-player test; each tab has its own crew session.

Create a crew, share the four-letter code, choose Cadet, Crew or Void difficulty, and run the playable training simulation if the group is new. Keep a separate voice call open. Past reconstructs memories, Present/Systems reroutes power, and Future traces safe routes. Exact solutions appear only on another player's screen. Stabilize three loops and discover why the ship is repeating its final minutes.

## Reliability checks

Run `npm test`. The test completes training and a full three-loop two-player mission, validating live difficulty changes, private asymmetric puzzles, hidden solutions, persistent discoveries, the ending and replay reset.

## Local version limitations

This build is local, not publicly hosted. Players on different networks need a hosted server or a separately configured secure tunnel; a room code alone does not connect networks. Voice chat is external. Rooms live in server memory and disappear on restart or after three hours of inactivity. Refreshing restores your session in the same tab. Leaving a screen disconnects the player; the captain can remove disconnected players in the lobby. During a mission, disconnected stations can rejoin; unresolved systems incur timeout damage. Fonts load from Google Fonts when available, with local fallbacks.

The server owns timers, answers, scoring and game progression. It sends each player only their own controls and assigned instructions. Room creation is intended for local trusted groups; public deployment should add rate limits and capacity controls first.
