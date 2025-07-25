import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ArticleActions from "../components/ArticleActions";

// Impor komponen yang akan kita gunakan kembali
import ArticleDetailModal from "../components/ArticleDetailModal"; // Kita akan "meminjam" UI dari modal
import ArticleMetadata from "../components/ArticleMetadata";

function ArticleDetailPage({
  reviewers,
  onAssignReviewer,
  onReviewSubmit,
  onPublish,
  onFinalize,
}) {
  const { actor } = useAuth();
  const { articleId } = useParams(); // Mengambil ID artikel dari URL
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArticleDetail = async () => {
    if (!actor || !articleId) return;
    try {
      const result = await actor.getArticle(BigInt(articleId));
      if (result.length > 0) setArticle(result[0]);
    } catch (error) {
      console.error("Gagal mengambil detail artikel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticleDetail();
  }, [actor, articleId]);

  const handleAction = async (actionPromise) => {
    await actionPromise;
    fetchArticleDetail();
  };

  if (isLoading) {
    return <div className="text-center py-20">Memuat detail artikel...</div>;
  }

  if (!article) {
    return <div className="text-center py-20">Artikel tidak ditemukan.</div>;
  }

  // --- Pratinjau PDF ---
  const ipfsGatewayUrl = "https://gateway.pinata.cloud/ipfs/";
  const fileUrl = ipfsGatewayUrl + article.contentHash;

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Pratinjau Jurnal */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md h-[85vh]">
          <iframe
            src={fileUrl}
            title={article.title}
            className="w-full h-full border-0 rounded-lg"
          />
        </div>

        {/* Kolom Kanan: Metadata & Aksi */}
        <div className="lg:col-span-1 space-y-8">
          <ArticleMetadata article={article} />
          <ArticleActions
            article={article}
            reviewers={reviewers}
            onAssignReviewer={(...args) =>
              handleAction(onAssignReviewer(...args))
            }
            onReviewSubmit={(...args) => handleAction(onReviewSubmit(...args))}
            onPublish={(...args) => handleAction(onPublish(...args))}
            onFinalize={(...args) => handleAction(onFinalize(...args))}
          />
        </div>
      </div>
    </div>
  );
}

export default ArticleDetailPage;
