import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecommendationSubmissionForm } from "./RecommendationSubmissionForm";

interface RecommendationSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RecommendationSubmissionDialog({ open, onOpenChange, onSuccess }: RecommendationSubmissionDialogProps) {
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    else onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Submit a Recommendation</DialogTitle>
          <DialogDescription>
            Share a supplier or service you recommend with the Unimog community.
          </DialogDescription>
        </DialogHeader>
        <RecommendationSubmissionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
