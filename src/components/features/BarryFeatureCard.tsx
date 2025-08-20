import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Wrench, MessageCircle } from 'lucide-react';

export const BarryFeatureCard: React.FC = () => {
  return (
    <Card className="h-full hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="flex h-full">
        {/* Large Barry Avatar Section */}
        <div className="w-1/3 bg-gradient-to-br from-military-green to-military-green/80 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Large Bot Icon as Barry */}
            <Bot className="w-full h-full max-w-[120px] max-h-[120px] text-white/90" />
            
            {/* Decorative elements */}
            <div className="absolute top-2 right-2">
              <Wrench className="w-6 h-6 text-white/60 animate-pulse" />
            </div>
            <div className="absolute bottom-2 left-2">
              <MessageCircle className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-xl font-bold text-military-green">
              Barry AI Mechanic
            </CardTitle>
            <CardDescription className="text-sm font-medium mt-1">
              Barry, Your AI Mechanic
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Access our advanced AI assistant who knows everything about Unimog repair and maintenance. 
              Get step-by-step guidance, troubleshooting help, and technical advice 24/7.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-military-green/10 text-military-green">
                24/7 Support
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-military-green/10 text-military-green">
                All Models
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-military-green/10 text-military-green">
                Expert Knowledge
              </span>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};