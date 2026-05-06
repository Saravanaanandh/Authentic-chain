import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions | FakeID Shield",
  description: "Instructions for requesting data deletion.",
};

export default function DataDeletion() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto glass-card p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-white mb-6">Data Deletion Instructions</h1>
          <p className="text-lg text-slate-300">
            Users can request deletion of their account and associated data
            by emailing <a href="mailto:saravanawebdev@gmail.com" className="text-brand-400 hover:underline">saravanawebdev@gmail.com</a>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
}
