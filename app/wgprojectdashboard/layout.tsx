export default function WgProjectDashboardRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div data-wgproduct-root="true">{children}</div>;
}
