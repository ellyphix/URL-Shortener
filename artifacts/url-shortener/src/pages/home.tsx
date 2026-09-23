import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Copy, Check, ArrowRight, Link as LinkIcon, RefreshCcw } from 'lucide-react';
import { useCreateUrl } from '@workspace/api-client-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const urlSchema = z.object({
  originalUrl: z.string().trim().min(1, 'Enter a URL to shorten.').max(2048, 'The URL is too long.').refine((value) => {
    try {
      if (!/^https?:\/\//i.test(value)) return false;
      const url = new URL(value);
      return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'Please enter a valid HTTP or HTTPS URL.'),
});

type UrlFormValues = z.infer<typeof urlSchema>;

export default function Home() {
  const [result, setResult] = useState<{ shortUrl: string; shortCode: string; originalUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const createUrlMutation = useCreateUrl();

  const form = useForm<UrlFormValues>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      originalUrl: '',
    },
  });

  const onSubmit = (data: UrlFormValues) => {
    setResult(null);
    setCopied(false);
    createUrlMutation.mutate(
      { data: { originalUrl: data.originalUrl } },
      {
        onSuccess: (response) => {
          let absoluteUrl = response.shortUrl;
          if (absoluteUrl.startsWith('/')) {
            absoluteUrl = `${window.location.origin}${absoluteUrl}`;
          }
          setResult({ shortUrl: absoluteUrl, shortCode: response.shortCode, originalUrl: response.originalUrl });
          form.reset();
        },
        onError: (error) => {
          const details = (error as { data?: { error?: string } }).data?.error;
          toast({
            variant: "destructive",
            title: "Error creating short URL",
            description: details || "The request failed. Please try again.",
          });
        }
      }
    );
  };

  const copyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please manually copy the URL.",
      });
    }
  };

  return (
    <div className={`min-h-screen min-h-[100dvh] flex flex-col justify-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${result ? 'py-2 sm:py-3' : 'py-4 sm:py-6'}`}>
      <header className={`text-center ${result ? 'mb-4 sm:mb-7' : 'mb-6 sm:mb-8'}`}>
        <div className={`inline-flex items-center justify-center bg-primary/10 rounded-2xl ${result ? 'p-2.5 mb-2 sm:p-3 sm:mb-3' : 'p-3 mb-3'}`}>
          <LinkIcon className="w-7 h-7 text-primary" />
        </div>
        <h1 className={`text-3xl sm:text-4xl font-bold tracking-tight text-foreground ${result ? 'mb-2 sm:mb-3' : 'mb-3'}`}>
          Shorten Your Link
        </h1>
        <p className={`text-muted-foreground text-base sm:text-lg max-w-xl mx-auto ${result ? 'max-sm:hidden' : ''}`}>
          A fast, simple utility to compress long URLs into shareable links.
        </p>
      </header>

      <main className={`flex flex-col ${result ? 'gap-4 sm:gap-6' : 'gap-6 sm:gap-7'}`}>
        <Card className="border-muted shadow-sm">
          <CardContent className={result ? 'pt-4 pb-4 sm:pt-5 sm:pb-5' : 'pt-5 pb-5 sm:pt-6 sm:pb-6'}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="originalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <Input 
                            aria-label="Original URL"
                            type="text"
                            inputMode="url"
                            placeholder="https://very-long-url.com/something-you-want-to-shorten" 
                            className="h-11 text-base flex-1 bg-background"
                            data-testid="input-url"
                            {...field} 
                          />
                          <Button 
                            type="submit" 
                            size="lg" 
                            className="h-11 px-8 w-full sm:w-auto font-medium"
                            disabled={createUrlMutation.isPending}
                            data-testid="button-shorten"
                          >
                            {createUrlMutation.isPending ? (
                              <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <ArrowRight className="w-5 h-5 mr-2" />
                            )}
                            {createUrlMutation.isPending ? 'Working on it...' : 'Shorten URL'}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage data-testid="error-message" />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {result && (
              <div role="status" aria-live="polite" className="mt-4 pt-4 sm:mt-5 sm:pt-5 border-t border-border animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-sm font-semibold text-primary mb-2">Your link is ready</p>
                <p className="text-sm font-medium text-muted-foreground mb-1">Short URL</p>
                <div className="flex items-center justify-between p-2.5 sm:p-3 bg-secondary/50 rounded-lg border border-secondary-border group min-w-0">
                  <a 
                    href={result.shortUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={result.shortUrl}
                    className="text-base sm:text-lg font-semibold text-primary hover:underline flex min-w-0 mr-3"
                    data-testid="text-short-url"
                  >
                    <span className="truncate min-w-0">{result.shortUrl.slice(0, -result.shortCode.length - 1)}</span>
                    <span className="shrink-0">/{result.shortCode}</span>
                  </a>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyToClipboard}
                    className="shrink-0"
                    data-testid="button-copy"
                    aria-label="Copy URL"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </Button>
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-3 mb-1">Original URL</p>
                <p className="text-sm text-foreground truncate" title={result.originalUrl} data-testid="text-original-url">
                  {result.originalUrl}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Advertisement Area 1 */}
          <div
            className={`w-full ${result ? 'h-12 sm:h-14' : 'h-16 sm:h-20'} bg-muted/50 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground/60 text-sm font-medium uppercase tracking-wider`}
            data-testid="ad-area-1"
          >
            Advertisement
          </div>
          {/* Advertisement Area 2 — kept off phones to preserve space */}
          <div
            className={`hidden sm:flex w-full ${result ? 'sm:h-14' : 'sm:h-20'} bg-muted/50 border border-dashed border-border rounded-xl items-center justify-center text-muted-foreground/60 text-sm font-medium uppercase tracking-wider`}
            data-testid="ad-area-2"
          >
            Advertisement
          </div>
        </div>
      </main>

      <footer className={`${result ? 'mt-3 sm:mt-4' : 'mt-4 sm:mt-5'} text-center`}>
        <div className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} URL Shortener. Focused utility.
        </div>
      </footer>
    </div>
  );
}
