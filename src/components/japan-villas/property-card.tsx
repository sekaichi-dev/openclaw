import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { MapPin, Clock, ExternalLink, Hash } from "lucide-react";

export interface Property {
  name: string;
  location: string;
  airbnbUrl?: string;
  checkIn: string;
  checkOut: string;
  beds24Id: string;
}

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{property.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {property.location}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Check-in {property.checkIn} / Check-out {property.checkOut}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-3.5 w-3.5 shrink-0" />
          Beds24 ID: {property.beds24Id}
        </div>
        {property.airbnbUrl && (
          <a
            href={property.airbnbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Airbnb Listing
          </a>
        )}
      </CardContent>
    </Card>
  );
}
