import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col justify-center items-center px-4">
      <Navbar />
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-black text-brand-600 dark:text-brand-400">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          The requested route could not be found or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
