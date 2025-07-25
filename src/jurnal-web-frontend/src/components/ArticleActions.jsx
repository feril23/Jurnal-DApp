import React, { useState } from "react";
import { Principal } from "@dfinity/principal";
import { useAuth } from "../context/AuthContext";

// Komponen ini menerima semua data dan fungsi yang dibutuhkan
function ArticleActions({
  article,
  reviewers,
  onAssignReviewer,
  onReviewSubmit,
  onPublish,
  onFinalize,
}) {
  const { principal: currentUserPrincipal } = useAuth();
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [decision, setDecision] = useState("accept");
  const [comments, setComments] = useState("");

  if (!article) return null;

  // Logika untuk menentukan aksi apa yang bisa dilakukan oleh user saat ini
  const isAuthor = currentUserPrincipal
    ? article.author.toText() === currentUserPrincipal.toText()
    : false;
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
  const statusText = Object.keys(article.status)[0];

  const canSubmitReview =
    isReviewer && !hasReviewed && statusText === "in_review";
  const canFinalize = isAuthor && statusText === "pending_final_decision";
  const canPublish = isAuthor && statusText === "accepted";

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

  // Handlers
  const handleAssignClick = () => {
    /* ... (Salin dari ArticleDetailModal lama) ... */
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Bagian Hasil Review */}
      <section>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Hasil Review Hasil Review
        </h3>
        {article.reviews && article.reviews.length > 0 ? (
          <div className="space-y-4">
            {article.reviews.map((review, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-center">
                  <p className="font-bold capitalize">
                    {Object.keys(review.decision)[0]}
                  </p>
                  <p className="text-xs text-gray-500">
                    by{" "}
                    <span className="font-medium">
                      {getReviewerName(review.reviewer)}
                    </span>
                  </p>
                </div>
                <p className="text-gray-700 mt-2 italic border-l-4 pl-3">
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

      {/* Bagian Aksi (Kondisional) */}
      <section className="bg-gray-50 rounded-lg p-6 space-y-6">
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
        <div>
          {" "}
          {/* Manajemen Reviewer */}
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Manajemen Reviewer
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
    </div>
  );
}

export default ArticleActions;
