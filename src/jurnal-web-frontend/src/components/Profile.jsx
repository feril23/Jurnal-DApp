import React, { useEffect, useState } from "react";
import { jurnal_web_backend } from "../../../declarations/jurnal-web-backend";
import { useAuth } from "../context/AuthContext";

// Komponen ini menerima Principal pengguna yang login sebagai prop
function Profile() {
  const { principal, actor } = useAuth(); // Ambil principal & actor dari context
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // ... (state lainnya tidak berubah)
  const [name, setName] = useState("");
  const [expertise, setExpertise] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkProfile = async () => {
      if (!principal || !actor) {
        // Pastikan principal dan actor sudah siap
        setIsLoading(false);
        setProfile(null);
        return;
      }
      setIsLoading(true);
      try {
        const userProfile = await actor.getProfile(principal);
        if (userProfile && userProfile.length > 0) {
          setProfile(userProfile[0]);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Gagal memeriksa profil:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkProfile();
  }, [principal, actor]); // Jalankan ulang jika principal atau actor berubah

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("Mendaftarkan profil...");
    // Gunakan actor dari context
    const result = await actor.registerProfile(name, expertise, 0);
    if ("ok" in result) {
      setProfile(result.ok);
      setMessage("Profil berhasil dibuat!");
    } else {
      setMessage(`Error: ${result.err}`);
    }
  };

  if (!principal) {
    // Jangan tampilkan apapun jika user belum login
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md text-center text-gray-500">
        Loading profile...
      </div>
    );
  }

  console.log(profile);

  if (profile) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Profil Anda</h3>
          {/* --- TAMPILAN REPUTASI BARU --- */}
          <div className="text-right">
            <span className="font-bold text-indigo-600 text-xl">
              {Number(profile.reputation)}
            </span>
            <p className="text-xs text-gray-500">Poin Reputasi</p>
          </div>
        </div>
        <div className="mt-2 border-t pt-2">
          <p>
            <strong>Nama:</strong> {profile.name}
          </p>
          <p>
            <strong>Keahlian:</strong> {profile.expertise}
          </p>
          <p>
            <strong>Tugas Review Aktif:</strong>{" "}
            {Number(profile.reviewingCount)}
          </p>
        </div>
      </div>
    );
  }

  // Jika profil tidak ada, tampilkan tombol untuk registrasi
  return (
    <div className="bg-white p-4 rounded-lg shadow-md text-center">
      <p className="mb-4">Anda belum memiliki profil. Silakan daftar.</p>
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-green-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-600 transition"
      >
        {showForm ? "Batal" : "Buat Profil"}
      </button>

      {/* Form Registrasi (muncul saat tombol diklik) */}
      {showForm && (
        <form onSubmit={handleRegister} className="mt-4 text-left space-y-4">
          <div>
            <label className="block font-medium">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block font-medium">Bidang Keahlian</label>
            <input
              type="text"
              value={expertise}
              onChange={(e) => setExpertise(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Computer Science"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg"
          >
            Daftar
          </button>
          {message && (
            <p className="text-center mt-2 text-sm text-gray-600">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}

export default Profile;
