import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DatabaseDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results: any = {};

      // Test 1: Check if table exists
      try {
        const { data: tables, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', 'community_recommendations')
          .single();
        
        results.tableExists = !error && tables;
        results.tableExistsError = error?.message;
      } catch (err) {
        results.tableExists = false;
        results.tableExistsError = err instanceof Error ? err.message : 'Unknown error';
      }

      // Test 2: Try to fetch from community_recommendations
      try {
        const { data, error, count } = await supabase
          .from('community_recommendations')
          .select('*', { count: 'exact', head: true });
        
        results.canAccess = !error;
        results.accessError = error?.message;
        results.rowCount = count;
      } catch (err) {
        results.canAccess = false;
        results.accessError = err instanceof Error ? err.message : 'Unknown error';
      }

      // Test 3: Check RLS policies
      try {
        const { data: policies, error } = await supabase.rpc('get_policies', {
          table_name: 'community_recommendations'
        }).single();
        
        results.hasPolicies = !error && policies;
        results.policiesError = error?.message;
      } catch (err) {
        results.hasPolicies = false;
        results.policiesError = err instanceof Error ? err.message : 'Unknown error';
      }

      // Test 4: Try old table name for comparison
      try {
        const { error } = await supabase
          .from('community_articles')
          .select('*', { count: 'exact', head: true });
        
        results.oldTableExists = !error;
        results.oldTableError = error?.message;
      } catch (err) {
        results.oldTableExists = false;
        results.oldTableError = err instanceof Error ? err.message : 'Unknown error';
      }

      setDiagnostics(results);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) return <div>Running diagnostics...</div>;

  return (
    <Alert className="mt-4">
      <AlertDescription>
        <h3 className="font-bold mb-2">Database Diagnostics:</h3>
        <ul className="space-y-1 text-sm">
          <li>Table exists check: {diagnostics.tableExists ? '✅' : '❌'} {diagnostics.tableExistsError && `(${diagnostics.tableExistsError})`}</li>
          <li>Can access table: {diagnostics.canAccess ? '✅' : '❌'} {diagnostics.accessError && `(${diagnostics.accessError})`}</li>
          <li>Row count: {diagnostics.rowCount ?? 'N/A'}</li>
          <li>Has RLS policies: {diagnostics.hasPolicies ? '✅' : '❌'} {diagnostics.policiesError && `(${diagnostics.policiesError})`}</li>
          <li>Old table exists: {diagnostics.oldTableExists ? '✅' : '❌'} {diagnostics.oldTableError && `(${diagnostics.oldTableError})`}</li>
        </ul>
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
        </div>
      </AlertDescription>
    </Alert>
  );
}