# Script untuk mengupdate semua halaman layanan dengan format yang sama

$services = @(
    @{
        folder = "paket-akta-perceraian"
        title = "Paket Akta Perceraian"
        serviceId = "paket-akta-perceraian"
        iconName = "DivorceIcon"
        iconSvg = @'
function DivorceIcon(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" opacity="0.3"/>
      <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/>
    </svg>
  );
}
'@
    }
)

Write-Host "Script untuk update service pages telah dibuat" -ForegroundColor Green
Write-Host "Total services to update: $($services.Count)" -ForegroundColor Cyan
