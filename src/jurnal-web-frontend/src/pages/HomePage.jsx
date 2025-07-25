import React from "react";
import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Masa Depan Publikasi Ilmiah yang Terdesentralisasi.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          JurnalChain membawa transparansi, imutabilitas, dan insentif ke dalam
          dunia riset melalui teknologi blockchain.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/published"
            className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-indigo-700 transition duration-300"
          >
            Telusuri Jurnal
          </Link>
          <Link
            to="/dashboard"
            className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-full text-lg border-2 border-indigo-200 hover:bg-indigo-50 transition duration-300"
          >
            Submit Artikel
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
