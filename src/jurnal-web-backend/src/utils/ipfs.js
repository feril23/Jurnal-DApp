import axios from "axios";

// Ambil API keys dari environment variables
const apiKey = import.meta.env.VITE_PINATA_API_KEY;
const apiSecret = import.meta.env.VITE_PINATA_SECRET_API_KEY;
const JWT = import.meta.env.VITE_PINATA_JWT

const pinataApiUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";

export const uploadToIPFS = async (file) => {
  if (!apiKey || !apiSecret) {
    throw new Error("API Keys Pinata belum diatur di file .env");
  }

  // Buat FormData untuk dikirim
  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("Mengupload file ke Pinata...");
    const response = await axios.post(pinataApiUrl, formData, {
      maxBodyLength: "Infinity", // Diperlukan untuk file besar
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
    });

    console.log("File berhasil diupload:", response.data);

    // Kembalikan hash (CID) dari response
    return response.data.IpfsHash;
  } catch (error) {
    console.error("Error saat upload ke Pinata:", error);
    throw new Error("Gagal mengupload file ke IPFS.");
  }
};
