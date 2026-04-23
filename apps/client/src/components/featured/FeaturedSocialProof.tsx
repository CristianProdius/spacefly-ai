"use client";

import { Space } from "@repo/types";
import { Star, ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn, parseImages, getPriceDisplay } from "@/lib/utils";
import { useState } from "react";

const testimonials = [
  {
    name: "Alex R.",
    role: "Product Manager",
    avatar: null,
    rating: 5,
    quote:
      "Perfect space for our offsite. The team loved the natural light and the coffee was a nice touch.",
  },
  {
    name: "Sarah M.",
    role: "Freelance Designer",
    avatar: null,
    rating: 5,
    quote:
      "I use this space every week. It's quiet, fast WiFi, and the neighborhood has great lunch options.",
  },
  {
    name: "James T.",
    role: "Startup Founder",
    avatar: null,
    rating: 4,
    quote:
      "We booked this for a client workshop. Professional setting, easy booking process through Spacefly.ai.",
  },
  {
    name: "Maria L.",
    role: "Event Planner",
    avatar: null,
    rating: 5,
    quote:
      "The venue was stunning. My clients were impressed and the host was incredibly accommodating.",
  },
  {
    name: "David K.",
    role: "Remote Engineer",
    avatar: null,
    rating: 5,
    quote:
      "Finally found a coworking space that doesn't feel sterile. Great community vibe and fair pricing.",
  },
  {
    name: "Nina P.",
    role: "Marketing Lead",
    avatar: null,
    rating: 4,
    quote:
      "Hosted our quarterly review here. Projector, whiteboard, and breakout area — exactly what we needed.",
  },
  {
    name: "Tom W.",
    role: "Photographer",
    avatar: null,
    rating: 5,
    quote:
      "The exposed brick and large windows made for perfect natural light. Will book again for sure.",
  },
  {
    name: "Lisa C.",
    role: "HR Director",
    avatar: null,
    rating: 5,
    quote:
      "Our team retreat was a huge success thanks to this venue. Central location and flexible layout.",
  },
];

export default function FeaturedSocialProof({
  spaces,
}: {
  spaces: Space[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = Math.min(spaces.length, testimonials.length);

  const prev = () =>
    setCurrentSlide((s) => (s === 0 ? totalSlides - 1 : s - 1));
  const next = () =>
    setCurrentSlide((s) => (s === totalSlides - 1 ? 0 : s + 1));

  if (totalSlides === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Loved by Our Community
        </h2>
        <p className="text-muted text-sm mb-10">
          Real reviews from real bookers
        </p>

        {/* Slide area */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {spaces.slice(0, totalSlides).map((space, i) => {
              const images = parseImages(space.images);
              const testimonial = testimonials[i]!;

              return (
                <div
                  key={space.id}
                  className="w-full shrink-0 grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-1"
                >
                  {/* Testimonial side */}
                  <div className="flex flex-col gap-4 py-4">
                    <Quote className="w-8 h-8 text-primary/30" />
                    <blockquote className="text-lg text-foreground leading-relaxed">
                      &ldquo;{testimonial.quote}&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-4 h-4",
                            s < testimonial.rating
                              ? "fill-primary text-primary"
                              : "text-border"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-full bg-subtle flex items-center justify-center text-sm font-bold text-foreground">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {testimonial.name}
                        </p>
                        <p className="text-xs text-muted">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Space card side */}
                  <Link
                    href={`/spaces/${space.id}`}
                    className="group block border border-border rounded-xl overflow-hidden hover:shadow-layered-md transition-shadow"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={images[0] || "/placeholder-space.jpg"}
                        alt={space.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">
                        {space.name}
                      </h3>
                      <p className="text-sm text-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {space.city}, {space.country}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-foreground">
                          {getPriceDisplay(space)}
                        </span>
                        {space.averageRating !== undefined &&
                          space.averageRating > 0 && (
                            <span className="flex items-center gap-1 text-sm text-muted">
                              <Star className="w-3.5 h-3.5 fill-foreground text-foreground" />
                              {space.averageRating.toFixed(1)}
                            </span>
                          )}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-subtle transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  i === currentSlide
                    ? "bg-primary w-6"
                    : "bg-border hover:bg-muted"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-subtle transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
