import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex h-screen items-center justify-center">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => router.push("/dashboard")}
      >
        Vào Dashboard
      </button>
    </div>
  );
}