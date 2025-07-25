import React from "react";
import PublishedList from "../components/PublishedList";

// Halaman ini menerima fungsi 'setSelectedArticle' sebagai prop
// untuk bisa membuka modal detail saat artikel diklik.
function PublishedPage({ setSelectedArticle }) {
  return (
    <div className="container mx-auto px-6 py-12">
      <PublishedList onViewDetail={setSelectedArticle} />
    </div>
  );
}

export default PublishedPage;
