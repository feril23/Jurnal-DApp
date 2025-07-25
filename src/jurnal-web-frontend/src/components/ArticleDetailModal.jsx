import React, { useState } from "react";
import { Principal } from "@dfinity/principal";

// Komponen Ikon sederhana untuk kejelasan (bisa diletakkan di file terpisah)
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path fillRule="evenodd" d={path} clipRule="evenodd" />
  </svg>
);

// --- Komponen Utama ---
function ArticleDetailModal({
  article,
  onClose,
  onPublish,
  reviewers,
  onAssignReviewer,
  onReviewSubmit,
  currentUserPrincipal,
  onFinalize,
}) {
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [decision, setDecision] = useState("accept");
  const [comments, setComments] = useState("");
  const isAuthor =
    currentUserPrincipal && article?.author // <-- Cek apakah keduanya ada
      ? article.author.toText() === currentUserPrincipal.toText()
      : false;
  const canPublish = isAuthor && Object.keys(article.status)[0] === "accepted";

  if (!article) return null;

  // --- Logika & State (Tidak Berubah) ---
  const isReviewer = currentUserPrincipal
    ? article.reviewers.some(
        (p) => p.toText() === currentUserPrincipal.toText()
      )
    : false;

  const hasReviewed = currentUserPrincipal
    ? article.reviews.some(
        (r) => r.reviewer.toText() === currentUserPrincipal.toText()
      )
    : false;

  const canSubmitReview =
    isReviewer &&
    !hasReviewed &&
    Object.keys(article.status)[0] === "in_review";

  const statusText = Object.keys(article.status)[0];

  const statusInfo = {
    submitted: { text: "Submitted", color: "bg-gray-500" },
    in_review: { text: "In Review", color: "bg-yellow-500" },
    pending_final_decision: {
      text: "Pending Final Decision",
      color: "bg-blue-500",
    },
    accepted: { text: "Accepted", color: "bg-green-500" },
    rejected: { text: "Rejected", color: "bg-red-500" },
    published: { text: "Published", color: "bg-purple-600" },
  };

  const canFinalize = isAuthor && statusText === "pending_final_decision";

  const currentStatus = statusInfo[statusText] || statusInfo.submitted;

  // --- Handlers (Tidak Berubah) ---
  const handleAssignClick = () => {
    if (!selectedReviewer) {
      alert("Pilih seorang reviewer terlebih dahulu.");
      return;
    }
    const reviewerPrincipal = Principal.fromText(selectedReviewer);
    onAssignReviewer(article.id, reviewerPrincipal);
    setSelectedReviewer("");
  };

  const handleLocalReviewSubmit = (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      alert("Komentar tidak boleh kosong.");
      return;
    }
    onReviewSubmit(article.id, decision, comments);
    setComments("");
  };

  const getReviewerName = (principal) => {
    const principalText = principal.toText();
    const reviewerProfile = reviewers.find(
      (r) => r.principal.toText() === principalText
    );
    return reviewerProfile
      ? reviewerProfile.name
      : principalText.substring(0, 10) + "...";
  };

  // --- Render JSX ---
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Detail Artikel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <Icon path="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="overflow-y-auto p-6 space-y-8">
          {/* Bagian Detail Artikel */}
          <section>
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {article.title}
              </h3>
              <span
                className={`text-xs font-semibold text-white ${currentStatus.color} px-3 py-1 rounded-full`}
              >
                {currentStatus.text}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-3">
                <Icon
                  path="M10 9a3 3 0 100-6 3 3 0 000 6zM10 12a6 6 0 00-6 6h12a6 6 0 00-6-6z"
                  className="text-gray-400 w-5 h-5 flex-shrink-0"
                />
                <span>
                  <strong>Author:</strong>{" "}
                  <span className="font-mono text-xs bg-gray-100 p-1 rounded">
                    {String(article.author)}
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Icon
                  path="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5H10.75V5z"
                  className="text-gray-400 w-5 h-5 flex-shrink-0"
                />
                <span>
                  <strong>Submitted:</strong>{" "}
                  {new Date(
                    Number(article.submissionTime) / 1000000
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex items-start space-x-3 col-span-1 md:col-span-2">
                <Icon
                  path="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                  className="text-gray-400 w-5 h-5 flex-shrink-0 mt-0.5"
                />
                <p>
                  <strong>IPFS Hash:</strong>{" "}
                  <span className="font-mono text-xs break-all">
                    {article.contentHash}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <hr />

          {/* Bagian Hasil Review */}
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Hasil Review
            </h3>
            {article.reviews && article.reviews.length > 0 ? (
              <div className="space-y-4">
                {article.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-bold capitalize text-gray-800">
                        {Object.keys(review.decision)[0].replace("_", " ")}
                      </p>
                      <p className="text-xs text-gray-500">
                        by{" "}
                        <span className="font-medium">
                          {getReviewerName(review.reviewer)}
                        </span>
                      </p>
                    </div>
                    <p className="text-gray-700 mt-2 italic border-l-4 border-gray-300 pl-3">
                      "{review.comments}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-md">
                Belum ada review yang masuk.
              </p>
            )}
          </section>

          <hr />

          {/* Bagian Aksi (Submit & Manajemen) */}
          <section className="bg-gray-50 rounded-lg p-6 space-y-6">
            {/* Form Submit Review (Kondisional) */}
            {canSubmitReview && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Submit Your Review
                </h3>
                <form onSubmit={handleLocalReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Decision
                    </label>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="accept">Accept</option>
                      <option value="reject">Reject</option>
                      <option value="revise">Request Revisions</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Comments
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows="4"
                      placeholder="Provide your constructive feedback here..."
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Kirim Review
                  </button>
                </form>
              </div>
            )}

            {/* Manajemen Reviewer */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Reviewer Management
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Assigned Reviewers:
                  </h4>
                  {article.reviewers && article.reviewers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {article.reviewers.map((reviewerPrincipal) => (
                        <span
                          key={reviewerPrincipal.toText()}
                          className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
                        >
                          {getReviewerName(reviewerPrincipal)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Belum ada reviewer yang ditugaskan.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {canFinalize && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Aksi Penulis
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Proses review telah selesai. Silakan lihat hasilnya di atas dan
                lakukan finalisasi untuk mengunci status artikel ini.
              </p>
              <button
                onClick={() => onFinalize(article.id)}
                className="w-full justify-center py-2 px-4 border rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Finalisasi Keputusan
              </button>
            </div>
          )}

          {canPublish && (
            <button
              onClick={() => onPublish(article.id)}
              className="mt-6 w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
            >
              Publish Artikel Ini
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticleDetailModal;
