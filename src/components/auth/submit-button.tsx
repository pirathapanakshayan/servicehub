import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  pending: boolean;
  pendingText: string;
  children: React.ReactNode;
};

export function SubmitButton({ pending, pendingText, children }: SubmitButtonProps) {
  return (
    <Button type="submit" className="h-10 w-full" disabled={pending} aria-busy={pending}>
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
