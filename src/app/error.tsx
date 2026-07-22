"use client";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="text-slate-500 text-sm mt-2">
          {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
          {" "}This can happen right after a new deployment — reloading usually fixes it.
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <button
            onClick={() => unstable_retry()}
            className="rounded-md border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
