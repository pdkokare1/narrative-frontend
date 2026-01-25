// src/utils/ChartConfig.tsx
import { ChartOptions } from 'chart.js';

// --- FIXED PALETTES (Hardcoded for stability) ---
// These match variables.css exactly but don't rely on the browser loading styles first.

export const leanColors: Record<string, string> = {
    'Left': '#CF5C5C',         // Muted Red
    'Left-Leaning': '#E08D8D', // Soft Red
    'Center': '#D4AF37',       // Gold
    'Right-Leaning': '#8DABE0',// Soft Blue
    'Right': '#5C8BCF',        // Muted Blue
    'Not Applicable': '#666666'
};

export const sentimentColors: Record<string, string> = { 
    'Positive': '#4E9F54', // Success Green
    'Negative': '#CF5C5C', // Error Red
    'Neutral': '#888888'
};

export const qualityColors: Record<string, string> = {
    'A+ Excellent (90-100)': '#D4AF37', // Gold
    'A High (80-89)': '#C5A028',
    'B Professional (70-79)': '#4E9F54', // Green
    'C Acceptable (60-69)': '#8DABE0',   // Blue
    'D-F Poor (0-59)': '#CF5C5C',        // Red
    'N/A (Review/Opinion)': '#666666'
};

// Gold Spectrum for Charts
const categoryColorsDark = ['#D4AF37', '#AA8C2C', '#F2D06B', '#8C7324', '#E6C657', '#997D26', '#D9B948', '#BF9E30', '#FFDE7D', '#735F1D'];
const categoryColorsLight = ['#9C7C50', '#7A5F3A', '#B89668', '#5E492C', '#D6B485', '#4A3922', '#8F7249', '#A38253', '#E0C297', '#3D2F1C'];

export interface ThemeColors {
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    borderColor: string;
    tooltipBg: string;
    categoryPalette: string[];
    accentPrimary: string;
    trendUp: string;
    trendDown: string;
    
    // Mapped aliases for compatibility
    primary: string;
    secondary: string;
    charts: string[];
}

// --- Helper to get Theme Variables ---
export const getChartTheme = (theme: string = 'light'): ThemeColors => {
    const isDark = theme === 'dark';
    
    const colors = {
        textPrimary: isDark ? '#EAEAEA' : '#1A1A1A',
        textSecondary: isDark ? '#999999' : '#5A5A5A',
        textTertiary: isDark ? '#666666' : '#8C8C8C',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        tooltipBg: isDark ? '#1a1a1a' : '#FFFFFF',
        categoryPalette: isDark ? categoryColorsDark : categoryColorsLight,
        accentPrimary: isDark ? '#D4AF37' : '#9C7C50',
        trendUp: '#4E9F54',
        trendDown: '#CF5C5C',
        secondaryColor: isDark ? '#8DABE0' : '#5C8BCF', // Blueish secondary
    };

    return {
        ...colors,
        primary: colors.accentPrimary,
        secondary: colors.secondaryColor,
        charts: colors.categoryPalette
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
                labels: { 
                    color: colors.textSecondary, 
                    boxWidth: 8, 
                    padding: 20,
                    font: { family: "'Inter', sans-serif", size: 11 }
                } 
            },
            tooltip: { 
                backgroundColor: colors.tooltipBg, 
                titleColor: colors.textPrimary, 
                bodyColor: colors.textSecondary,
                borderColor: colors.borderColor,
                borderWidth: 1,
                padding: 12,
                titleFont: { family: "'Playfair Display', serif" }
            },
            title: { 
                display: !!title, 
                text: title, 
                color: colors.textPrimary, 
                font: { size: 14, family: "'Playfair Display', serif" } 
            }
        },
        cutout: '70%',
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
                ticks: { color: colors.textTertiary, font: { size: 10 } },
                grid: { color: colors.borderColor, tickLength: 0 }
            },
            y: {
                ticks: { color: colors.textSecondary, font: { size: 11 } },
                grid: { display: false }
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: { 
                backgroundColor: colors.tooltipBg, 
                titleColor: colors.textPrimary, 
                bodyColor: colors.textSecondary,
                borderColor: colors.borderColor,
                borderWidth: 1
            },
            title: { 
                display: !!title, 
                text: title, 
                color: colors.textPrimary, 
                font: { size: 14, family: "'Playfair Display', serif" } 
            }
        },
        elements: {
            bar: { borderRadius: 4 }
        }
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
                ticks: { color: colors.textTertiary, font: { size: 10 } },
                grid: { color: colors.borderColor }
            },
            y: {
                beginAtZero: true,
                ticks: { color: colors.textTertiary, stepSize: 1 },
                grid: { color: colors.borderColor }
            },
        },
        plugins: {
            legend: { display: false },
            tooltip: { 
                backgroundColor: colors.tooltipBg, 
                titleColor: colors.textPrimary, 
                bodyColor: colors.textSecondary,
                borderColor: colors.borderColor,
                borderWidth: 1
            },
            title: {
                display: true,
                text: 'Stories Analyzed Over Time',
                color: colors.textPrimary,
                font: { size: 14, family: "'Playfair Display', serif" }
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
                title: { display: true, text: 'Lean (Left ↔ Right)', color: colors.textSecondary, font: { size: 10 } },
                ticks: {
                    color: colors.textTertiary,
                    font: { size: 10 },
                    callback: (value) => {
                        if (value === -10) return 'L';
                        if (value === 0) return 'C';
                        if (value === 10) return 'R';
                        return '';
                    }
                },
                grid: { color: colors.borderColor }
            },
            y: {
                min: 0,
                max: 100,
                title: { display: true, text: 'Reliability', color: colors.textSecondary, font: { size: 10 } },
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
                        return point.headline ? `${point.headline}` : `Score: ${point.y}`;
                    }
                }
            },
            title: {
                display: true,
                text: 'Bias vs. Reliability Map',
                color: colors.textPrimary,
                font: { size: 14, family: "'Playfair Display', serif" }
            }
        }
    };
};
