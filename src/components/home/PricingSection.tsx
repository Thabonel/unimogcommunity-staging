
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useCurrencyPricing, formatPriceWithIndicator } from '@/hooks/use-currency-pricing';
import { getAnnualSavingsText } from '@/config/pricing';
import { CurrencySelector } from '@/components/pricing/CurrencySelector';

const PricingSection = () => {
  const { pricing, userCurrency, userCountry, isLoading, setPricingCurrency } = useCurrencyPricing();
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            45-day free trial. Choose a plan that works for you.
          </p>
          {userCountry && !isLoading && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Prices shown in {userCurrency} for {userCountry}
                {pricing.monthly.isConverted && <span className="ml-1">(converted from AUD)</span>}
              </p>
              <CurrencySelector
                currentCurrency={userCurrency}
                onCurrencyChange={setPricingCurrency}
                userCountry={userCountry}
                isConverted={pricing.monthly.isConverted}
              />
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Detecting your currency...</span>
            </div>
          )}
        </div>
        
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="bg-primary/5 rounded-lg p-8 border border-primary/20 flex items-center gap-6">
            <img src="/barry-avatar.png" alt="Barry AI Mechanic" className="h-32 w-32 rounded-full flex-shrink-0 object-cover" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Barry, Your AI Mechanic</h3>
              <p className="text-muted-foreground">
                Access our advanced AI assistant who knows everything about Unimog repair and maintenance. 
                Get step-by-step guidance, troubleshooting help, and technical advice 24/7.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Monthly Plan */}
          <Card className="border-2 border-border">
            <CardHeader className="text-center pb-8 pt-6">
              <p className="text-2xl font-bold">Monthly</p>
              <h3 className="text-4xl font-bold mt-2">
                {formatPriceWithIndicator(pricing.monthly.amount, pricing.monthly.currency, pricing.monthly.isConverted)}
                <span className="text-lg font-normal text-muted-foreground">/month</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Flexible monthly access</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Full Community Access</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Complete Knowledge Base</span>
                </div>
                <div className="flex items-center text-primary-foreground bg-primary/10 p-2 rounded-md">
                  <img src="/barry-avatar.png" alt="Barry" className="mr-2 h-5 w-5 rounded-full" />
                  <span className="font-medium">Barry, AI Mechanic Assistant</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/signup?plan=monthly">Start Monthly</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Annual Plan */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 text-xs font-bold">
              BEST VALUE
            </div>
            <CardHeader className="text-center pb-8 pt-6">
              <p className="text-2xl font-bold">Annual</p>
              <h3 className="text-4xl font-bold mt-2">
                {formatPriceWithIndicator(pricing.annual.amount, pricing.annual.currency, pricing.annual.isConverted)}
                <span className="text-lg font-normal text-muted-foreground">/year</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {getAnnualSavingsText(pricing.annual.currency, pricing.monthly.amount, pricing.annual.amount)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Full Community Access</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Complete Knowledge Base</span>
                </div>
                <div className="flex items-center text-primary-foreground bg-primary/10 p-2 rounded-md">
                  <img src="/barry-avatar.png" alt="Barry" className="mr-2 h-5 w-5 rounded-full" />
                  <span className="font-medium">Barry, AI Mechanic Assistant</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to="/signup?plan=annual">Save with Annual Plan</Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Lifetime Plan */}
          <Card className="border-2 border-accent">
            <CardHeader className="text-center pb-8 pt-6">
              <p className="text-2xl font-bold">Lifetime</p>
              <h3 className="text-4xl font-bold mt-2">
                {formatPriceWithIndicator(pricing.lifetime.amount, pricing.lifetime.currency, pricing.lifetime.isConverted)}
                <span className="text-lg font-normal text-muted-foreground"> one-time</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-2">Permanent site access</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Full Community Access</span>
                </div>
                <div className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-primary" />
                  <span>Complete Knowledge Base</span>
                </div>
                <div className="flex items-center text-primary-foreground bg-primary/10 p-2 rounded-md">
                  <img src="/barry-avatar.png" alt="Barry" className="mr-2 h-5 w-5 rounded-full" />
                  <span className="font-medium">Barry, AI Mechanic Assistant</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/signup?plan=lifetime">Get Lifetime Access</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
