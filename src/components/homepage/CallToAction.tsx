
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function CallToAction() {
  return (
    <section className="py-16 bg-military-olive/10">
      <div className="container text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Join the Unimog Community</h2>
        <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
          Connect with fellow Unimog owners, access exclusive resources, and be part of a growing community.
        </p>
        <div className="pt-4">
          <Link to="/signup">
            <Button size="lg" className="rounded-md">
              Start Free Trial
            </Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          No credit card required. Try all features free for 45 days.
        </p>
      </div>
    </section>
  );
}
