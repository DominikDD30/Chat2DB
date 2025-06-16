# Chat2DB <img src="frontend/public/icon.svg" alt="Chat2db Logo" width="40">

> **An interactive tool combining the power of LLMs with live ER diagram editing.**

🔗 **Live demo:** [https://chat2db.netlify.app](https://chat2db.netlify.app)


## What is it?

**Chat2DB** is a web application that enables users to **generate and modify database schemas using natural language**. It features an AI chat interface powered by GPT, real-time ER diagram visualization, and SQL export functionality.

![Chat2db](https://github.com/user-attachments/assets/62191ccd-555c-4af9-80bb-a553d1a5d20d)




Key features:
- 🧠 LLM-powered natural language interface
- 🛠️ Live ER diagram editing and visualization
- ✅ Schema validation
- 📤 One-click SQL export 
- 💬 Conversation-based schema generation

---

## 🚀 Tech Stack

### Backend 
- **Python**, **FastAPI**
- Deployed as **AWS Lambda**
- API endpoints: `/generate/schema`, `/generate/dbsql`
- Default LLM model **OpenAI GPT-4.1-mini**
- **Supports two modes**:
  - `remote` mode using **OpenAI API** (production)
  - `local` mode using **Ollama** for offline use (development/testing)



### Frontend
- **React + TypeScript**
- **TailwindCSS** for modern UI
- Responsive and interactive schema editor
- Built-in schema validation and live chat panel


### ☁️ Infrastructure
- **AWS CloudFormation** (DynamoDB, Lambda, API Gateway, S3)
- **GitHub Actions** for CI/CD


---

## ⚙️ Deployment

Both the frontend and backend are continuously deployed from this monorepo:
- 🟦 **Frontend** → Netlify via GitHub Actions
- 🟨 **Backend** → AWS Lambda via GitHub Actions & CloudFormation

