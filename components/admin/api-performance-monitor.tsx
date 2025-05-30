'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  performanceMonitor, 
  cacheManager,
  subscriptionManager 
} from '@/lib/services/index-optimized';
import { RefreshCw, Trash2, Activity } from 'lucide-react';

interface CacheStats {
  size: number;
  keys: string[];
  hitRate: number;
}

interface ApiCall {
  operation: string;
  duration: number;
  timestamp: Date;
  status: 'fast' | 'normal' | 'slow';
}

export function ApiPerformanceMonitor() {
  const [cacheStats, setCacheStats] = useState<CacheStats>({ size: 0, keys: [], hitRate: 0 });
  const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Initial load
    updateStats();

    // Update every 5 seconds
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    // Get cache statistics
    const stats = cacheManager.getStats();
    setCacheStats(stats);

    // Get active subscriptions count
    setActiveSubscriptions(subscriptionManager.subscriptions.size);
  };

  const refreshStats = async () => {
    setIsRefreshing(true);
    updateStats();
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  const clearCache = (pattern?: string) => {
    if (pattern) {
      cacheManager.invalidatePattern(new RegExp(pattern));
    } else {
      performanceMonitor.clearAllCaches();
    }
    updateStats();
  };

  const getStatusBadge = (status: ApiCall['status']) => {
    switch (status) {
      case 'fast':
        return <Badge variant="default" className="bg-green-500">Fast</Badge>;
      case 'normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'slow':
        return <Badge variant="destructive">Slow</Badge>;
    }
  };

  const getCacheTypeFromKey = (key: string): string => {
    if (key.startsWith('static:')) return 'Static Data';
    if (key.startsWith('events:')) return 'Events';
    if (key.startsWith('event:')) return 'Event Details';
    if (key.startsWith('lodges:')) return 'Lodges';
    if (key.startsWith('org:')) return 'Organizations';
    if (key.startsWith('registration')) return 'Registrations';
    if (key.startsWith('attendees:')) return 'Attendees';
    return 'Other';
  };

  const groupCacheKeys = () => {
    const groups: Record<string, number> = {};
    cacheStats.keys.forEach(key => {
      const type = getCacheTypeFromKey(key);
      groups[type] = (groups[type] || 0) + 1;
    });
    return groups;
  };

  const cacheGroups = groupCacheKeys();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of API calls and cache performance
          </p>
        </div>
        <Button 
          onClick={refreshStats} 
          disabled={isRefreshing}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.hitRate.toFixed(1)}%</div>
            <Progress value={cacheStats.hitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cached Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheStats.size}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {Object.keys(cacheGroups).length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiCalls.length > 0 
                ? `${Math.round(apiCalls.reduce((a, b) => a + b.duration, 0) / apiCalls.length)}ms`
                : '0ms'
              }
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {apiCalls.length} calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cache Breakdown</CardTitle>
            <Button 
              onClick={() => clearCache()} 
              variant="destructive" 
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          <CardDescription>
            Distribution of cached items by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(cacheGroups).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{type}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <Button
                  onClick={() => {
                    const pattern = type === 'Events' ? '^events:' 
                      : type === 'Event Details' ? '^event:'
                      : type === 'Lodges' ? '^lodges:'
                      : type === 'Organizations' ? '^org:'
                      : type === 'Registrations' ? '^registration'
                      : type === 'Attendees' ? '^attendees:'
                      : '';
                    if (pattern) clearCache(pattern);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent API Calls */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>
            Last 10 API operations with performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiCalls.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No API calls recorded yet. Perform some operations to see metrics.
            </p>
          ) : (
            <div className="space-y-2">
              {apiCalls.slice(-10).reverse().map((call, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{call.operation}</span>
                    {getStatusBadge(call.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{call.duration}ms</span>
                    <span>{call.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>
                Cache hit rate above 80% indicates good performance. Current: {cacheStats.hitRate.toFixed(1)}%
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500">•</span>
              <span>
                Static data (grand lodges, titles) is cached indefinitely for optimal performance
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-500">•</span>
              <span>
                Event and registration data has shorter TTL (1-2 min) to balance freshness and performance
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500">•</span>
              <span>
                Use prefetch strategies at the start of user flows to minimize perceived latency
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}