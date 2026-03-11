# ⚙️ harness - Define and Control AI Agents Easily

[![Download harness](https://img.shields.io/badge/Download-here-ff7f50?style=for-the-badge&logo=github&logoColor=white)](https://github.com/heba-ramdan/harness)

## 📥 Download & Install harness on Windows

Use the link below to visit the GitHub page where you can download the installer for Windows.

[Download harness on GitHub](https://github.com/heba-ramdan/harness)

---

## 🚀 Getting Started

harness lets you create AI agents using simple markdown files. You can control every part of the agent’s behavior with easy-to-edit text files. This tool runs directly on your Windows computer with a command-line interface that is easy to use.

To get started, you only need to download the software and set up your access credentials. This guide covers every step.

---

## 💻 System Requirements

- Windows 10 or newer (64-bit)
- At least 2 GB of free disk space
- Internet connection for downloading and API access
- Node.js version 22.x installed (required for harness to run)

---

## 🔧 What You Need Before Installing

harness requires Node.js, a tool that lets JavaScript programs run on your computer. This guide includes easy instructions for this.

You also need an API key or login credentials to authenticate harness. Two methods work:

- Claude Code login
- Anthropic API key

Instructions are below.

---

## 🔵 Step 1: Download and Install Node.js

Node.js must be installed before harness can work.

1. Open your browser and go to the official Node.js download page:  
   https://nodejs.org/en/download/

2. Download the Windows installer for the latest Node.js 22.x version.  
   
3. Run the installer and follow the steps. Choose the default options unless you know what you are doing.

4. Once installed, verify it works:  
   - Open Command Prompt by typing `cmd` in the Start menu.  
   - Type `node -v` and press Enter.  
   - You should see a version number starting with `v22`.  

---

## 🟠 Step 2: Download and Install harness

Now that you have Node.js:

1. Open Command Prompt again.

2. Type the command below and press Enter:  
   `npm install -g @mastersof-ai/harness`

3. Wait for the installation to finish. This will set up harness globally on your computer.

---

## 🗝️ Step 3: Set Up Authentication

Choose one of these two options to let harness access your AI service.

### Option 1: Claude Code Login

1. In the Command Prompt, type:  
   `npm install -g @anthropic-ai/claude-code`

2. Then enter:  
   `claude login`

3. Follow the instructions to log in with your Claude Code account. This will save your credentials locally.

### Option 2: Use Anthropic API Key

1. Get your API key from your Anthropic account or service provider.

2. Set the API key for your session by typing:  
   `set ANTHROPIC_API_KEY=your-api-key`

Replace `your-api-key` with the actual key.

---

## 📂 Step 4: Create Your Agent Identity

harness uses an `IDENTITY.md` file to define your agent’s personality and purpose.

1. Create a new folder anywhere on your computer.  
2. Inside that folder, create a new text file named `IDENTITY.md`.  
3. Write your agent’s description, instructions, and details in markdown format. This sets exactly how your agent behaves.

---

## ▶️ Step 5: Run Your Agent

1. Open Command Prompt.

2. Navigate to the folder where your `IDENTITY.md` file is. For example:  
   `cd C:\Users\YourName\Documents\YourAgentFolder`

3. Run the harness agent by typing:  
   `mastersof-ai`

This starts your agent with the exact context from your `IDENTITY.md` file and no hidden instructions.

---

## 🛠️ What harness Provides

- Persistent memory to remember past conversations
- Built-in tools and sub-agents you can control
- Sandboxing to safely test actions
- Terminal-based user interface for easy interaction

---

## 💡 Tips for Using harness

- Keep your `IDENTITY.md` file clear and specific. The agent will follow only what you write there.
- Use simple markdown to organize instructions and agent behavior.
- You can add tools by editing the configuration files if you want advanced control.
- Save your work often and back up your agent folder.

---

## 🌐 Useful Resources

- Node.js Official Site: https://nodejs.org/  
- Claude Code Package: https://www.npmjs.com/package/@anthropic-ai/claude-code  
- Anthropic API Documentation (for key setup): https://docs.anthropic.com/  

---

[![Download harness](https://img.shields.io/badge/Download-here-ff7f50?style=for-the-badge&logo=github&logoColor=white)](https://github.com/heba-ramdan/harness)