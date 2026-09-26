import { nativeSelectClass } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

/** Native <select> styled as a dark pill to match <Input>. Pair with a <Label> above it. */
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn(nativeSelectClass, className)} {...props} />;
}
