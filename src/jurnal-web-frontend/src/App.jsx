import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Impor komponen Layout & Halaman
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import PublishedPage from "./pages/PublishedPage";
import DashboardPage from "./pages/DashboardPage";
import ArticleDetailModal from "./components/ArticleDetailModal";
import toast, { Toaster } from "react-hot-toast";
import ArticleDetailPage from "./pages/ArticleDetailPage";

function App() {
  const { actor, principal } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myArticles, setMyArticles] = useState([]);
  const [reviewTasks, setReviewTasks] = useState([]);

  // State untuk Modal & data pendukungnya kita simpan di level tertinggi
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  // const [message, setMessage] = useState("");

  // Fungsi untuk mengambil daftar reviewer
  const fetchReviewers = async () => {
    if (!actor) return;
    try {
      const reviewerList = await actor.getAllProfiles();
      setReviewers(reviewerList);
    } catch (error) {
      console.error("Gagal mengambil daftar reviewer:", error);
    }
  };

  useEffect(() => {
    if (actor) fetchReviewers();
  }, [actor]);

  // Handler untuk aksi-aksi di dalam modal
  const handleAssignReviewer = async (articleId, reviewerPrincipal) => {
    if (!actor) return;
    await toast.promise(actor.assignReviewer(articleId, reviewerPrincipal), {
      loading: "Menugaskan reviewer...",
      success: (result) => {
        if ("ok" in result) {
          fetchMyArticles();
          fetchReviewTasks();
          return "Reviewer berhasil ditugaskan!";
        } else {
          throw new Error(result.err);
        }
      },
      error: (err) => `Gagal: ${err.message}`,
    });
  };

  const handleSubmitReview = async (articleId, decision, comments) => {
    if (!actor) return;
    const decisionVariant = { [decision]: null };
    await toast.promise(
      actor.submitReview(articleId, decisionVariant, comments),
      {
        loading: "Mengirim review...",
        success: (result) => {
          if ("ok" in result) {
            fetchMyArticles();
            fetchReviewTasks();
            setSelectedArticle(result.ok);
            return "Review berhasil dikirim!";
          } else {
            throw new Error(result.err);
          }
        },
        error: (err) => `Gagal: ${err.message}`,
      }
    );
  };

  const handlePublishArticle = async (articleId) => {
    if (!actor) return;
    await toast.promise(actor.publishArticle(articleId), {
      loading: "Mempublikasikan artikel...",
      success: (result) => {
        if ("ok" in result) {
          fetchMyArticles(); // Refresh data di latar belakang
          fetchReviewTasks();
          return "Artikel berhasil dipublikasikan!";
        } else {
          throw new Error(result.err);
        }
      },
      error: (err) => `Error: ${err.message}`,
    });
  };

  const fetchMyArticles = async () => {
    if (!actor || !principal) return;

    setLoading(true);
    try {
      // Panggil fungsi backend yang sudah Anda buat!
      const articles = await actor.getArticlesByAuthor(principal);
      setMyArticles(articles);
    } catch (error) {
      console.error("Gagal mengambil artikel saya:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewTasks = async () => {
    if (!actor || !principal) return;

    setLoading(true);
    try {
      // Panggil fungsi backend yang sudah Anda buat!
      const tasks = await actor.getArticlesToReview(principal);
      setReviewTasks(tasks);
    } catch (error) {
      console.error("Gagal mengambil tugas review:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeDecision = async (articleId) => {
    if (!actor) return;
    await toast.promise(actor.finalizeDecision(articleId), {
      loading: "Memfinalisasi keputusan...",
      success: (result) => {
        if ("ok" in result) {
          fetchMyArticles();
          fetchReviewTasks();
          setSelectedArticle(result.ok);
          return "Keputusan berhasil difinalisasi!";
        } else {
          throw new Error(result.err);
        }
      },
      error: (err) => `Gagal: ${err.message}`,
    });
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Toaster position="top-center" />
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/published"
              element={
                <PublishedPage setSelectedArticle={setSelectedArticle} />
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardPage
                  setSelectedArticle={setSelectedArticle}
                  loading={loading}
                  myArticles={myArticles}
                  reviewTasks={reviewTasks}
                  fetchMyArticles={fetchMyArticles}
                  fetchReviewTasks={fetchReviewTasks}
                />
              }
            />

            <Route
              path="/article/:articleId"
              element={
                <ArticleDetailPage
                  reviewers={reviewers}
                  onAssignReviewer={handleAssignReviewer}
                  onReviewSubmit={handleSubmitReview}
                  onPublish={handlePublishArticle}
                  onFinalize={handleFinalizeDecision}
                />
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
