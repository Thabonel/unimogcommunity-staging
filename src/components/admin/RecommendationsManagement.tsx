import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  PlusCircle, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  CheckCircle2,
  Calendar as CalendarIcon,
  Search,
  MapPin,
  Building2
} from "lucide-react";
import { useRecommendations, RecommendationData } from "@/hooks/use-recommendations";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { RecommendationSubmissionDialog } from "@/components/knowledge/RecommendationSubmissionDialog";
import { cn } from "@/lib/utils";
import { type DateRange } from "react-day-picker";

const RecommendationsManagement = () => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRecommendationId, setDeletingRecommendationId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const {
    recommendations,
    searchQuery,
    setSearchQuery,
    dateRange,
    handleDateRangeChange,
    fetchRecommendations,
    deleteRecommendation,
    updateRecommendationStatus,
    toggleFeatured,
    toggleVerified
  } = useRecommendations();

  const handleDeleteRecommendation = async () => {
    if (!deletingRecommendationId) return;
    const success = await deleteRecommendation(deletingRecommendationId);
    if (success) {
      handleCloseDeleteDialog();
    }
  };

  const handleOpenDeleteDialog = (recommendationId: string) => {
    setDeletingRecommendationId(recommendationId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingRecommendationId(null);
  };
  
  const filteredRecommendations = recommendations.filter(rec => {
    if (statusFilter === "all") return true;
    if (statusFilter === "published") return rec.is_approved === true;
    if (statusFilter === "draft") return rec.is_approved === false;
    if (statusFilter === "featured") return rec.is_featured === true;
    if (statusFilter === "verified") return rec.is_verified === true;
    return true;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      repair: "bg-blue-100 text-blue-800",
      maintenance: "bg-green-100 text-green-800",
      modifications: "bg-purple-100 text-purple-800",
      tyres: "bg-yellow-100 text-yellow-800",
      adventures: "bg-orange-100 text-orange-800",
      suppliers: "bg-pink-100 text-pink-800",
      services: "bg-indigo-100 text-indigo-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Community Recommendations Management</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Recommendation
        </Button>
      </div>
      
      {/* Status Filter Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            All ({recommendations.length})
          </Button>
          <Button 
            variant={statusFilter === "published" ? "default" : "outline"}
            onClick={() => setStatusFilter("published")}
            size="sm"
          >
            Published ({recommendations.filter(r => r.is_approved).length})
          </Button>
          <Button 
            variant={statusFilter === "draft" ? "default" : "outline"}
            onClick={() => setStatusFilter("draft")}
            size="sm"
          >
            Drafts ({recommendations.filter(r => !r.is_approved).length})
          </Button>
          <Button 
            variant={statusFilter === "featured" ? "default" : "outline"}
            onClick={() => setStatusFilter("featured")}
            size="sm"
          >
            Featured ({recommendations.filter(r => r.is_featured).length})
          </Button>
          <Button 
            variant={statusFilter === "verified" ? "default" : "outline"}
            onClick={() => setStatusFilter("verified")}
            size="sm"
          >
            Verified ({recommendations.filter(r => r.is_verified).length})
          </Button>
        </div>
      </div>
      
      {/* Search and Date Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Table>
        <TableCaption>A list of all community recommendations</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Badges</TableHead>
            <TableHead>Stats</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRecommendations.map((rec) => (
            <TableRow key={rec.id}>
              <TableCell className="font-medium max-w-xs">
                <div>
                  <p className="truncate">{rec.title}</p>
                  <p className="text-sm text-gray-500 truncate">{rec.excerpt}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn(getCategoryColor(rec.category))}>
                  {rec.category}
                </Badge>
              </TableCell>
              <TableCell>
                {rec.business_name && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span className="text-sm">{rec.business_name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {rec.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">{rec.location}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>{rec.author_name || 'Unknown'}</TableCell>
              <TableCell>
                <Badge variant={rec.is_approved ? "default" : "secondary"}>
                  {rec.is_approved ? "Published" : "Draft"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {rec.is_featured && (
                    <Badge variant="outline" className="border-yellow-500">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      Featured
                    </Badge>
                  )}
                  {rec.is_verified && (
                    <Badge variant="outline" className="border-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Verified
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    {rec.views || 0}
                  </div>
                  {rec.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {rec.rating}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {rec.published_at ? format(new Date(rec.published_at), "MMM dd, yyyy") : "-"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateRecommendationStatus(rec.id, !rec.is_approved)}
                  >
                    {rec.is_approved ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleFeatured(rec.id, !rec.is_featured)}
                  >
                    <Star className={cn("h-4 w-4", rec.is_featured && "fill-yellow-500 text-yellow-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVerified(rec.id, !rec.is_verified)}
                  >
                    <CheckCircle2 className={cn("h-4 w-4", rec.is_verified && "fill-green-500 text-green-500")} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Edit functionality can be added here
                      // For now, just show a message
                      alert('Edit functionality coming soon. For now, delete and recreate the recommendation.');
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleOpenDeleteDialog(rec.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Recommendation"
        description="Are you sure you want to delete this recommendation? This action cannot be undone."
        onConfirm={handleDeleteRecommendation}
      />

      <RecommendationSubmissionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          fetchRecommendations();
        }}
      />
    </div>
  );
};

export default RecommendationsManagement;