"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Timeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [centerIndex, setCenterIndex] = useState<number>(0);

  // Generate array of past 100 days
  const days = Array.from({ length: 100 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();

  // Format day to weekday name
  const formatDay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  // Format full date
  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      requestAnimationFrame(() => {
        const containerRect = scrollContainer.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;

        let closestDay: HTMLElement | null = null;
        let minDistance = Infinity;
        let closestIndex = 0;

        scrollContainer
          .querySelectorAll(".day-item")
          .forEach((dayElement: Element, index: number) => {
            const dayRect = dayElement.getBoundingClientRect();
            const distance = Math.abs(
              dayRect.left + dayRect.width / 2 - centerX
            );

            if (distance < minDistance) {
              minDistance = distance;
              closestDay = dayElement as HTMLElement;
              closestIndex = index;
            }
          });

        if (closestDay) {
          const dateIndex = parseInt(closestDay.dataset.index || "0", 10);
          setSelectedDate(days[dateIndex]);
          setCenterIndex(closestIndex);
        }
      });
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [days]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-white relative">
      {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full z-10" /> */}

      {selectedDate && (
        <div className="mb-8 text-xl font-semibold">
          {formatFullDate(selectedDate)}
        </div>
      )}

      <div ref={scrollRef} className="w-full overflow-x-auto  scrollbar-hide">
        <div className="flex items-center space-x-8 px-[50vw] h-32">
          {days.map((day, i) => (
            <motion.div
              key={i}
              className="day-item flex flex-col items-center min-w-fit"
              data-index={i}
              animate={{
                scale:
                  i === centerIndex
                    ? 2
                    : i === centerIndex - 1 || i === centerIndex + 1
                    ? 1.5
                    : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <span className="text-sm font-medium mb-2">{formatDay(day)}</span>
              <div className="h-4 w-px bg-gray-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Add this to your global CSS to hide scrollbar but maintain functionality
const styles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
