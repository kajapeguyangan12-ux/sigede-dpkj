"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

interface DataChartProps {
  data: ChartData;
  type: 'bar' | 'doughnut';
  title?: string;
  height?: number;
}

const DataChart: React.FC<DataChartProps> = ({ data, type, title, height = 200 }) => {
  const defaultColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#F97316', // orange
    '#06B6D4', // cyan
    '#84CC16', // lime
  ];

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: title || 'Data',
        data: data.values,
        backgroundColor: data.colors || defaultColors.slice(0, data.values.length),
        borderColor: data.colors ? data.colors.map(color => color) : defaultColors.slice(0, data.values.length),
        borderWidth: type === 'bar' ? 0 : 2,
        borderRadius: type === 'bar' ? 8 : 0,
        borderSkipped: false,
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            const value = context.parsed?.y || context.parsed || 0;
            return `${value.toLocaleString('id-ID')} orang`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          maxRotation: 45,
        },
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart',
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    },
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 10,
            weight: 500,
          },
          color: '#374151',
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.toLocaleString('id-ID')} orang (${percentage}%)`;
          }
        }
      },
    },
    cutout: '50%',
    animation: {
      animateRotate: true,
      duration: 2000,
      easing: 'easeOutQuart',
    },
  };

  if (type === 'bar') {
    return (
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={barOptions} />
      </div>
    );
  } else {
    return (
      <div style={{ height: `${height}px` }}>
        <Doughnut data={chartData} options={doughnutOptions} />
      </div>
    );
  }
};

export default DataChart;