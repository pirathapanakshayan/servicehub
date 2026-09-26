import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  pending: boolean;
  pendingText: string;
  children: React.ReactNode;
};

export function SubmitButton({ pending, pendingText, children }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      className="h-12 w-full text-base"
      disabled={pending}
      aria-busy={pending}
      arrow={!pending}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
