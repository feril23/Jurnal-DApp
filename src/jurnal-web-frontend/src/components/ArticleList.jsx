import React, { useEffect, useState } from "react";
import ArticleItem from "./ArticleItem";
import { jurnal_web_backend } from "../../../declarations/jurnal-web-backend";

// Komponen ini menerima array 'articles' dan menampilkannya dalam bentuk daftar.
function ArticleList({ articles, onStatusUpdate, onViewDetail, setArticles }) {
  const [localVersion, setLocalVersion] = useState(0);

  useEffect(() => {
    const poll = setInterval(async () => {
      const remoteVersion = await jurnal_web_backend.getDataVersion();
      if (remoteVersion > localVersion) {
        console.log("Data berubah! Mengambil data baru...");
        const newArticles = await jurnal_web_backend.getAllArticles();
        setArticles(newArticles);
        setLocalVersion(remoteVersion);
      }
    }, 3000); // Polling setiap 3 detik

    // Cleanup interval saat komponen dilepas
    return () => clearInterval(poll);
  }, [localVersion]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Daftar Jurnal
      </h2>
      <div className="space-y-4">
        {articles.length > 0 ? (
          articles.map((article) => (
            // Teruskan prop 'onStatusUpdate' ke setiap ArticleItem
            <ArticleItem
              key={Number(article.id)}
              article={article}
              onStatusUpdate={onStatusUpdate}
              onViewDetail={onViewDetail}
            />
          ))
        ) : (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-gray-500">Belum ada artikel yang disubmit.</p>
          </div>
        )}
      </div>
    </div>
  );
}
export default ArticleList;
