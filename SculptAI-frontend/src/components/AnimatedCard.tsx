"use client"

import { animate, motion, useAnimation } from "framer-motion"
import React, { useEffect } from "react"
import { cn } from "../lib/utils"
import { useInView } from "react-intersection-observer"

export interface AnimatedCardProps {
  className?: string
  title?: React.ReactNode
  description?: React.ReactNode
  icons?: Array<{
    icon: React.ReactNode
    size?: "sm" | "md" | "lg"
    className?: string
  }>
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
}

export function AnimatedCard({ className, title, description, icons = [] }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "w-full p-6 rounded-xl border border-[rgba(255,255,255,0.10)] bg-white",
        className
      )}
    >
      <div
        className={cn(
          "h-[200px] rounded-xl z-40 mb-4",
          "bg-gray-50 [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)]"
        )}
      >
        <AnimatedIcons icons={icons} />
      </div>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm font-normal text-gray-600">
          {description}
        </p>
      )}
    </div>
  )
}

function AnimatedIcons({ icons }: { icons: AnimatedCardProps["icons"] }) {
  return (
    <div className="p-8 overflow-hidden h-full relative flex items-center justify-center">
      <div className="flex flex-row flex-shrink-0 justify-center items-center gap-2">
        {icons.map((icon, index) => (
          <div key={index} className="relative">
            <Container
              className={cn(
                // Make middle icon larger
                index === 1 ? "h-20 w-20 scale-110" : sizeMap[icon.size || "lg"],
                `circle-${index + 1}`,
                icon.className
              )}
            >
              {icon.icon}
            </Container>
          </div>
        ))}
      </div>
      <AnimatedSparkles />
    </div>
  );
}

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
      shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]
      relative overflow-hidden`, // Added relative and overflow-hidden
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"

const AnimatedSparkles = () => (
  <div className="w-10 h-32 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
    <Sparkles />
  </div>
)

const Sparkles = () => {
  const randomMove = () => Math.random() * 2 - 1
  const randomOpacity = () => Math.random()
  const random = () => Math.random()
  
  // Added array of blue colors for variation
  const blueColors = [
    'rgb(59, 130, 246)', // blue-500
    'rgb(37, 99, 235)',  // blue-600
    'rgb(96, 165, 250)'  // blue-400
  ]

  return (
    <div className="absolute inset-0">
      {[...Array(12)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 2 + 4,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            borderRadius: "50%",
            zIndex: 1,
            backgroundColor: blueColors[Math.floor(random() * blueColors.length)]
          }}
          className="inline-block"
        />
      ))}
    </div>
  )
}

export default AnimatedCard