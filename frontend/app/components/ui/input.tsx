import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn("field", className)} {...props} />;
  },
);

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn("field min-h-28 resize-y", className)} {...props} />;
  },
);

const Select = React.forwardRef<HTMLSelectElement, React.ComponentPropsWithoutRef<"select">>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn("field appearance-auto", className)} {...props} />;
  },
);

export { Input, Textarea, Select };
