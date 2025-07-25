import React from "react";
import { Link } from "react-router-dom";

function ArticleItem({ article, onStatusUpdate, onViewDetail }) {
  const statusText = Object.keys(article.status)[0];

  // Objek untuk menentukan style badge berdasarkan status
  const statusStyles = {
    submitted: "bg-gray-500",
    in_review: "bg-yellow-500",
    accepted: "bg-green-500",
    rejected: "bg-red-500",
  };

  // Handler untuk tombol-tombol baru
  const handleAccept = () => {
    onStatusUpdate(article.id, { accepted: null });
  };

  const handleReject = () => {
    onStatusUpdate(article.id, { rejected: null });
  };

  return (
    <Link
      to={`/article/${article.id}`}
      className="block bg-white p-5 rounded-lg shadow-md transition-transform transform hover:scale-[1.02]"
    >
      <div className="flex justify-between items-start">
        {/* Informasi artikel */}
        <div>
          <h3 className="font-bold text-lg text-gray-900">{article.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            Author: {String(article.author).substring(0, 10)}...
          </p>
          {/* Badge status dengan warna dinamis */}
          <span
            className={`text-xs font-semibold text-white ${
              statusStyles[statusText] || "bg-gray-500"
            } px-2 py-0.5 rounded-full capitalize mt-2 inline-block`}
          >
            {statusText.replace("_", " ")}
          </span>
        </div>

        {/* Grup Tombol Aksi */}
        <div className="flex flex-col items-end space-y-2">
          {/* Tombol ini hanya muncul jika statusnya 'submitted' */}
          {statusText === "submitted" && (
            <button
              onClick={() => onStatusUpdate(article.id, { in_review: null })}
              className="bg-blue-500 text-white font-bold text-sm py-1 px-3 rounded-md hover:bg-blue-600 transition duration-200 w-28 text-center"
            >
              Start Review
            </button>
          )}

          {/* Tombol-tombol BARU ini hanya muncul jika statusnya 'in_review' */}
          {statusText === "in_review" && (
            <>
              <button
                onClick={handleAccept}
                className="bg-green-500 text-white font-bold text-sm py-1 px-3 rounded-md hover:bg-green-600 transition duration-200 w-28 text-center"
              >
                Accept
              </button>
              <button
                onClick={handleReject}
                className="bg-red-500 text-white font-bold text-sm py-1 px-3 rounded-md hover:bg-red-600 transition duration-200 w-28 text-center"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ArticleItem;
