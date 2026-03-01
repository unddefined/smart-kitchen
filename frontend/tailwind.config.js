/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // 添加优先级颜色
        priority: {
          red: '#ff9a85',    // 催菜 - priority 3
          yellow: '#ffdb66', // 等一下 - priority 2
          green: '#c9e68c',  // 不急 - priority 1
          gray: '#f3f4f6',   // 未起 - priority 0
          darkgray: '#6b7280' // 已出 - priority -1
        }
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [],
};