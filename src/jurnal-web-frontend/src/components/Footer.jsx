import React from "react";

function Footer() {
  return (
    <footer className="bg-white mt-12">
      <div className="container mx-auto px-6 py-8 border-t">
        <p className="text-center text-gray-500">
          © {new Date().getFullYear()} JurnalChain. Ditenagai oleh Internet
          Computer.
        </p>
      </div>
    </footer>
  );
}
export default Footer;
