import React, { useState } from "react";
import { Principal } from "@dfinity/principal";

function ArticleDetailModal({ article, onClose, reviewers, onAssignReviewer }) {
  const [selectedReviewer, setSelectedReviewer] = useState("");
  if (!article) return null;

  const statusText = Object.keys(article.status)[0];
  const statusStyles = {
    submitted: "bg-gray-500",
    in_review: "bg-yellow-500",
    accepted: "bg-green-500",
    rejected: "bg-red-500",
  };

  const handleAssignClick = () => {
    if (!selectedReviewer) {
      alert("Pilih seorang reviewer terlebih dahulu.");
      return;
    }
    const reviewerPrincipal = Principal.fromText(selectedReviewer);
    onAssignReviewer(article.id, reviewerPrincipal);
    setSelectedReviewer(""); // Reset dropdown setelah assign
  };

  // Mencari nama reviewer dari daftar 'reviewers' berdasarkan Principal
  const getReviewerName = (principal) => {
    const principalText = principal.toText();
    const reviewerProfile = reviewers.find(
      (r) => r.principal.toText() === principalText
    );
    return reviewerProfile
      ? reviewerProfile.name
      : principalText.substring(0, 10) + "...";
  };

  return (
    // Latar belakang gelap transparan
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      {/* Konten Modal */}
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Detail Artikel</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-bold text-lg">{article.title}</h3>
            <span
              className={`text-xs font-semibold text-white ${
                statusStyles[statusText] || "bg-gray-500"
              } px-2 py-0.5 rounded-full capitalize mt-1 inline-block`}
            >
              {statusText.replace("_", " ")}
            </span>
          </div>
          <p>
            <strong className="font-medium">Author:</strong>{" "}
            <span className="font-mono text-sm">{String(article.author)}</span>
          </p>
          <p>
            <strong className="font-medium">Submission Time:</strong>{" "}
            {new Date(
              Number(article.submissionTime) / 1000000
            ).toLocaleString()}
          </p>
          <p>
            <strong className="font-medium">IPFS Content Hash:</strong>{" "}
            <span className="font-mono text-sm break-all">
              {article.contentHash}
            </span>
          </p>
        </div>

        {/* --- BAGIAN BARU: MANAJEMEN REVIEWER --- */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">
            Manajemen Reviewer
          </h3>

          {/* Daftar reviewer yang sudah ditugaskan */}
          <div className="mb-4">
            <h4 className="font-bold mb-2">Reviewer Ditugaskan:</h4>
            {article.reviewers && article.reviewers.length > 0 ? (
              <ul className="list-disc list-inside bg-gray-50 p-3 rounded-md">
                {article.reviewers.map((reviewerPrincipal) => (
                  <li
                    key={reviewerPrincipal.toText()}
                    className="font-mono text-sm"
                  >
                    {getReviewerName(reviewerPrincipal)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada reviewer yang ditugaskan.
              </p>
            )}
          </div>

          {/* Form untuk menugaskan reviewer baru */}
          <div>
            <h4 className="font-bold mb-2">Tugaskan Reviewer Baru:</h4>
            <div className="flex space-x-2">
              <select
                value={selectedReviewer}
                onChange={(e) => setSelectedReviewer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              >
                <option value="">-- Pilih Reviewer --</option>
                {reviewers.map((rev) => (
                  <option
                    key={rev.principal.toText()}
                    value={rev.principal.toText()}
                  >
                    {rev.name} ({rev.expertise})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignClick}
                className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-600 transition whitespace-nowrap"
              >
                Assign
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-300"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default ArticleDetailModal;
