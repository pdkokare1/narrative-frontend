// src/utils/ChartConfig.ts
import { ChartOptions } from 'chart.js';

// --- Color Palettes ---
export const leanColors: Record<string, string> = {
    'Left': '#dc2626', 
    'Left-Leaning': '#f87171', 
    'Center': '#4CAF50',
    'Right-Leaning': '#60a5fa', 
    'Right': '#2563eb', 
    'Not Applicable': '#a1a1aa'
};

export const sentimentColors: Record<string, string> = { 
    'Positive': '#2563eb', 
    'Negative': '#dc2626', 
    'Neutral': '#6b7280' 
};

export const qualityColors: Record<string, string> = {
    'A+ Excellent (90-100)': '#2563eb',
    'A High (80-89)': '#60a5fa',
    'B Professional (70-79)': '#4CAF50',
    'C Acceptable (60-69)': '#F59E0B',
    'D-F Poor (0-59)': '#dc2626',
    'N/A (Review/Opinion)': '#a1a1aa'
};

const categoryColorsDark = ['#B38F5F', '#CCA573', '#D9B98A', '#E6CB9F', '#9C7C50', '#8F6B4D', '#C19A6B', '#AE8A53', '#D0B48F', '#B8860B'];
const categoryColorsLight = ['#2E4E6B', '#3E6A8E', '#5085B2', '#63A0D6', '#243E56', '#1A2D3E', '#4B77A3', '#395D7D', '#5D92C1', '#004E8A'];

interface ThemeColors {
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderColor: string;
    tooltipBg: string;
    categoryPalette: string[];
    accentPrimary: string;
    trendUp: string;
    trendDown: string;
}

// --- Helper to get Theme Variables ---
export const getChartTheme = (theme: string): ThemeColors => {
    const isDark = theme === 'dark';
    return {
        textPrimary: isDark ? '#EAEAEA' : '#2C2C2C',
        textSecondary: isDark ? '#B0B0B0' : '#555555',
        textTertiary: isDark ? '#757575' : '#888888',
        borderColor: isDark ? '#333333' : '#EAEAEA',
        tooltipBg: isDark ? '#2C2C2C' : '#FDFDFD',
        categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
        accentPrimary: isDark ? '#B38F5F' : '#2E4E6B',
        trendUp: isDark ? '#4CAF50' : '#2E7D32',
        trendDown: isDark ? '#E57373' : '#C62828',
    };
};

// --- Options Generators ---

export const getDoughnutChartOptions = (title: string, theme: string): ChartOptions<'doughnut'> => {
    const colors = getChartTheme(theme);
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: 'bottom', 
                labels: { color: colors.textSecondary, boxWidth: 12, padding: 15 } 
            },
            tooltip: { 
                backgroundColor: colors.tooltipBg, 
                titleColor: colors.textPrimary, 
                bodyColor: colors.textSecondary 
            },
            title: { 
                display: !!title, 
                text: title, 
                color: colors.textPrimary, 
                font: { size: 14 } 
            }
        },
        cutout: '60%',
        elements: { arc: { borderWidth: 0 } }
    };
};

export const getBarChartOptions = (title: string, axisLabel: string, theme: string): ChartOptions<'bar'> => {
    const colors = getChartTheme(theme);
    return {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true,
                title: { display: !!axisLabel, text: axisLabel, color: colors.textSecondary },
                ticks: { color: colors.textTertiary, stepSize: 1 },
                grid: { color: colors.borderColor }
            },
            y: {
                ticks: { color: colors.textSecondary },
                grid: { display: false }
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: { 
                backgroundColor: colors.tooltipBg, 
                titleColor: colors.textPrimary, 
                bodyColor: colors.textSecondary 
            },
            title: { 
                display: !!title, 
                text: title, 
                color: colors.textPrimary, 
                font: { size: 14 } 
            }
        },
    };
};

export const getLineChartOptions = (theme: string): ChartOptions<'line'> => {
    const colors = getChartTheme(theme);
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: { unit: 'day', tooltipFormat: 'MMM d, yyyy', displayFormats: { day: 'MMM d' }},
                title: { display: true, text: 'Date', color: colors.textSecondary },
                ticks: { color: colors.textTertiary },
                grid: { color: colors.borderColor }
            },
            y: {
                beginAtZero: true,
                title: { display: true, text: 'Stories Analyzed', color: colors.textSecondary },
                ticks: { color: colors.textTertiary, stepSize: 1 },
                grid: { color: colors.borderColor }
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: { 
                backgroundColor: colors.tooltipBg, 
                titleColor: colors.textPrimary, 
                bodyColor: colors.textSecondary 
            },
            title: {
                display: true,
                text: 'Stories Analyzed Over Time',
                color: colors.textPrimary,
                font: { size: 14 }
            }
        },
    };
};

export const getScatterChartOptions = (theme: string): ChartOptions<'scatter'> => {
    const colors = getChartTheme(theme);
    return {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                min: -10,
                max: 10,
                title: { display: true, text: 'Political Lean (Left to Right)', color: colors.textSecondary, font: { size: 10 } },
                ticks: {
                    color: colors.textTertiary,
                    font: { size: 10 },
                    callback: (value) => {
                        if (value === -10) return 'Left';
                        if (value === 0) return 'Center';
                        if (value === 10) return 'Right';
                        return '';
                    }
                },
                grid: { color: colors.borderColor, tickLength: 0 }
            },
            y: {
                min: 0,
                max: 100,
                title: { display: true, text: 'Trust Score (Quality)', color: colors.textSecondary, font: { size: 10 } },
                ticks: { color: colors.textTertiary, font: { size: 10 } },
                grid: { color: colors.borderColor }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: colors.tooltipBg,
                titleColor: colors.textPrimary,
                bodyColor: colors.textSecondary,
                padding: 10,
                callbacks: {
                    label: (context: any) => {
                        const point = context.raw;
                        return point.headline ? `${point.headline} (Score: ${point.y})` : `Score: ${point.y}`;
                    }
                }
            },
            title: {
                display: true,
                text: 'Bias vs. Reliability Map',
                color: colors.textPrimary,
                font: { size: 14 }
            }
        }
    };
};
