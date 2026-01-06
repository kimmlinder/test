"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface AnimatedTabsProps {
  tabs: { label: string; href?: string }[]
  defaultTab?: string
  onTabChange?: (label: string) => void
  className?: string
}

export function AnimatedTabs({ tabs, defaultTab, onTabChange, className }: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].label)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (container && activeTab) {
      const activeTabElement = activeTabRef.current

      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement

        const clipLeft = offsetLeft
        const clipRight = offsetLeft + offsetWidth

        container.style.clipPath = `inset(0 ${Number(
          100 - (clipRight / container.offsetWidth) * 100
        ).toFixed()}% 0 ${Number(
          (clipLeft / container.offsetWidth) * 100
        ).toFixed()}% round 17px)`
      }
    }
  }, [activeTab])

  const handleTabClick = (label: string) => {
    setActiveTab(label)
    onTabChange?.(label)
  }

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Background layer with highlight */}
      <div
        ref={containerRef}
        className="absolute flex h-9 items-center bg-primary transition-all duration-300 ease-out"
        style={{ clipPath: "inset(0 100% 0 0% round 17px)" }}
      >
        <div className="flex items-center">
          {tabs.map((tab, index) => (
            <button
              key={`bg-${tab.label}-${index}`}
              onClick={() => handleTabClick(tab.label)}
              className="flex h-9 items-center rounded-full px-4 text-sm font-medium text-primary-foreground"
              tabIndex={-1}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Foreground layer with text */}
      <div className="flex items-center">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.label

          return (
            <button
              key={`fg-${tab.label}-${index}`}
              ref={isActive ? activeTabRef : null}
              onClick={() => handleTabClick(tab.label)}
              className={cn(
                "flex h-9 items-center cursor-pointer rounded-full px-4 text-sm font-medium transition-colors duration-200",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
