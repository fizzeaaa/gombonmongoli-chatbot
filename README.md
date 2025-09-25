# 🤖 Gombonmongoli Chatbot

An AI-powered evolving chatbot with roasting capabilities that grows more sophisticated through community interactions.

## 🚀 Live Demo

Visit the live chatbot at: `[Your deployed URL will go here]`

## 🛠️ Local Development

1. Clone the repository
2. Install dependencies: `npm run install-deps`
3. Start the server: `npm start`
4. Visit `http://localhost:3000`

## 📦 Deployment Options

### Option 1: Render (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/gombonmongoli-chatbot.git
   git push -u origin main
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - Create account and connect GitHub
   - Create "New Web Service"
   - Select your repository
   - Use these settings:
     - **Build Command:** `npm run install-deps`
     - **Start Command:** `npm start`
     - **Environment:** Node
     - **Plan:** Free
   - Deploy!

### Option 2: Railway

1. Push to GitHub (same as above)
2. Go to [railway.app](https://railway.app)
3. Connect GitHub and select your repo
4. Railway will auto-detect and deploy

### Option 3: Heroku

1. Install Heroku CLI
2. ```bash
   heroku create your-chatbot-name
   git push heroku main
   ```

## 🔧 Environment Variables

For production, set these environment variables:
- `NODE_ENV=production`
- `PORT=3000` (or let the platform set it)

## 📁 Project Structure

```
chatbot/
├── backend/           # Node.js/Express server
│   ├── data/         # JSON data files
│   ├── models/       # Data models
│   ├── routes/       # API routes
│   └── utils/        # Helper functions
├── frontend/         # Static HTML/CSS/JS
│   ├── components/   # Reusable components
│   ├── css/         # Stylesheets
│   └── js/          # Client-side JavaScript
└── config/          # Configuration files
```

## 🎯 Features

- 🔥 AI-powered roasting chatbot
- 📈 Evolution system that grows with interactions
- 💭 Memory system for personalized responses
- 🌍 Community features and shared experiences
- 🎨 Dynamic UI with stage-based theming

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request