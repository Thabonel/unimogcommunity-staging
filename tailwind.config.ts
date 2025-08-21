import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				unimog: {
					50: '#f5f7f6',
					100: '#e0e7e4',
					200: '#c1d0ca',
					300: '#9ab1a6',
					400: '#748d81',
					500: '#587367',
					600: '#455c52',
					700: '#384a43',
					800: '#2e3d37',
					900: '#21302a',
					950: '#111a16',
				},
				terrain: {
					50: '#f7f3ee',
					100: '#efe3d4',
					200: '#dfc4a9',
					300: '#cea277',
					400: '#c2894d',
					500: '#b77638',
					600: '#a05d30',
					700: '#82482b',
					800: '#6b3c2a',
					900: '#593327',
					950: '#301914',
				},
				// Adding new military-utility color palette
				'military-green': '#4B5320',
				'camo-brown': '#6E5849',
				'mud-black': '#2B2B2B',
				'khaki-tan': '#C2B280',
				'sand-beige': '#D7C9AA',
				'olive-drab': '#556B2F',
				// Keeping the existing Military U1700L colors
				military: {
					olive: '#3D5A40',
					sage: '#5D7C4C',
					tan: '#A67843',
					sand: '#E9E6DA',
					black: '#1F1F1F',
					gray: '#8B8B8B',
					khaki: '#BFA678',
					brown: '#6c584c',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				inter: ['Inter', 'Helvetica Neue', 'sans-serif'],
				rubik: ['Rubik', 'sans-serif'],
				plex: ['IBM Plex Sans', 'sans-serif'],
				rugged: ['"Special Elite"', 'serif'], // Adding rugged font family
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
