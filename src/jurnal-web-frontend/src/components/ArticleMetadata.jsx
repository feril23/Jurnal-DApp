import React from "react";

// Komponen Ikon sederhana
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

function ArticleMetadata({ article }) {
  if (!article) return null;

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
  const currentStatus = statusInfo[statusText] || statusInfo.submitted;
  const fileUrl = `https://gateway.pinata.cloud/ipfs/${article.contentHash}`;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      {/* Judul dan Status */}
      <div>
        <span
          className={`text-xs font-semibold text-white ${currentStatus.color} px-3 py-1 rounded-full`}
        >
          {currentStatus.text}
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          {article.title}
        </h1>
      </div>

      {/* Detail Metadata */}
      <div className="space-y-4 text-sm text-gray-600 border-t pt-4">
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
        <div className="flex items-start space-x-3">
          <Icon
            path="M9.594 3.94c.09-.542.56-.94 1.11-.94h.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l.593 1.028a1.125 1.125 0 01-.49 1.37l-1.028.593a1.125 1.125 0 00-.124 1.075.61.61 0 01-.127.22c-.184.332-.496.582-.87.645l-1.28.213a1.125 1.125 0 01-1.11.94h-.593a1.125 1.125 0 01-1.11-.94l-.213-1.28c-.063-.375-.313-.686-.645-.87a.61.61 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-.593-1.028a1.125 1.125 0 01.49-1.37l1.028-.593a1.125 1.125 0 00.124-1.075.61.61 0 01.127-.22c.184-.332.496-.582.87-.645l1.28-.213a1.125 1.125 0 011.11-.94zM10 13a3 3 0 100-6 3 3 0 000 6z"
            className="text-gray-400 w-5 h-5 flex-shrink-0 mt-0.5"
          />
          <p>
            <strong>Keywords:</strong>
            <span className="flex flex-wrap gap-2 mt-1">
              {article.keywords.map((kw) => (
                <span
                  key={kw}
                  className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </span>
          </p>
        </div>
      </div>

      {/* Link IPFS */}
      <div className="border-t pt-4">
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block text-center text-sm text-white bg-gray-700 font-semibold py-2 px-3 rounded-md hover:bg-gray-800 transition"
        >
          Lihat File di IPFS ↗
        </a>
      </div>
    </div>
  );
}

export default ArticleMetadata;
