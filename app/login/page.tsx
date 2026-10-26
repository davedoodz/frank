import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="w-[240px]">
        <div className="wordmark mb-6 text-[18px] font-semibold tracking-tight">
          ça fitte<span className="text-accent">.</span>
        </div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
