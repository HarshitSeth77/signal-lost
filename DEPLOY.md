# Public hosting

The game requires a continuously running Node web service, not static hosting. The included Render Blueprint creates one free web service. Connect this private repository in your Render account and create a Blueprint from `render.yaml`. No secrets or database setup are required.

After Render reports Live, use its assigned HTTPS URL to create a room and join from another device. Keep the same single service instance: rooms currently live in memory. Deploys, server restarts and free-service shutdowns clear rooms. This version uses external voice chat.

The GitHub repository can stay private while the game URL is public. Do not publish credentials or local `.env` files.

For long-term production use, add persistent room storage and resource/rate limits. No paid hosting resources are configured by this Blueprint.
