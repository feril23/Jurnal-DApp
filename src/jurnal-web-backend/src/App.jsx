// File: src/App.jsx
import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext"; // <-- Gunakan hook kita

import ArticleForm from "./components/ArticleForm";
import ArticleList from "./components/ArticleList";
import ArticleDetailModal from "./components/ArticleDetailModal";
import Auth from "./components/Auth";
import Profile from "./components/Profile";
import { uploadToIPFS } from "./utils/ipfs";

function App() {
  // Ambil status login dan actor terotentikasi dari Context
  const { isAuthenticated, actor } = useAuth();
  const [reviewers, setReviewers] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const fetchArticles = async () => {
    if (!actor) return; // Jangan fetch jika actor belum siap
    try {
      const articlesList = await actor.getAllArticles();
      setArticles(articlesList.sort((a, b) => Number(b.id) - Number(a.id)));
    } catch (error) {
      console.error("Gagal mengambil daftar artikel:", error);
    }
  };

  const fetchReviewers = async () => {
    if (!actor) return;
    try {
      const reviewerList = await actor.getReviewers();
      setReviewers(reviewerList);
    } catch (error) {
      console.error("Gagal mengambil daftar reviewer:", error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchReviewers();
  }, [actor]); // Fetch ulang jika actor berubah (misal: setelah login)

  const handleAssignReviewer = async (articleId, reviewerPrincipal) => {
    if (!actor) return;
    setMessage(`Menugaskan reviewer ke artikel ID: ${articleId}...`);
    try {
      const result = await actor.assignReviewer(articleId, reviewerPrincipal);
      if ("ok" in result) {
        setMessage("Reviewer berhasil ditugaskan!");
        // Refresh daftar artikel untuk melihat data (status & reviewer) yang baru
        fetchArticles();
      } else {
        setMessage(`Error: ${result.err}`);
      }
    } catch (error) {
      console.error("Gagal menugaskan reviewer:", error);
      setMessage("Terjadi error saat menugaskan reviewer.");
    }
  };

  const handleFormSubmit = async (title, file, keywordsString) => {
    if (!isAuthenticated || !actor) {
      alert("Harap login terlebih dahulu.");
      return;
    }

    setLoading(true);

    // 1. Proses upload file (masih simulasi)
    setMessage("1/3 - Mengupload file ke IPFS...");
    const contentHash = await uploadToIPFS(file);

    // 2. Memproses keywords dari string menjadi array
    const keywordsArray = keywordsString
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);

    try {
      // 3. Submit artikel ke canister
      setMessage("2/3 - Menyimpan artikel...");
      const submitResult = await actor.submitArticle(
        title,
        contentHash,
        keywordsArray
      );

      if ("err" in submitResult) {
        throw new Error(submitResult.err);
      }

      const submittedId = submitResult.ok;
      setMessage(`3/3 - Artikel tersimpan (ID: ${submittedId}).`);

      fetchArticles(); // Refresh daftar artikel untuk melihat hasilnya
    } catch (error) {
      console.error("Gagal dalam proses submit:", error);
      setMessage(`Terjadi error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (articleId, newStatus) => {
    // ... (logika sama, tapi gunakan 'actor' dari context)
    const success = await actor.updateArticleStatus(articleId, newStatus);
    // ...
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 font-sans">
      <div className="container mx-auto px-4">
        <Auth />

        {isAuthenticated && (
          <>
            <div className="w-full max-w-4xl mx-auto my-8">
              <Profile />
            </div>
            <div className="mt-8">
              <ArticleForm
                backendActor={actor}
                onFormSubmit={handleFormSubmit}
                loading={loading}
              />
            </div>
          </>
        )}

        {message && <p className="text-center ...">{message}</p>}

        <div className="mt-8">
          <ArticleList
            articles={articles}
            onStatusUpdate={handleStatusUpdate}
            onViewDetail={setSelectedArticle}
            setArticles={setArticles}
          />
        </div>

        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          reviewers={reviewers}
          onAssignReviewer={handleAssignReviewer}
        />
      </div>
    </div>
  );
}

export default App;
