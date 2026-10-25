import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex h-screen items-center justify-center bg-surface">
      <div className="w-[260px]">
        <div className="mb-6 text-13 text-ink">fitte.</div>
        <LoginForm next={next ?? "/"} />
      </div>
    </main>
  );
}
