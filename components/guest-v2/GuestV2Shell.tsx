type GuestV2ShellProps = {
  children: React.ReactNode;
};

export function GuestV2Shell({ children }: GuestV2ShellProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd] text-[#171717]">
      <div className="mx-auto min-h-screen w-full max-w-lg">{children}</div>
    </main>
  );
}