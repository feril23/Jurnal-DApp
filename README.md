# Rejoul: A Decentralized Research Journal Platform 🚀

**Rejoul** is a full-stack scientific publishing platform built entirely on the **Internet Computer**. This project is designed to revolutionize the academic world by introducing transparency, immutability, and incentives powered by blockchain technology.

The platform automates the entire publication lifecycle, from an author's initial submission and automated peer-review matching, to on-chain rewards and permanent, decentralized publication.

---

## ✨ Key Features

Rejoul implements a complete, autonomous workflow with the following features:

* **Decentralized Authentication**: Full integration with **Internet Identity** for secure and anonymous user management.
* **Permanent File Storage**: Journal files are uploaded and permanently stored on **IPFS (InterPlanetary File System)** via the Pinata service.
* **On-Chain User Profiles**: Users can register profiles as authors or reviewers, complete with their name and field of expertise.
* **Article Submission Workflow**: Authors can submit articles with essential metadata, including a title and keywords for matchmaking.
* **Automated Reviewer Assignment**: A smart contract scoring algorithm automatically assigns the most relevant reviewers based on a combination of matching **expertise** and current **workload**.
* **On-Chain Peer Review System**: Assigned reviewers can submit their decisions (`Accept`, `Reject`, `Revise`) along with comments. All reviews are recorded transparently.
* **Automated Decision & Publication**: The system automatically finalizes an article's status to `Accepted` or `Rejected` based on the collected peer reviews and allows the author to publish accepted articles.
* **Reputation & Notification System**: Reviewers earn reputation points for each completed review, and all users receive on-chain notifications for important events.
* **Personalized Dashboards**: Separate dashboard views for Authors (to track their submissions) and Reviewers (to manage their review queue).
* **Professional Multi-Page Architecture**: The frontend is built with React and features a modern multi-page structure using `react-router-dom` and centralized state management with `React Context`.

---

## 📚 Technology Stack

This project is built using a modern Web3 stack on the Internet Computer ecosystem.

| Category         | Technology            | Description                                                                  |
| :--------------- | :-------------------- | :--------------------------------------------------------------------------- |
| **Blockchain** | Internet Computer (ICP) | The primary platform for hosting smart contracts (canisters) and web assets. |
| **Backend** | Motoko                | A robust and type-safe programming language designed specifically for ICP.     |
| **Tooling** | `dfx`, `mops`         | The DFX SDK for development and Mops for Motoko package management.            |
| **Frontend** | React.js, Vite        | A modern UI library with a high-performance build tool.                      |
| **Styling** | Tailwind CSS          | A utility-first CSS framework for rapid and responsive design.                 |
| **Routing** | `react-router-dom`    | The standard library for multi-page navigation in React.                     |
| **Authentication** | Internet Identity     | DFINITY's secure and decentralized login system.                             |
| **File Storage** | IPFS & Pinata         | A distributed file system for permanent content storage and pinning.         |

---

## ⚙️ Getting Started: Local Configuration

Follow these steps to get the project running on your local development environment.

### Prerequisites
Ensure you have the following installed:
* [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (version 0.15.0 or newer)
* [Node.js](https://nodejs.org/en/) (version 16.x or newer)

### Installation Steps

1.  **Clone the Repository**
    ```bash
    git clone [YOUR_REPOSITORY_URL]
    cd [PROJECT_FOLDER_NAME]
    ```

2.  **Install Dependencies**
    This project uses `npm workspaces`. Install all dependencies from the root directory.
    ```bash
    npm install
    ```

3.  **Configure Environment Variables (API Keys)**
    The IPFS file upload functionality requires an API Key from Pinata.

    * Create a free account at [pinata.cloud](https://pinata.cloud/).
    * Create a new API Key.
    * Create a new file named `.env.local` inside the frontend directory: `src/jurnal_final_frontend/`.
    * Fill the file with your keys:
        ```
        VITE_PINATA_API_KEY=YOUR_PINATA_KEY_HERE
        VITE_PINATA_SECRET_API_KEY=YOUR_PINATA_SECRET_HERE
        ```

4.  **Run the Local Replica and Deploy**
    * Open a new terminal window, navigate to the project root, and start the local network:
        ```bash
        dfx start --background --clean
        ```
    * In your original terminal, deploy the canisters:
        ```bash
        dfx deploy
        ```

5.  **Access the Application**
    After deployment, the terminal will output the URL for your frontend canister. Copy this URL and open it in your browser. It will look something like this: `http://127.0.0.1:4943/?canisterId=...`

    **Important:** You must use the canister URL provided by `dfx` (not `localhost:3000`) for the Internet Identity integration to function correctly.

---

## 📜 License

This project is distributed under the MIT License. See the `LICENSE` file for more details.
