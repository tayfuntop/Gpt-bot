/** @type {import('tailwindcss').Config} */

const plugin = require('tailwindcss/plugin')

const MyClass = plugin(function ({ addUtilities }) {
  addUtilities({
    ".my-rotate-y-360": {
      transform: "rotateY(360eg)",
      transition: "transform 2250ms",
    },
    ".my-rotate-y-270": {
      transform: "rotateY(180deg)",
      transition: "transform 2250ms",
    },
    ".preserve-3d": {
      transformStyle: "preserve-3d", 
    },
    ".perspective": {
      perspective: "2000px",
    },
    ".backface-hidden": {
      backfaceVisibility: "hidden",
    }
  })
})

module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [MyClass],
}
