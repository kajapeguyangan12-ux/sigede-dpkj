"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '../../../contexts/AuthContext';
import { handleAdminLogout } from '../../../lib/logoutHelper';
import AdminLayout from "../components/AdminLayout";
import AdminHeaderCard, { AdminHeaderSearchBar, AdminHeaderAccount } from "../../components/AdminHeaderCard";

const menu = [
	{
		label: "Wilayah Desa",
		icon: "🗺️",
		color: "from-blue-500 to-cyan-500",
		path: "/admin/profil-desa/wilayah",
		description: "Kelola informasi geografis dan wilayah desa"
	},
	{
		label: "Sejarah Desa",
		icon: "📚",
		color: "from-orange-500 to-red-500",
		path: "/admin/profil-desa/sejarah",
		description: "Atur cerita sejarah dan perkembangan desa"
	},
	{
		label: "Visi & Misi",
		icon: "🎯",
		color: "from-purple-500 to-pink-500",
		path: "/admin/profil-desa/visi-misi",
		description: "Kelola visi, misi, dan tujuan desa"
	},
	{
		label: "Struktur Pemerintahan",
		icon: "🏛️",
		color: "from-green-500 to-emerald-500",
		path: "/admin/profil-desa/struktur",
		description: "Atur struktur organisasi pemerintah desa"
	},
	{
		label: "Lembaga Kemasyarakatan",
		icon: "👥",
		color: "from-indigo-500 to-blue-500",
		path: "/admin/profil-desa/lembaga",
		description: "Kelola data lembaga dan organisasi masyarakat"
	},
];

export default function ProfilDesaAdminPage() {
	const router = useRouter();
	const { logout } = useAuth();

	const handleLogout = async () => {
    await handleAdminLogout(() => logout('admin'));
  };

	return (
		<AdminLayout>
			{/* Modern Background with Glass Morphism */}
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
				{/* Background Pattern */}
				<div className="absolute inset-0 opacity-50">
					<div className="absolute inset-0" style={{
						backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
					}}></div>
				</div>
				
				{/* Floating Orbs */}
				<div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-floating"></div>
				<div className="absolute bottom-32 right-20 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-floating-delayed"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-xl animate-pulse"></div>

				<div className="relative max-w-7xl mx-auto p-6">
					{/* Modern Header Card */}
					<div className="glass-effect rounded-3xl shadow-xl p-8 mb-10 animate-slideUp">
						<AdminHeaderCard title="Profil Desa">
							<AdminHeaderSearchBar />
							<AdminHeaderAccount onLogout={handleLogout} />
						</AdminHeaderCard>
					</div>

					{/* Hero Section */}
					<div className="text-center mb-12 animate-fadeIn">
						<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
							Kelola Profil Desa
						</h1>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
							Atur dan kelola informasi lengkap tentang desa Anda dengan mudah dan terstruktur
						</p>
					</div>

					{/* Modern Menu Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
						{menu.map((item, index) => (
							<button
								key={item.label}
								onClick={() => router.push(item.path)}
								className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl border border-white/30 p-8 transition-all duration-500 hover:-translate-y-3 hover:bg-white/90 overflow-hidden animate-card-entrance"
								style={{
									animationDelay: `${index * 150}ms`,
									animationFillMode: 'both'
								}}
							>
								{/* Background Gradient Overlay */}
								<div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`}></div>
								
								{/* Icon Container */}
								<div className="relative z-10 flex flex-col items-center">
									<div className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500 relative overflow-hidden`}>
										{/* Icon Background Pattern */}
										<div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
										<div className="text-5xl relative z-10">{item.icon}</div>
									</div>
									
									{/* Label */}
									<h3 className="font-bold text-xl text-gray-800 text-center group-hover:text-gray-900 transition-colors duration-300 mb-2">
										{item.label}
									</h3>
									
									{/* Description */}
									<p className="text-sm text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
										{item.description}
									</p>
									
									{/* Arrow Indicator */}
									<div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
										<div className={`bg-gradient-to-r ${item.color} p-2 rounded-full`}>
											<svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
											</svg>
										</div>
									</div>
								</div>

								{/* Shine Effect */}
								<div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
								</div>
							</button>
						))}
					</div>

					{/* Bottom Info Card */}
					<div className="mt-16 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 backdrop-blur-sm rounded-3xl border border-blue-200/30 p-8 text-center">
						<div className="flex items-center justify-center mb-4">
							<div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-3">
								<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
						</div>
						<h3 className="text-xl font-bold text-gray-800 mb-2">Informasi Penting</h3>
						<p className="text-gray-600 max-w-3xl mx-auto">
							Pastikan semua informasi profil desa selalu diperbarui untuk memberikan data yang akurat kepada masyarakat. 
							Setiap perubahan akan langsung terlihat di situs web publik.
						</p>
					</div>
				</div>
			</div>
		</AdminLayout>
	);
}
