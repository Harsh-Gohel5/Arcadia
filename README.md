# 🌐 Arcadia - Real-Time Distributed Chat System

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)


**Arcadia** is a full-stack, real-time messaging platform inspired by Discord. It features a scalable microservices-ready architecture with persistent cloud storage, live presence tracking, and a modern, responsive UI.

## 🚀 Features

* **⚡ Real-Time Messaging:** Instant, low-latency communication using WebSockets (STOMP protocol).
* **☁️ Cloud Persistence:** All chat history is securely stored in an **AWS RDS PostgreSQL** database.
* **👥 Live Presence System:** Real-time "Online Users" sidebar that syncs across all active clients instantly.
* **💬 Typing Indicators:** Ephemeral "User is typing..." signals broadcasted via ephemeral WebSocket events (not stored in DB).
* **🎨 Modern UI:** Sleek "Deep Obsidian" dark mode built with **Tailwind CSS**.
* **📝 Rich Text Support:** Full Markdown support including **bold**, *italic*, and `code blocks`.
* **🔐 Secure Architecture:** Spring Security configuration with CORS policy management.

## 🛠️ Tech Stack

### **Backend (The Brain)**
* **Framework:** Java Spring Boot 3
* **Language:** Java 21
* **Database:** PostgreSQL (Hosted on AWS RDS)
* **Real-Time:** Spring WebSocket (STOMP)
* **Build Tool:** Maven

### **Frontend (The Face)**
* **Framework:** Next.js 15 (React 19)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **State Management:** React Hooks (`useState`, `useEffect`)
* **Libraries:** `sockjs-client`, `stompjs`, `react-markdown`

---

## Architecture

The application follows a distributed client-server architecture:

1.  **Client:** The Next.js app establishes a dual connection:
    * **HTTP (REST):** To authenticate and fetch historical chat data.
    * **WebSocket:** To maintain a live, bi-directional tunnel for events (`CHAT`, `JOIN`, `TYPING`).
2.  **Server:** The Spring Boot backend acts as the event broker and persistence manager.
3.  **Database:** AWS RDS stores the permanent record of all `CHAT` messages.

---
