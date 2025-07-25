import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ArticleItem from "./ArticleItem"; // Kita gunakan kembali komponen yang sudah ada

function AuthorDashboard({
  onStatusUpdate,
  onViewDetail,
  loading,
  myArticles,
  fetchMyArticles,
}) {
  const { actor, principal } = useAuth();

  useEffect(() => {
    fetchMyArticles();
  }, [actor, principal]);

  if (loading) {
    return <p className="text-center text-gray-500">Memuat artikel Anda...</p>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Artikel Saya
      </h2>
      <div className="space-y-4">
        {myArticles.length > 0 ? (
          myArticles.map((article) => (
            <ArticleItem
              key={Number(article.id)}
              article={article}
              onStatusUpdate={onStatusUpdate}
              onViewDetail={onViewDetail}
            />
          ))
        ) : (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-500">
              Anda belum men-submit artikel apa pun.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthorDashboard;
