import type { Config } from 'tailwindcss'
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",      // ← src 경로 추가
    "./src/components/**/*.{js,ts,jsx,tsx}"// ← src 경로 추가
  ],
  theme: {
    extend: {
      colors: {
        naver: "#03C75A"
      }
    }
  },
  plugins: []
}
export default config
