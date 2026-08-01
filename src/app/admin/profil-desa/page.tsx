"use client";
import React from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../components/AdminLayout";
import { AdminHeaderSearchBar } from "../../components/AdminHeaderCard";

const styles = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes cardEntrance {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-slideUp {
    animation: slideUp 0.5s ease-out forwards;
  }

  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out forwards;
  }

  .animate-card-entrance {
    animation: cardEntrance 0.6s ease-out forwards;
    opacity: 0;
  }

  /* Glass effect optimized for mobile */
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  /* Prevent text selection on touch */
  .no-select {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  /* iOS safe area */
  @supports (padding: max(0px)) {
    .safe-area-padding {
      padding-left: max(12px, env(safe-area-inset-left));
      padding-right: max(12px, env(safe-area-inset-right));
      padding-bottom: max(12px, env(safe-area-inset-bottom));
    }
  }
`;

const menu = [
	{
		label: "Wilayah Desa",
		icon: "🗺️",
		color: "from-red-500 to-rose-500",
		path: "/admin/profil-desa/wilayah",
		description: "Kelola informasi geografis"
	},
	{
		label: "Sejarah Desa",
		icon: "📚",
		color: "from-orange-500 to-red-500",
		path: "/admin/profil-desa/sejarah",
		description: "Atur cerita sejarah desa"
	},
	{
		label: "Visi & Misi",
		icon: "🎯",
		color: "from-red-500 to-rose-500",
		path: "/admin/profil-desa/visi-misi",
		description: "Kelola visi dan misi desa"
	},
	{
		label: "Struktur Pemerintahan",
		icon: "🏛️",
		color: "from-green-500 to-emerald-500",
		path: "/admin/profil-desa/struktur",
		description: "Struktur organisasi desa"
	},
	{
		label: "Lembaga Kemasyarakatan",
		icon: "👥",
		color: "from-red-500 to-rose-500",
		path: "/admin/profil-desa/lembaga",
		description: "Data lembaga masyarakat"
	},
];

export default function ProfilDesaAdminPage() {
	const router = useRouter();

		return (
			<AdminLayout>
				<style>{styles}</style>
				
				{/* Mobile-First Background */}
				<div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-rose-100/40 relative">				{/* Simplified Background - Desktop Only */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
					<div className="absolute inset-0 opacity-30" style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
					}}></div>
				</div>

				<div className="relative max-w-7xl mx-auto safe-area-padding px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
					
					{/* Compact Header for Mobile */}
					<div className="glass-effect rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-md sm:shadow-lg border border-white/60 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 lg:mb-8 animate-slideUp">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
						{/* Title Section */}
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
									<svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
										<path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
								</div>
								<div>
									<h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
										Profil Desa
									</h1>
									<p className="text-xs sm:text-sm text-gray-500 mt-0.5">
										Kelola informasi desa
									</p>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex items-center gap-2 sm:gap-3">
								<AdminHeaderSearchBar />
							</div>
						</div>
					</div>

					{/* Menu Grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
						{menu.map((item, index) => (
							<button
								key={item.label}
								onClick={() => router.push(item.path)}
								className="no-select group relative bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md sm:hover:shadow-lg active:shadow-sm border border-gray-200/50 p-4 sm:p-5 lg:p-6 transition-all duration-200 active:scale-[0.98] sm:hover:scale-[1.02] overflow-hidden animate-card-entrance"
								style={{
									animationDelay: `${index * 80}ms`,
									WebkitTapHighlightColor: 'transparent'
								}}
							>
								{/* Gradient Overlay on Hover */}
								<div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 sm:group-hover:opacity-[0.03] transition-opacity duration-300 rounded-xl sm:rounded-2xl`}></div>
								
								{/* Content */}
								<div className="relative z-10 flex flex-col items-center text-center">
									
									{/* Icon */}
									<div className={`bg-gradient-to-br ${item.color} rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 shadow-sm sm:group-hover:shadow-md sm:group-hover:scale-105 transition-all duration-200`}>
										<div className="text-2xl sm:text-3xl lg:text-4xl">{item.icon}</div>
									</div>
									
									{/* Title */}
									<h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-800 mb-1 sm:mb-1.5 px-1">
										{item.label}
									</h3>
									
									{/* Description */}
									<p className="text-xs sm:text-sm text-gray-500 leading-snug px-2">
										{item.description}
									</p>
									
									{/* Action Arrow */}
									<div className="mt-2.5 sm:mt-3">
										<div className={`bg-gradient-to-r ${item.color} p-1 sm:p-1.5 rounded-full transition-transform sm:group-hover:translate-x-1 duration-200`}>
											<svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
												<path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
											</svg>
										</div>
									</div>
								</div>

								{/* Ripple Effect Placeholder for Touch Feedback */}
								<div className="absolute inset-0 bg-gray-100/30 opacity-0 active:opacity-100 transition-opacity duration-100 rounded-xl sm:rounded-2xl pointer-events-none md:hidden"></div>
							</button>
						))}
					</div>

					{/* Compact Info Card */}
					<div className="mt-6 sm:mt-8 lg:mt-12 bg-gradient-to-r from-red-500/5 to-rose-500/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-red-200/20 p-4 sm:p-5 lg:p-6 text-center">
						<div className="flex items-center justify-center mb-2.5 sm:mb-3">
							<div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-full p-2">
								<svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
						<h3 className="text-base sm:text-lg font-bold text-gray-800 mb-1.5 sm:mb-2">Informasi Penting</h3>
						<p className="text-xs sm:text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
							Pastikan informasi profil desa selalu diperbarui untuk memberikan data akurat kepada masyarakat.
						</p>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
