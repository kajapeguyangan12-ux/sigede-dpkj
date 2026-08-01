"use client";

import React from 'react';
import AnimatedCounter from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  delay = 0,
  subtitle
}) => {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900">
          <AnimatedCounter 
            targetNumber={value} 
            duration={2000} 
            delay={delay}
            className="text-2xl font-bold text-gray-900"
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {subtitle || 'Jiwa'}
        </div>
      </div>
    </div>
  );
};

interface PopulationStatsProps {
  data: any[];
}

const PopulationStats: React.FC<PopulationStatsProps> = ({ data }) => {
  const totalPenduduk = data.length;

  const stats = [
    {
      title: 'Total Penduduk',
      value: totalPenduduk,
      icon: (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      ),
      color: 'border-blue-500',
      delay: 0,
      subtitle: 'Jiwa'
    },
  ];

  return (
    <div className="mb-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          delay={stat.delay}
          subtitle={stat.subtitle}
        />
      ))}
    </div>
  );
};

export default PopulationStats;