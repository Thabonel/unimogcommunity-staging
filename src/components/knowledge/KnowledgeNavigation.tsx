
import { NavLink, useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { Lightbulb, Settings, Wrench, PenTool, MapPin, Truck } from 'lucide-react';

export function KnowledgeNavigation() {
  const location = useLocation();
  const path = location.pathname;
  
  const getLinkClass = (url: string) => {
    const baseClass = "flex items-center text-sm gap-2 py-2 px-3 rounded-md transition-colors";
    return path === url ? 
      `${baseClass} bg-primary/10 text-primary font-medium` : 
      `${baseClass} hover:bg-muted`;
  };

  return (
    <div className="mt-2 mb-6">
      <div className="flex items-center overflow-x-auto pb-2 no-scrollbar">
        <NavLink to="/knowledge/recommendations" className={getLinkClass('/knowledge/recommendations')}>
          <Lightbulb className="h-4 w-4" />
          <span>All Recommendations</span>
        </NavLink>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <NavLink
          to="/knowledge/recommendations/repair"
          className={getLinkClass('/knowledge/recommendations/repair')}
        >
          <Wrench className="h-4 w-4" />
          <span>Repair</span>
        </NavLink>

        <Separator orientation="vertical" className="h-6 mx-2" />
        <NavLink
          to="/knowledge/recommendations/maintenance"
          className={getLinkClass('/knowledge/recommendations/maintenance')}
        >
          <Settings className="h-4 w-4" />
          <span>Maintenance</span>
        </NavLink>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <NavLink
          to="/knowledge/recommendations/modifications"
          className={getLinkClass('/knowledge/recommendations/modifications')}
        >
          <PenTool className="h-4 w-4" />
          <span>Modifications</span>
        </NavLink>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <NavLink
          to="/knowledge/recommendations/tyres"
          className={getLinkClass('/knowledge/recommendations/tyres')}
        >
          <Truck className="h-4 w-4" />
          <span>Tyres</span>
        </NavLink>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <NavLink
          to="/knowledge/recommendations/adventures"
          className={getLinkClass('/knowledge/recommendations/adventures')}
        >
          <MapPin className="h-4 w-4" />
          <span>Adventures</span>
        </NavLink>
      </div>
    </div>
  );
}
