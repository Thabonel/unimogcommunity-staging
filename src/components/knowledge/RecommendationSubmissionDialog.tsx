import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecommendationSubmissionForm } from "./RecommendationSubmissionForm";

interface RecommendationSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  category?: string;
}

export function RecommendationSubmissionDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  category 
}: RecommendationSubmissionDialogProps) {
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    else onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share a Recommendation</DialogTitle>
          <DialogDescription>
            Help fellow Unimog owners by recommending suppliers, services, or sharing valuable tips and guides.
          </DialogDescription>
        </DialogHeader>
        <RecommendationSubmissionForm 
          onSuccess={handleSuccess} 
          defaultCategory={category} 
        />
      </DialogContent>
    </Dialog>
  );
}