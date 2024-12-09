"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getDailyContent } from "../_data/dailyContent";

export default function Timeline() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [centerIndex, setCenterIndex] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const [scrollDirection, setScrollDirection] = useState<"left" | "right">(
    "right"
  );
  const lastScrollPosition = useRef(0);

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

    let isHandlingScroll = false;
    let rafId: number;

    const handleScroll = () => {
      const currentScroll = scrollContainer.scrollLeft;
      setScrollDirection(
        currentScroll > lastScrollPosition.current ? "right" : "left"
      );
      lastScrollPosition.current = currentScroll;
      setIsScrolling(true);

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (!isHandlingScroll) {
        isHandlingScroll = true;

        rafId = requestAnimationFrame(() => {
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
            setCenterIndex(closestIndex); // Update center index immediately for scaling

            // Only update the selected date after scrolling stops
            scrollTimeoutRef.current = setTimeout(() => {
              setSelectedDate(days[dateIndex]);
              setIsScrolling(false);
            }, 50);
          }

          isHandlingScroll = false;
        });
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    // Only run initial setup once
    if (centerIndex === 0) {
      const initialDateIndex = days.findIndex(
        (day) => day.toDateString() === new Date().toDateString()
      );
      setCenterIndex(initialDateIndex);
      setSelectedDate(days[initialDateIndex]);
    }

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array since we don't need to re-run this effect

  return (
    <div className="w-full h-screen max-w-screen overflow-x-hidden flex flex-col items-center justify-center gap-24 bg-[#F9F7F0] relative">
      <div
        ref={scrollRef}
        className="w-full absolute top-0 left-0 overflow-x-auto  scrollbar-hide"
      >
        <div className="flex items-center space-x-8 px-[50vw] h-32">
          {days.map((day, i) => (
            <motion.div
              key={i}
              className="day-item flex flex-col items-center min-w-fit"
              data-index={i}
            >
              <motion.span
                className="text-sm font-medium mb-2"
                animate={{
                  y:
                    i === centerIndex
                      ? -8
                      : i === centerIndex - 1 || i === centerIndex + 1
                      ? -4
                      : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {formatDay(day)}
              </motion.span>
              <motion.div
                className="h-4 w-px bg-black"
                animate={{
                  scale:
                    i === centerIndex
                      ? 2
                      : i === centerIndex - 1 || i === centerIndex + 1
                      ? 1.5
                      : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {selectedDate && (
          <div className="flex flex-col items-center max-w-2xl px-4 mb-8 gap-8">
            <motion.div
              className="w-screen-sm  flex justify-center items-center p-4"
              initial={{
                x: scrollDirection === "right" ? 20 : -20,
                opacity: 0,
              }}
              animate={{
                x: isScrolling ? (scrollDirection === "right" ? -20 : 20) : 0,
                opacity: isScrolling ? 0 : 1,
              }}
              exit={{
                x: scrollDirection === "right" ? -50 : 50,
                opacity: 0,
              }}
              key={selectedDate.toISOString()}
              transition={{
                duration: 0.3,
                delay: isScrolling ? 0.15 : 0, // Global delay for all properties when scrolling starts
                ease: "easeInOut",
              }}
            >
              <div className="flex flex-col  gap-2">
                <p className="text-sm font-medium uppercase">
                  {formatFullDate(selectedDate)}
                </p>
                {/* getDailyContent */}
                <p className="font-medium">{getDailyContent(selectedDate)}</p>
                {/* <span className="ml-2 text-sm text-gray-500">
                  (Scrolling: {isScrolling ? "yes" : "no"})
                </span> */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
