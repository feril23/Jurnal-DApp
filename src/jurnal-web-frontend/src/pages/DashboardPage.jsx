import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

// Impor semua komponen yang dibutuhkan untuk dashboard
import Profile from "../components/Profile";
import ArticleForm from "../components/ArticleForm";
import AuthorDashboard from "../components/AuthorDashboard";
import ReviewDashboard from "../components/ReviewDashboard";
import { uploadToIPFS } from "../utils/ipfs";
import toast from "react-hot-toast";

// Halaman ini menerima 'setSelectedArticle' untuk bisa membuka modal
function DashboardPage({
  setSelectedArticle,
  fetchMyArticles,
  fetchReviewTasks,
  loading,
  myArticles,
  reviewTasks,
}) {
  const { actor, isAuthenticated, principal } = useAuth();
  const [activeTab, setActiveTab] = useState("my_articles");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (title, file, keywordsString) => {
    if (!isAuthenticated || !actor) {
      alert("Harap login terlebih dahulu.");
      return;
    }

    setIsLoading(true);

    const toastId = toast.loading("1/3 - Mengupload file ke IPFS...");

    try {
      const contentHash = await uploadToIPFS(file);

      toast.loading(`2/3 - Menyimpan artikel...`, { id: toastId });
      const keywordsArray = keywordsString
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k);
      const submitResult = await actor.submitArticle(
        title,
        contentHash,
        keywordsArray
      );

      if ("err" in submitResult) throw new Error(submitResult.err);

      const submittedId = submitResult.ok;
      toast.loading(`3/3 - Mencari reviewer otomatis...`, { id: toastId });

      const assignResult = await actor.autoAssignReviewers(submittedId);
      if (assignResult.err) {
        toast.success(`Jurnal berhasil di submit`, { id: toastId });
      } else {
        toast.success("Artikel berhasil disubmit & ditugaskan!", {
          id: toastId,
        });
      }

      fetchMyArticles(); // Refresh daftar di latar belakang
    } catch (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (articleId, newStatus) => {
    await toast.promise(actor.updateArticleStatus(articleId, newStatus), {
      loading: "Memperbarui status...",
      success: (result) => {
        if ("ok" in result) {
          fetchMyArticles();
          return "Status berhasil diperbarui!";
        } else {
          throw new Error(result.err);
        }
      },
      error: (err) => `Gagal: ${err.message}`,
    });
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="w-full max-w-4xl mx-auto my-8">
        <Profile />
      </div>

      <div className="mt-8">
        <ArticleForm onFormSubmit={handleFormSubmit} isLoading={isLoading} />
      </div>

      {message && <p className="text-center my-6 ...">{message}</p>}

      <div className="w-full max-w-4xl mx-auto my-8 border-b border-gray-300 flex">
        <button
          onClick={() => setActiveTab("my_articles")}
          className={`py-2 px-6 font-semibold ${
            activeTab === "my_articles"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500"
          }`}
        >
          Artikel Saya
        </button>
        <button
          onClick={() => setActiveTab("my_reviews")}
          className={`py-2 px-6 font-semibold ${
            activeTab === "my_reviews"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500"
          }`}
        >
          Tugas Review Saya
        </button>
      </div>

      <div className="mt-8">
        {activeTab === "my_articles" && (
          <AuthorDashboard
            onStatusUpdate={handleStatusUpdate}
            onViewDetail={setSelectedArticle}
            fetchMyArticles={fetchMyArticles}
            loading={loading}
            myArticles={myArticles}
          />
        )}
        {activeTab === "my_reviews" && (
          <ReviewDashboard
            onStatusUpdate={handleStatusUpdate}
            onViewDetail={setSelectedArticle}
            fetchReviewTasks={fetchReviewTasks}
            loading={loading}
            reviewTasks={reviewTasks}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
