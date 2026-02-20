# Mission Control Dashboard

A Next.js 15 dashboard for managing OpenClaw AI agent teams, featuring real-time monitoring, Japan Villas guest management, and automated task scheduling.

## 🌟 Features

- **🎭 Virtual Office**: Real-time agent visualization and monitoring
- **🤖 Agents Overview**: Multi-agent system management (Jennie, Lisa, Rosé)
- **🏡 Japan Villas**: Guest messaging workflow with AI assistance
- **⏰ Cron Jobs**: Automated task scheduling and monitoring
- **📋 Activity Feed**: System activity tracking
- **💾 Memory Management**: Daily logs and briefings
- **📱 Responsive Design**: Mobile-friendly interface

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- OpenClaw installation and configuration
- Access to OpenClaw workspace directory

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sekaichi-dev/openclaw.git
cd openclaw
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local file
OPENCLAW_HOME=/path/to/.openclaw
OPENCLAW_WORKSPACE=/path/to/.openclaw/workspace
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### OpenClaw Integration

The dashboard integrates with OpenClaw by reading configuration and state files from your OpenClaw installation. Make sure to set the correct paths in your environment variables.

### Japan Villas Setup

For the Japan Villas functionality:

1. Ensure your OpenClaw workspace has the Japan Villas configuration
2. Configure property-specific settings and guidebook knowledge
3. Set up Lisa (Villa Concierge) agent with appropriate permissions

### Security Notes

- All sensitive data (WiFi passwords, access codes) has been redacted in this public repository
- Real property credentials should be configured via environment variables or secure configuration files
- Never commit actual guest data or property access information

## 📦 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## 🤖 Agent System

The dashboard supports multiple AI agents:

- **Jennie** (Main): Mission control and oversight
- **Lisa** (Villa Concierge): Guest communication and support  
- **Rosé** (Coding): Development and technical tasks

## 🏗️ Architecture

- **Frontend**: Next.js 15 with App Router
- **UI**: Tailwind CSS + shadcn/ui components
- **State**: Server-side integration with OpenClaw
- **Deployment**: Vercel with global CDN

## 🔒 Security

This repository has been sanitized for public use:

- Sensitive credentials have been redacted
- File paths use environment variables
- No real guest or property data included
- Production deployments should use secure configuration management

## 📄 License

This project is part of the OpenClaw ecosystem. Please refer to OpenClaw's licensing terms.

## 🤝 Contributing

This is a specialized dashboard for OpenClaw AI agent management. Contributions should align with OpenClaw's development practices and security requirements.