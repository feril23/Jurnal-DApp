import React, { useState, useEffect } from "react";
// Impor actor dasar (unauthenticated) karena data ini publik
import { jurnal_web_backend } from "../../../declarations/jurnal-web-backend";
import ArticleItem from "./ArticleItem";

// Komponen ini tidak perlu banyak props karena ia mengambil datanya sendiri
function PublishedList({ onViewDetail }) {
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const articles = await jurnal_web_backend.getPublishedArticles();
        setPublishedArticles(articles);
      } catch (error) {
        console.error("Gagal mengambil artikel terbit:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublished();
  }, []);

  if (isLoading) {
    return (
      <p className="text-center text-gray-500">
        Memuat artikel yang dipublikasikan...
      </p>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Artikel Terpublikasi
      </h2>
      <div className="space-y-4">
        {publishedArticles.length > 0 ? (
          publishedArticles.map((article) => (
            // Kita tidak perlu onStatusUpdate di sini karena statusnya sudah final
            <ArticleItem
              key={Number(article.id)}
              article={article}
              onViewDetail={onViewDetail}
            />
          ))
        ) : (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-500">
              Belum ada artikel yang dipublikasikan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublishedList;
