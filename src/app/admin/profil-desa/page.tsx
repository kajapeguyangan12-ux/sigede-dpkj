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
	},
	{
		label: "Sejarah Desa",
		icon: "📚",
		color: "from-orange-500 to-red-500",
		path: "/admin/profil-desa/sejarah",
	},
	{
		label: "Visi & Misi",
		icon: "🎯",
		color: "from-purple-500 to-pink-500",
		path: "/admin/profil-desa/visi-misi",
	},
	{
		label: "Struktur Pemerintahan",
		icon: "🏛️",
		color: "from-green-500 to-emerald-500",
		path: "/admin/profil-desa/struktur",
	},
	{
		label: "Lembaga Kemasyarakatan",
		icon: "👥",
		color: "from-indigo-500 to-blue-500",
		path: "/admin/profil-desa/lembaga",
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
			<div className="max-w-7xl mx-auto p-6">
				<AdminHeaderCard title="Profil Desa">
					<AdminHeaderSearchBar />
					<AdminHeaderAccount onLogout={handleLogout} />
					<AdminHeaderAccount />
				</AdminHeaderCard>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
					{menu.map((item) => (
						<button
							key={item.label}
							onClick={() => router.push(item.path)}
							className="flex flex-col items-center justify-center bg-white rounded-2xl shadow-md hover:shadow-xl p-8 border border-gray-100 cursor-pointer group transition-all duration-300 hover:-translate-y-2 hover:border-gray-200"
						>
							{/* Icon with gradient background */}
							<div className={`bg-gradient-to-br ${item.color} rounded-2xl p-6 mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
								<div className="text-6xl">{item.icon}</div>
							</div>
							
							{/* Label */}
							<span className="font-semibold text-lg text-gray-700 text-center group-hover:text-gray-900 transition-colors">
								{item.label}
							</span>
							
							{/* Arrow indicator */}
							<div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
								</svg>
							</div>
						</button>
					))}
				</div>
			</div>
		</AdminLayout>
	);
}
