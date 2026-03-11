# Musico Website & Dashboard

Musico is the next-generation platform for Discord automation, moderation, and AI intelligence. This repository contains the website, the interactive dashboard, and the backend infrastructure to manage the Musico Discord Bot.

> **Note:** This project and its README were made with the help of AI.

## Features

- **Gemini 2.0 AI Integration**: Ask questions naturally and get exceptionally smart responses natively in your Discord server.
- **High-Fidelity Audio**: Buffer-free streaming from multiple sources. Control playback entirely through interactive buttons and the web dashboard.
- **Advanced Moderation**: A smart rule engine that kicks spam, warns unruly users, filters regex-based banned words, and logs actions.
- **Deep Server Analytics**: Track your server's growth and command usage directly from the web dashboard.
- **Web Dashboard**: Control all aspects of your server settings, music player, and moderation from a beautiful web interface.

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: Discord OAuth2 integration via `express-session`
- **APIs**: Communication with the Discord API and bot interactions.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed
- Discord Application Client ID and Client Secret
- Requisite tokens for Gemini AI (if self-hosting)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Musicoweb
   ```

2. **Install dependencies:**
   Make sure you install the backend dependencies:
   ```bash
   npm run install
   ```

3. **Environment Setup:**
   Navigate to the `backend` directory and configure your `.env` file using the provided `.env.example`:
   ```bash
   cd backend
   cp .env.example .env
   ```
   Fill in your respective Discord credentials and API tokens.

4. **Running the application:**
   From the main directory, start the backend server:
   ```bash
   npm start
   ```
   *Note: This executes `node backend/server.js`.*

## Folder Structure

- `/` - Frontend files (`index.html`, `dashboard.html`, `style.css`, `script.js`, etc.)
- `/backend` - Express.js backend for handling Discord OAuth and API requests.

## License

This project is licensed under the MIT License.

## Acknowledgements

- Built with modern web design best practices.
- Icons by **Font Awesome**.
- Typography by **Google Fonts** (Inter).
- **Made with the help of AI.**
