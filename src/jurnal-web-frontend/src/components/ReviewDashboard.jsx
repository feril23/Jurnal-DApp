import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ArticleItem from "./ArticleItem"; // Kita gunakan kembali komponen yang sudah ada

function ReviewDashboard({
  onStatusUpdate,
  onViewDetail,
  loading,
  fetchReviewTasks,
  reviewTasks,
}) {
  const { actor, principal } = useAuth();

  useEffect(() => {
    fetchReviewTasks();
  }, [actor, principal]); // Jalankan ulang jika user login/logout

  if (loading) {
    return (
      <p className="text-center text-gray-500">Memuat tugas review Anda...</p>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Tugas Review Saya
      </h2>
      <div className="space-y-4">
        {reviewTasks.length > 0 ? (
          reviewTasks.map((article) => (
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
              Anda tidak memiliki tugas review saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewDashboard;
