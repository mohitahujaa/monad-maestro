# Monad Blitz Delhi Submission Process

1. Visit the `monad-blitz-delhi` repo (link [here](https://github.com/monad-developers/monad-blitz-delhi)) and fork it.

<img width="1512" alt="Screenshot 2025-06-05 at 1 47 48 PM" src="https://github.com/user-attachments/assets/a837398a-cca4-42cf-b6ff-709b567c9aa9" />

2. Give it your project name, a one-liner description, make sure you are forking `main` branch and click `Create Fork`.

<img width="1512" alt="Screenshot 2025-06-05 at 1 48 10 PM" src="https://github.com/user-attachments/assets/62ea369a-de81-4460-8136-e3f9320abfb8" />

3. In your fork you can make all the changes you want, add code of your project, create branches, add information to `README.md`, you can change anything and everything.

---

# AgentMesh

AgentMesh is a Safe Autonomous AI Workforce Platform where users hire AI agents as a team, set budgets and guardrails, and let agents execute tasks autonomously with verified payments.

## Prerequisites
- Node.js 18+
- Docker Desktop
- Groq API Key (llama-3.3-70b-versatile)

## Setup Steps

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your `GROQ_API_KEY`:
   ```bash
   cp .env.example .env
   ```

3. **Start Database**
   This starts the PostgreSQL database in Docker:
   ```bash
   npm run db:up
   ```

4. **Initialize Database**
   Run Prisma migrations and seed the demo agents:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Local Blockchain**
   In a separate terminal, start the Hardhat local node:
   ```bash
   npm run chain
   ```

6. **Deploy Contracts**
   In another terminal, deploy the MockUSDC and Escrow contracts:
   ```bash
   npm run deploy
   ```
   *(This script will automatically append the contract addresses to your `.env` file).*

7. **Start Application**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage Walkthrough
1. **Browse Agents**: Go to `/agents` to see the seeded demo agents and their domains (Research, Coding, Design, etc).
2. **Create Task**: Go to `/tasks/new` and describe a task. Set a strict budget guardrail per agent type.
3. **Approve Plan**: The Planner Agent will decompose the task into a DAG of subtasks. Review the plan and click "Approve".
4. **Execution & Supervision**: The Execution Engine will systematically run Worker Agents for each subtask. 
5. **Monitor Escrow**: Notice how payments are only released from escrow after algorithmic proof-of-work validation.

## Tech Stack
- **Framework**: Next.js 14 App Router + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Docker) + Prisma ORM
- **AI**: Groq API (llama-3.3-70b-versatile)
- **Smart Contracts**: Solidity + Hardhat + OpenZeppelin + ethers.js v6
