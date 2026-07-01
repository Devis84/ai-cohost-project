type GuestV2ShellProps = {
  children: React.ReactNode;
};

export function GuestV2Shell({ children }: GuestV2ShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#171717]">
      <div className="mx-auto min-h-screen w-full max-w-md">{children}</div>
    </main>
  );
}