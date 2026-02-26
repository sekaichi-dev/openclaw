"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePolling } from "@/hooks/use-polling";
import { 
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Zap,
  Clock,
  Star,
  Users,
  Activity,
  X,
  Filter,
  Archive,
  MoreVertical
} from "lucide-react";

interface SmartNotification {
  id: string;
  type: "alert" | "success" | "info" | "warning" | "opportunity" | "milestone";
  priority: "low" | "medium" | "high" | "critical";
  category: "system" | "business" | "guests" | "finance" | "automation" | "agents";
  title: string;
  message: string;
  timestamp: number;
  source: string;
  actionable: boolean;
  action?: {
    label: string;
    url?: string;
    dangerous?: boolean;
  };
  metadata?: {
    value?: string;
    trend?: number;
    impact?: string;
  };
  dismissed?: boolean;
  read?: boolean;
}

interface NotificationsData {
  notifications: SmartNotification[];
  unreadCount: number;
  criticalCount: number;
  categories: {
    category: string;
    count: number;
    urgent: number;
  }[];
}

const NOTIFICATION_ICONS = {
  alert: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  opportunity: TrendingUp,
  milestone: Star
};

const PRIORITY_COLORS = {
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
  high: "text-orange-400 bg-orange-500/10 border-orange-500/30", 
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  low: "text-blue-400 bg-blue-500/10 border-blue-500/30"
};

const CATEGORY_ICONS = {
  system: Activity,
  business: TrendingUp,
  guests: Users,
  finance: DollarSign,
  automation: Zap,
  agents: MessageSquare
};

const CATEGORY_COLORS = {
  system: "text-gray-400",
  business: "text-green-400", 
  guests: "text-purple-400",
  finance: "text-yellow-400",
  automation: "text-blue-400",
  agents: "text-pink-400"
};

export function SmartNotificationsCard() {
  const [filter, setFilter] = useState<string>("all");
  const [showRead, setShowRead] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());
  
  const { data: notificationsData, loading } = usePolling<NotificationsData>(
    "/api/smart-notifications", 
    30000, // Base refresh every 30 seconds
    undefined,
    {
      priority: "critical",
      adaptiveInterval: true,
      retryCount: 3
    }
  );

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => new Set([...prev, id]));
  };

  const getFilteredNotifications = () => {
    if (!notificationsData) return [];
    
    return notificationsData.notifications.filter(notification => {
      // Apply dismissed filter
      if (dismissedNotifications.has(notification.id)) return false;
      
      // Apply read filter
      if (!showRead && notification.read) return false;
      
      // Apply category filter
      if (filter !== "all" && notification.category !== filter) return false;
      
      return true;
    });
  };

  const markAsRead = (id: string) => {
    // In a real implementation, this would update the backend
    console.log("Marking notification as read:", id);
  };

  if (loading || !notificationsData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Smart Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredNotifications = getFilteredNotifications();
  const criticalNotifications = filteredNotifications.filter(n => n.priority === "critical");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Smart Notifications
          </CardTitle>
          <div className="flex items-center gap-2">
            {notificationsData.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {notificationsData.unreadCount}
              </Badge>
            )}
            {criticalNotifications.length > 0 && (
              <Badge variant="outline" className="text-xs text-red-400 border-red-400">
                {criticalNotifications.length} critical
              </Badge>
            )}
          </div>
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-1 mt-3 overflow-x-auto">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-xs px-2"
          >
            All ({filteredNotifications.length})
          </Button>
          {notificationsData.categories.map(cat => {
            const Icon = CATEGORY_ICONS[cat.category as keyof typeof CATEGORY_ICONS];
            const colorClass = CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS];
            return (
              <Button
                key={cat.category}
                variant={filter === cat.category ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilter(cat.category)}
                className="text-xs px-2 flex items-center gap-1"
              >
                <Icon className={`h-3 w-3 ${colorClass}`} />
                {cat.count}
                {cat.urgent > 0 && (
                  <Badge variant="destructive" className="text-xs h-4 px-1">
                    {cat.urgent}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Notifications List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications to show</p>
                <p className="text-xs">All caught up! 🎉</p>
              </div>
            ) : (
              filteredNotifications.slice(0, 10).map(notification => {
                const Icon = NOTIFICATION_ICONS[notification.type];
                const priorityClass = PRIORITY_COLORS[notification.priority];
                const categoryIcon = CATEGORY_ICONS[notification.category as keyof typeof CATEGORY_ICONS];
                const CategoryIcon = categoryIcon;
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all hover:shadow-sm ${priorityClass} ${
                      !notification.read ? "border-l-4" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            <Badge variant="outline" className="text-xs px-1">
                              <CategoryIcon className="h-2 w-2 mr-1" />
                              {notification.source}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.metadata && (
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              {notification.metadata.value && (
                                <span className="font-medium">
                                  {notification.metadata.value}
                                </span>
                              )}
                              {notification.metadata.trend && (
                                <span className={
                                  notification.metadata.trend > 0 
                                    ? "text-green-400" 
                                    : "text-red-400"
                                }>
                                  {notification.metadata.trend > 0 ? "↗" : "↘"} 
                                  {Math.abs(notification.metadata.trend).toFixed(1)}%
                                </span>
                              )}
                              {notification.metadata.impact && (
                                <span className="text-blue-400">
                                  {notification.metadata.impact}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </span>
                            <div className="flex items-center gap-1">
                              {notification.action && (
                                <Button
                                  size="sm"
                                  variant={notification.action.dangerous ? "destructive" : "secondary"}
                                  className="text-xs h-6 px-2"
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Summary Footer */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {filteredNotifications.length} notifications 
              {filter !== "all" && ` in ${filter}`}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRead(!showRead)}
                className="text-xs h-6"
              >
                {showRead ? "Hide read" : "Show read"}
              </Button>
              {notificationsData.unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm" 
                  className="text-xs h-6"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}