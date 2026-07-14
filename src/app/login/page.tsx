import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">LatentBridge</h1>
        <p className="text-slate-500 text-sm mt-1">Recruitment Daily Tracker</p>
      </div>
      <LoginForm />
    </div>
  );
}
