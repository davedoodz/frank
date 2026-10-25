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
        <div className="wordmark mb-6">fitte.</div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
