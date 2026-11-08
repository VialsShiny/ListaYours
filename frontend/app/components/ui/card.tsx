import * as React from "react";
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div"> & { tone?: "white" | "surface" | "band" };

const tones: Record<NonNullable<CardProps["tone"]>, string> = {
  white: "bg-white shadow-soft",
  surface: "bg-surface shadow-card",
  band: "bg-surface-alt",
};

function Card({ className, tone = "white", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn("rounded-[4px] p-6 md:p-8", tones[tone], className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-header" className={cn("mb-6 flex flex-col gap-2", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("display display-card", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p data-slot="card-description" className={cn("text-sm text-ink-soft", className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("flex flex-col gap-4", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("hairline mt-6 flex flex-wrap items-center gap-3 pt-4", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
