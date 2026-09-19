'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, Loader2, MapPin, Route as RouteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { uzbekistanCities, calculateDistance } from '@/lib/uzbekistan-data';
import { optimizeRoute } from '@/lib/route-optimizer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  routeSummary?: {
    from: string;
    to: string;
    distance: number;
    time: number;
    cost: number;
    safety: number;
  };
}

const suggestions = [
  'Find safest route from Tashkent to Samarkand',
  'How much will it cost to deliver 10 tons to Bukhara?',
  'Where can I rest between Andijan and Tashkent?',
  'Compare routes from Urgench to Tashkent',
];

export function AIChatbot({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Salom! I'm your Karvonboshi AI assistant. I can help you find optimal routes, estimate costs, locate rest stops, and more. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const findCityInText = (text: string): CityMatch | null => {
    const lowerText = text.toLowerCase();
    for (const city of uzbekistanCities) {
      const names = [city.name.toLowerCase(), city.nameUz.toLowerCase()];
      for (const name of names) {
        if (lowerText.includes(name)) {
          return { city, matchText: name };
        }
      }
    }
    return null;
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);

    // Simulate AI processing
    await new Promise((r) => setTimeout(r, 800));

    let response = '';
    let routeSummary: Message['routeSummary'] = undefined;

    const lowerMsg = message.toLowerCase();

    // Try to find route-related queries
    const fromMatch = findCityInText(message);
    const remainingText = fromMatch ? message.slice(message.toLowerCase().indexOf(fromMatch.matchText) + fromMatch.matchText.length) : '';
    const toMatch = findCityInText(remainingText);

    if ((lowerMsg.includes('route') || lowerMsg.includes('from') || lowerMsg.includes('to') || lowerMsg.includes('deliver')) && fromMatch && toMatch) {
      const result = optimizeRoute({
        origin: { lat: fromMatch.city.lat, lng: fromMatch.city.lng, address: fromMatch.city.name },
        destination: { lat: toMatch.city.lat, lng: toMatch.city.lng, address: toMatch.city.name },
        cargoType: 'general',
        cargoWeight: 5,
        vehicleType: 'truck',
        priorities: { safety: 1, roadQuality: 0.8, speed: 0.7, cost: 0.9, comfort: 0.6, reliability: 0.7, foodRest: 0.5 },
      });

      response = `Here's the optimal route from ${fromMatch.city.name} to ${toMatch.city.name}:\n\n` +
        `Distance: ${result.route.total_distance} km\n` +
        `Estimated time: ${Math.floor(result.route.estimated_time)}h ${Math.round((result.route.estimated_time % 1) * 60)}m\n` +
        `Cost: ${result.route.estimated_cost.toLocaleString()} UZS\n` +
        `Safety score: ${result.route.safety_score}/10\n` +
        `Overall score: ${result.route.overall_score}/10\n\n`;

      if (result.route.rest_stops.length > 0) {
        response += `Recommended rest stops:\n`;
        result.route.rest_stops.slice(0, 3).forEach((stop) => {
          response += `• ${stop.name} (${stop.rating}★, ${stop.distance_from_route}km from route)\n`;
        });
      }

      if (result.route.alerts.length > 0) {
        response += `\nAlerts:\n`;
        result.route.alerts.forEach((alert) => {
          response += `⚠ ${alert.description}\n`;
        });
      }

      routeSummary = {
        from: fromMatch.city.name,
        to: toMatch.city.name,
        distance: result.route.total_distance,
        time: result.route.estimated_time,
        cost: result.route.estimated_cost,
        safety: result.route.safety_score,
      };
    } else if (lowerMsg.includes('cost') || lowerMsg.includes('how much') || lowerMsg.includes('price')) {
      const weightMatch = message.match(/(\d+)\s*ton/);
      const weight = weightMatch ? parseInt(weightMatch[1]) : 5;
      const city = (fromMatch || toMatch)?.city;

      if (city) {
        const tashkent = uzbekistanCities.find((c) => c.name === 'Tashkent')!;
        const dist = calculateDistance(tashkent.lat, tashkent.lng, city.lat, city.lng);
        const fuelCost = (dist / 100) * 30 * 18500;
        const driverWage = (dist / 75) * 50000;
        const total = Math.round(fuelCost + driverWage);
        response = `Estimated delivery cost from Tashkent to ${city.name}:\n\n` +
          `Distance: ~${Math.round(dist)} km\n` +
          `Cargo: ${weight} tons\n` +
          `Fuel cost: ~${Math.round(fuelCost).toLocaleString()} UZS\n` +
          `Driver wages: ~${Math.round(driverWage).toLocaleString()} UZS\n` +
          `Total estimated: ~${total.toLocaleString()} UZS\n\n` +
          `Note: Actual costs may vary based on road conditions, tolls, and real-time fuel prices.`;
      } else {
        response = `I can estimate delivery costs! Try asking like: "How much will it cost to deliver 10 tons from Tashkent to Bukhara?"`;
      }
    } else if (lowerMsg.includes('rest') || lowerMsg.includes('stop') || lowerMsg.includes('hotel') || lowerMsg.includes('food')) {
      const city = (fromMatch || toMatch)?.city;
      if (city) {
        const result = optimizeRoute({
          origin: { lat: city.lat, lng: city.lng, address: city.name },
          destination: { lat: city.lat + 1, lng: city.lng + 1, address: 'nearby' },
          cargoType: 'general',
          cargoWeight: 5,
          vehicleType: 'truck',
          priorities: { safety: 1, roadQuality: 0.8, speed: 0.7, cost: 0.9, comfort: 0.6, reliability: 0.7, foodRest: 1 },
        });
        if (result.route.rest_stops.length > 0) {
          response = `Rest stops near ${city.name}:\n\n`;
          result.route.rest_stops.slice(0, 5).forEach((stop) => {
            response += `• ${stop.name}\n  Type: ${stop.type}, Rating: ${stop.rating}★\n  Address: ${stop.address}\n  Amenities: ${stop.amenities.join(', ')}\n\n`;
          });
        } else {
          response = `I couldn't find specific rest stops near ${city.name}, but I recommend checking highway complexes along the M-39 or M-37 corridors.`;
        }
      } else {
        response = `I can help you find rest stops! Try asking: "Where can I rest between Tashkent and Samarkand?"`;
      }
    } else if (lowerMsg.includes('safest') || lowerMsg.includes('safety')) {
      const city1 = fromMatch?.city;
      const city2 = toMatch?.city;
      if (city1 && city2) {
        const result = optimizeRoute({
          origin: { lat: city1.lat, lng: city1.lng, address: city1.name },
          destination: { lat: city2.lat, lng: city2.lng, address: city2.name },
          cargoType: 'general',
          cargoWeight: 5,
          vehicleType: 'truck',
          priorities: { safety: 2, roadQuality: 1, speed: 0.3, cost: 0.3, comfort: 0.5, reliability: 1, foodRest: 0.3 },
        });
        response = `The safest route from ${city1.name} to ${city2.name}:\n\n` +
          `Safety score: ${result.route.safety_score}/10\n` +
          `Road quality: ${result.route.road_quality_score}/10\n` +
          `Distance: ${result.route.total_distance} km\n\n`;
        if (result.route.alerts.length > 0) {
          response += `Safety alerts to watch for:\n`;
          result.route.alerts.forEach((a) => response += `⚠ ${a.description}\n`);
        }
      } else {
        response = `I can find the safest route for you! Try: "Find safest route from Tashkent to Samarkand"`;
      }
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('salom') || lowerMsg.includes('hi')) {
      response = "Salom! How can I help you with your logistics today? I can find routes, estimate costs, locate rest stops, and more.";
    } else {
      response = `I can help you with:\n• Finding optimal routes between cities\n• Estimating delivery costs\n• Locating rest stops and hotels\n• Safety analysis for routes\n\nTry asking: "Find safest route from Tashkent to Samarkand" or "How much to deliver 10 tons to Bukhara?"`;
    }

    setMessages((prev) => [...prev, { role: 'assistant', content: response, routeSummary }]);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] animate-scale-in">
      <Card className="flex flex-col h-[600px] max-h-[calc(100vh-2rem)] shadow-2xl border-2 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-chart-2 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm">Karvonboshi AI</div>
              <div className="text-xs text-white/80">Route Assistant</div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/20 h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 bg-secondary/20">
          {messages.map((msg, idx) => (
            <div key={idx} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              )}>
                {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">U</span>}
              </div>
              <div className={cn(
                'rounded-2xl px-3.5 py-2.5 max-w-[85%] text-sm whitespace-pre-wrap',
                msg.role === 'assistant'
                  ? 'bg-card border border-border rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          {messages.length === 1 && (
            <div className="pt-2 space-y-2">
              <div className="text-xs text-muted-foreground font-medium px-1">Quick suggestions:</div>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about routes, costs, rest stops..."
              className="h-9"
            />
            <Button size="icon" onClick={() => handleSend()} disabled={loading || !input.trim()} className="h-9 w-9 shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface CityMatch {
  city: typeof uzbekistanCities[0];
  matchText: string;
}
