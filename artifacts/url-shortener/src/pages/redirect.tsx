import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { useGetUrl, getGetUrlQueryKey } from '@workspace/api-client-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Redirect() {
  const params = useParams<{ shortCode: string }>();
  const [, setLocation] = useLocation();
  const shortCode = params.shortCode || '';

  const { data: resolvedUrl, error, isLoading } = useGetUrl(shortCode, {
    query: {
      enabled: !!shortCode,
      retry: false, // Don't retry if it's a 404
      queryKey: getGetUrlQueryKey(shortCode),
    }
  });

  useEffect(() => {
    if (resolvedUrl?.originalUrl) {
      window.location.replace(resolvedUrl.originalUrl);
    }
  }, [resolvedUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center text-center space-y-4">
          <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-lg font-medium text-muted-foreground animate-pulse">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-lg border-destructive/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-foreground">Link not found</CardTitle>
            <CardDescription className="text-base mt-2">
              The short URL you are trying to visit does not exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-6">
            <Button onClick={() => setLocation('/')} size="lg" className="w-full">
              Back to shortener
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback while useEffect redirects
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center space-y-4">
        <RefreshCcw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-lg font-medium text-muted-foreground">
          Taking you to your destination...
        </p>
      </div>
    </div>
  );
}
