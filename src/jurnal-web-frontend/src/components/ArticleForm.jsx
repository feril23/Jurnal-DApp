import React, { useState } from "react";

// Komponen ini menerima fungsi 'onFormSubmit' dan status 'loading' dari parent.
function ArticleForm({ onFormSubmit, loading }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [keywords, setKeywords] = useState("");

  const handleLocalSubmit = (e) => {
    e.preventDefault();
    if (!title || !file) {
      alert("Judul dan file tidak boleh kosong.");
      return;
    }
    // Panggil fungsi dari parent dengan data dari form ini
    onFormSubmit(title, file, keywords);

    // Reset form setelah submit
    setTitle("");
    setFile(null);
    setKeywords("");
    e.target.reset();
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg mb-10">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Submit Jurnal Baru
      </h1>
      <form onSubmit={handleLocalSubmit}>
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-gray-700 font-medium mb-2"
          >
            Judul Artikel
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Masukkan judul artikel Anda"
          />
        </div>
        <div className="mb-6">
          <label
            htmlFor="keywords"
            className="block text-gray-700 font-medium mb-2"
          >
            Keywords (pisahkan dengan koma)
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="contoh: fisika, kuantum, relativitas"
          />
        </div>
        <div className="mb-8">
          <label
            htmlFor="file"
            className="block text-gray-700 font-medium mb-2"
          >
            Upload File (PDF)
          </label>
          <input
            type="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition duration-300 disabled:bg-gray-400"
        >
          {loading ? "Processing..." : "Submit Artikel"}
        </button>
      </form>
    </div>
  );
}

export default ArticleForm;
