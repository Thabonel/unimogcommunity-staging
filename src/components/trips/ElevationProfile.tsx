import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mountain, TrendingUp, TrendingDown } from 'lucide-react';
import { formatElevation, formatDistance } from '@/utils/gpxUtils';

interface ElevationProfileProps {
  points: Array<{
    lat: number;
    lon: number;
    elevation?: number;
    distance?: number;
  }>;
  elevationData?: {
    min: number;
    max: number;
    gain: number;
    loss: number;
  };
  totalDistance?: number;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  points,
  elevationData,
  totalDistance
}) => {
  if (!points || points.length === 0 || !points.some(p => p.elevation !== undefined)) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            No elevation data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate cumulative distance if not provided
  const calculateDistance = (p1: typeof points[0], p2: typeof points[0]) => {
    const R = 6371; // Earth radius in km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLon = (p2.lon - p1.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Prepare data for visualization
  const profileData = points.reduce((acc, point, index) => {
    if (point.elevation === undefined) return acc;
    
    let distance = 0;
    if (index > 0) {
      const prevPoint = acc[acc.length - 1];
      distance = prevPoint ? prevPoint.distance + calculateDistance(points[index - 1], point) : 0;
    }
    
    acc.push({
      distance: point.distance || distance,
      elevation: point.elevation,
      index
    });
    
    return acc;
  }, [] as Array<{ distance: number; elevation: number; index: number }>);

  if (profileData.length === 0) {
    return null;
  }

  // Calculate statistics if not provided
  const stats = elevationData || {
    min: Math.min(...profileData.map(p => p.elevation)),
    max: Math.max(...profileData.map(p => p.elevation)),
    gain: profileData.reduce((sum, p, i) => {
      if (i === 0) return 0;
      const diff = p.elevation - profileData[i - 1].elevation;
      return sum + (diff > 0 ? diff : 0);
    }, 0),
    loss: profileData.reduce((sum, p, i) => {
      if (i === 0) return 0;
      const diff = p.elevation - profileData[i - 1].elevation;
      return sum + (diff < 0 ? Math.abs(diff) : 0);
    }, 0)
  };

  const distance = totalDistance || profileData[profileData.length - 1]?.distance || 0;

  // Create SVG path
  const svgWidth = 400;
  const svgHeight = 150;
  const padding = 10;
  
  const xScale = (svgWidth - 2 * padding) / (distance || 1);
  const yMin = stats.min - 50;
  const yMax = stats.max + 50;
  const yScale = (svgHeight - 2 * padding) / (yMax - yMin);
  
  const pathData = profileData
    .map((p, i) => {
      const x = padding + p.distance * xScale;
      const y = svgHeight - padding - (p.elevation - yMin) * yScale;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaPath = `${pathData} L ${svgWidth - padding} ${svgHeight - padding} L ${padding} ${svgHeight - padding} Z`;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Mountain className="h-4 w-4" />
          Elevation Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Statistics */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Min</p>
            <p className="font-medium">{formatElevation(stats.min)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Max</p>
            <p className="font-medium">{formatElevation(stats.max)}</p>
          </div>
          <div className="flex items-start gap-1">
            <TrendingUp className="h-3 w-3 text-green-600 mt-0.5" />
            <div>
              <p className="text-muted-foreground">Gain</p>
              <p className="font-medium">{formatElevation(stats.gain)}</p>
            </div>
          </div>
          <div className="flex items-start gap-1">
            <TrendingDown className="h-3 w-3 text-red-600 mt-0.5" />
            <div>
              <p className="text-muted-foreground">Loss</p>
              <p className="font-medium">{formatElevation(stats.loss)}</p>
            </div>
          </div>
        </div>

        {/* SVG Profile */}
        <div className="w-full overflow-x-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            className="w-full"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />
            
            {/* Area under curve */}
            <path
              d={areaPath}
              fill="currentColor"
              fillOpacity="0.1"
              className="text-primary"
            />
            
            {/* Profile line */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
            />
          </svg>
        </div>

        {/* Distance indicator */}
        <div className="text-xs text-muted-foreground text-center">
          Total Distance: {formatDistance(distance * 1000)}
        </div>
      </CardContent>
    </Card>
  );
};