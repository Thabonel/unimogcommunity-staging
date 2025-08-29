
import { NavLink, useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Settings, Wrench, PenTool, MapPin, Truck, MessageSquareCode, Shield, Zap } from 'lucide-react';

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
        <NavLink to="/knowledge/articles" className={getLinkClass('/knowledge/articles')}>
          <BookOpen className="h-4 w-4" />
          <span>All Recommendations</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/repair" className={getLinkClass('/knowledge/repair')}>
          <Wrench className="h-4 w-4" />
          <span>Repair</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/maintenance" className={getLinkClass('/knowledge/maintenance')}>
          <Settings className="h-4 w-4" />
          <span>Maintenance</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/modifications" className={getLinkClass('/knowledge/modifications')}>
          <PenTool className="h-4 w-4" />
          <span>Modifications</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/tyres" className={getLinkClass('/knowledge/tyres')}>
          <Truck className="h-4 w-4" />
          <span>Tyres</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/adventures" className={getLinkClass('/knowledge/adventures')}>
          <MapPin className="h-4 w-4" />
          <span>Adventures</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/ai-mechanic" className={getLinkClass('/knowledge/ai-mechanic')}>
          <MessageSquareCode className="h-4 w-4" />
          <span>AI Mechanic</span>
        </NavLink>
        
        <Separator orientation="vertical" className="h-6 mx-2" />
        
        <NavLink to="/knowledge/safety" className={getLinkClass('/knowledge/safety')}>
          <Shield className="h-4 w-4" />
          <span>Safety Tips</span>
        </NavLink>
      </div>
    </div>
  );
}
