import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Info, Mountain, TreePine, Road } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AdvancedRoutingOptionsProps {
  routeProfile: string;
  onProfileChange: (profile: string) => void;
  terrainDifficulty?: 'easy' | 'moderate' | 'difficult' | 'extreme';
  onDifficultyChange?: (difficulty: 'easy' | 'moderate' | 'difficult' | 'extreme') => void;
  avoidHighways?: boolean;
  onAvoidHighwaysChange?: (avoid: boolean) => void;
  preferOffRoad?: boolean;
  onPreferOffRoadChange?: (prefer: boolean) => void;
  maxGrade?: number;
  onMaxGradeChange?: (grade: number) => void;
}

export const AdvancedRoutingOptions: React.FC<AdvancedRoutingOptionsProps> = ({
  routeProfile,
  onProfileChange,
  terrainDifficulty = 'moderate',
  onDifficultyChange,
  avoidHighways = false,
  onAvoidHighwaysChange,
  preferOffRoad = false,
  onPreferOffRoadChange,
  maxGrade = 30,
  onMaxGradeChange,
}) => {
  const routeProfiles = [
    { value: 'driving', label: 'Standard Driving', icon: Car },
    { value: 'driving-hgv', label: 'Heavy Vehicle (4x4)', icon: Truck },
    { value: 'cycling-regular', label: 'Cycling', icon: Bike },
    { value: 'foot-hiking', label: 'Hiking', icon: Footprints },
  ];

  const difficultyLevels = [
    { value: 'easy', label: 'Easy', color: 'text-green-600' },
    { value: 'moderate', label: 'Moderate', color: 'text-yellow-600' },
    { value: 'difficult', label: 'Difficult', color: 'text-orange-600' },
    { value: 'extreme', label: 'Extreme', color: 'text-red-600' },
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Advanced Routing Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Profile */}
        <div className="space-y-2">
          <Label htmlFor="route-profile" className="text-xs">Vehicle Profile</Label>
          <Select value={routeProfile} onValueChange={onProfileChange}>
            <SelectTrigger id="route-profile" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="driving">
                <div className="flex items-center gap-2">
                  <Road className="h-3 w-3" />
                  <span>Standard Driving</span>
                </div>
              </SelectItem>
              <SelectItem value="driving-hgv">
                <div className="flex items-center gap-2">
                  <Mountain className="h-3 w-3" />
                  <span>4x4 / Heavy Vehicle</span>
                </div>
              </SelectItem>
              <SelectItem value="cycling-regular">
                <div className="flex items-center gap-2">
                  <TreePine className="h-3 w-3" />
                  <span>Mountain Biking</span>
                </div>
              </SelectItem>
              <SelectItem value="foot-hiking">
                <div className="flex items-center gap-2">
                  <TreePine className="h-3 w-3" />
                  <span>Hiking</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Terrain Difficulty */}
        {onDifficultyChange && (
          <div className="space-y-2">
            <Label htmlFor="terrain-difficulty" className="text-xs">Terrain Difficulty</Label>
            <Select value={terrainDifficulty} onValueChange={onDifficultyChange}>
              <SelectTrigger id="terrain-difficulty" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <span className={level.color}>{level.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Route Preferences */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="avoid-highways" className="text-xs cursor-pointer">
                Avoid Highways
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Prefer smaller roads and tracks</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="avoid-highways"
              checked={avoidHighways}
              onCheckedChange={onAvoidHighwaysChange}
              className="scale-75"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="prefer-offroad" className="text-xs cursor-pointer">
                Prefer Off-Road
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Prioritize unpaved tracks and trails</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="prefer-offroad"
              checked={preferOffRoad}
              onCheckedChange={onPreferOffRoadChange}
              className="scale-75"
            />
          </div>
        </div>

        {/* Maximum Grade */}
        {onMaxGradeChange && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-grade" className="text-xs">Max Grade</Label>
              <span className="text-xs text-muted-foreground">{maxGrade}%</span>
            </div>
            <Slider
              id="max-grade"
              min={10}
              max={50}
              step={5}
              value={[maxGrade]}
              onValueChange={([value]) => onMaxGradeChange(value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>30%</span>
              <span>50%</span>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs text-muted-foreground">
            Advanced routing requires OpenRouteService API. Some options may not be available for all route types.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Import required icons
import { Car, Truck, Bike, Footprints } from 'lucide-react';