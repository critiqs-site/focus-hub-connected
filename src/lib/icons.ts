import {
  Sun, Moon, Sunrise, Star, Briefcase, Home, Target, Dumbbell, BookOpen, Palette,
  PersonStanding, Droplets, Coffee, Utensils, Bed, Timer, Heart, Brain, Footprints,
  Bike, Lightbulb, Droplet, TrendingUp, Flame, Apple, Music, Pencil, Clock, Zap,
  Trophy, Smile, Shield, Leaf, Eye, Wind, Mountain, Waves, TreePine, Flower2,
  Headphones, Camera, Gamepad2, Dog, Cat, Baby, Plane, Car, Ship, MapPin,
  Compass, Globe, Flag, Bell, Gift, Gem, Crown, Rocket, Sparkles, PartyPopper,
  CloudSun, Umbrella, Snowflake, ThermometerSun, Salad, Sandwich, Pizza, IceCreamCone,
  Wine, Beer, Pill, Stethoscope, Activity, Syringe, Scissors, Wrench, Hammer, 
  PaintBucket, Brush, Mic, Radio, Tv, Smartphone, Laptop, Monitor, Wifi,
  Battery, Calculator, Calendar, ClipboardList, FileText, Mail, Phone, Search,
  Settings, Lock, Key, Bookmark, Tag, Hash, AtSign, Link, Share2, Download,
  Upload, RefreshCw, RotateCcw, ChevronRight, CircleDot, Hexagon, Pentagon,
  type LucideIcon,
} from "lucide-react";

// ── Section / Divider icons (30) ──────────────────────────────
export const DIVIDER_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: "Sun", icon: Sun, label: "Morning" },
  { name: "Moon", icon: Moon, label: "Night" },
  { name: "Sunrise", icon: Sunrise, label: "Dawn" },
  { name: "Star", icon: Star, label: "Priority" },
  { name: "Briefcase", icon: Briefcase, label: "Work" },
  { name: "Home", icon: Home, label: "Home" },
  { name: "Target", icon: Target, label: "Goals" },
  { name: "Dumbbell", icon: Dumbbell, label: "Fitness" },
  { name: "BookOpen", icon: BookOpen, label: "Study" },
  { name: "Palette", icon: Palette, label: "Creative" },
  { name: "Heart", icon: Heart, label: "Health" },
  { name: "Brain", icon: Brain, label: "Mind" },
  { name: "Coffee", icon: Coffee, label: "Break" },
  { name: "Flame", icon: Flame, label: "Intense" },
  { name: "Mountain", icon: Mountain, label: "Outdoor" },
  { name: "Music", icon: Music, label: "Music" },
  { name: "Rocket", icon: Rocket, label: "Hustle" },
  { name: "Crown", icon: Crown, label: "Premium" },
  { name: "Shield", icon: Shield, label: "Defense" },
  { name: "Globe", icon: Globe, label: "Travel" },
  { name: "Sparkles", icon: Sparkles, label: "Vibes" },
  { name: "Calendar", icon: Calendar, label: "Schedule" },
  { name: "CloudSun", icon: CloudSun, label: "Afternoon" },
  { name: "Leaf", icon: Leaf, label: "Nature" },
  { name: "Gem", icon: Gem, label: "Valuable" },
  { name: "Flag", icon: Flag, label: "Milestone" },
  { name: "Compass", icon: Compass, label: "Explore" },
  { name: "Activity", icon: Activity, label: "Active" },
  { name: "ClipboardList", icon: ClipboardList, label: "Checklist" },
  { name: "Settings", icon: Settings, label: "Routine" },
];

// ── Todo / Habit icons (100) ──────────────────────────────────
export const TODO_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  // Body & Fitness
  { name: "PersonStanding", icon: PersonStanding, label: "Meditation" },
  { name: "Dumbbell", icon: Dumbbell, label: "Exercise" },
  { name: "Footprints", icon: Footprints, label: "Walking" },
  { name: "Bike", icon: Bike, label: "Cycling" },
  { name: "Heart", icon: Heart, label: "Cardio" },
  { name: "Activity", icon: Activity, label: "Workout" },
  { name: "Mountain", icon: Mountain, label: "Hiking" },
  { name: "Waves", icon: Waves, label: "Swimming" },
  { name: "Wind", icon: Wind, label: "Breathing" },
  { name: "Shield", icon: Shield, label: "Strength" },
  // Mind & Learning
  { name: "Brain", icon: Brain, label: "Learning" },
  { name: "BookOpen", icon: BookOpen, label: "Reading" },
  { name: "Lightbulb", icon: Lightbulb, label: "Ideas" },
  { name: "Pencil", icon: Pencil, label: "Writing" },
  { name: "Target", icon: Target, label: "Goals" },
  { name: "Laptop", icon: Laptop, label: "Coding" },
  { name: "Monitor", icon: Monitor, label: "Screen" },
  { name: "Calculator", icon: Calculator, label: "Math" },
  { name: "Search", icon: Search, label: "Research" },
  { name: "FileText", icon: FileText, label: "Notes" },
  // Food & Drink
  { name: "Utensils", icon: Utensils, label: "Eating" },
  { name: "Coffee", icon: Coffee, label: "Coffee" },
  { name: "Droplets", icon: Droplets, label: "Water" },
  { name: "Apple", icon: Apple, label: "Fruit" },
  { name: "Salad", icon: Salad, label: "Salad" },
  { name: "Sandwich", icon: Sandwich, label: "Meal" },
  { name: "Pizza", icon: Pizza, label: "Cheat Meal" },
  { name: "IceCreamCone", icon: IceCreamCone, label: "Treat" },
  { name: "Wine", icon: Wine, label: "No Alcohol" },
  { name: "Beer", icon: Beer, label: "Drink" },
  // Sleep & Rest
  { name: "Bed", icon: Bed, label: "Sleep" },
  { name: "Moon", icon: Moon, label: "Night" },
  { name: "Sunrise", icon: Sunrise, label: "Wake Up" },
  { name: "Sun", icon: Sun, label: "Morning" },
  { name: "CloudSun", icon: CloudSun, label: "Afternoon" },
  // Time & Focus
  { name: "Timer", icon: Timer, label: "Focus" },
  { name: "Clock", icon: Clock, label: "Time" },
  { name: "Zap", icon: Zap, label: "Energy" },
  { name: "Flame", icon: Flame, label: "Streak" },
  { name: "RefreshCw", icon: RefreshCw, label: "Repeat" },
  // Social & Fun
  { name: "Smile", icon: Smile, label: "Happy" },
  { name: "Music", icon: Music, label: "Music" },
  { name: "Headphones", icon: Headphones, label: "Podcast" },
  { name: "Gamepad2", icon: Gamepad2, label: "Gaming" },
  { name: "Tv", icon: Tv, label: "Watch" },
  { name: "Camera", icon: Camera, label: "Photo" },
  { name: "Mic", icon: Mic, label: "Speaking" },
  { name: "Radio", icon: Radio, label: "Radio" },
  { name: "PartyPopper", icon: PartyPopper, label: "Celebrate" },
  { name: "Gift", icon: Gift, label: "Reward" },
  // Outdoor & Nature
  { name: "TreePine", icon: TreePine, label: "Outdoors" },
  { name: "Leaf", icon: Leaf, label: "Nature" },
  { name: "Flower2", icon: Flower2, label: "Garden" },
  { name: "Umbrella", icon: Umbrella, label: "Rain" },
  { name: "Snowflake", icon: Snowflake, label: "Cold" },
  { name: "ThermometerSun", icon: ThermometerSun, label: "Hot" },
  { name: "Compass", icon: Compass, label: "Explore" },
  { name: "MapPin", icon: MapPin, label: "Location" },
  { name: "Globe", icon: Globe, label: "Travel" },
  { name: "Flag", icon: Flag, label: "Milestone" },
  // Health & Wellness
  { name: "Pill", icon: Pill, label: "Medicine" },
  { name: "Stethoscope", icon: Stethoscope, label: "Doctor" },
  { name: "Syringe", icon: Syringe, label: "Vaccine" },
  { name: "Eye", icon: Eye, label: "Eye Care" },
  { name: "Droplet", icon: Droplets, label: "Hydrate" },
  // Productivity
  { name: "Star", icon: Star, label: "Priority" },
  { name: "Rocket", icon: Rocket, label: "Launch" },
  { name: "Trophy", icon: Trophy, label: "Win" },
  { name: "Crown", icon: Crown, label: "Best" },
  { name: "Gem", icon: Gem, label: "Valuable" },
  { name: "Sparkles", icon: Sparkles, label: "Magic" },
  { name: "TrendingUp", icon: TrendingUp, label: "Growth" },
  { name: "Bookmark", icon: Bookmark, label: "Save" },
  { name: "ClipboardList", icon: ClipboardList, label: "Checklist" },
  { name: "Tag", icon: Tag, label: "Label" },
  // Home & Life
  { name: "Home", icon: Home, label: "Home" },
  { name: "Briefcase", icon: Briefcase, label: "Work" },
  { name: "Palette", icon: Palette, label: "Art" },
  { name: "Scissors", icon: Scissors, label: "Grooming" },
  { name: "Brush", icon: Brush, label: "Clean" },
  { name: "Wrench", icon: Wrench, label: "Fix" },
  { name: "Hammer", icon: Hammer, label: "Build" },
  { name: "PaintBucket", icon: PaintBucket, label: "Design" },
  { name: "Key", icon: Key, label: "Security" },
  { name: "Lock", icon: Lock, label: "Privacy" },
  // People & Pets
  { name: "Dog", icon: Dog, label: "Dog" },
  { name: "Cat", icon: Cat, label: "Cat" },
  { name: "Baby", icon: Baby, label: "Family" },
  { name: "Phone", icon: Phone, label: "Call" },
  { name: "Mail", icon: Mail, label: "Email" },
  { name: "Share2", icon: Share2, label: "Share" },
  // Transport
  { name: "Car", icon: Car, label: "Drive" },
  { name: "Plane", icon: Plane, label: "Fly" },
  { name: "Ship", icon: Ship, label: "Boat" },
  // Tech
  { name: "Smartphone", icon: Smartphone, label: "Phone" },
  { name: "Wifi", icon: Wifi, label: "Online" },
  { name: "Battery", icon: Battery, label: "Recharge" },
  { name: "Download", icon: Download, label: "Download" },
  { name: "Upload", icon: Upload, label: "Upload" },
  { name: "Settings", icon: Settings, label: "Settings" },
  { name: "Bell", icon: Bell, label: "Reminder" },
];

// ── Master icon map (for resolving icon names) ───────────────
const iconMap: Record<string, LucideIcon> = {};
TODO_ICONS.forEach(i => { iconMap[i.name] = i.icon; });
DIVIDER_ICONS.forEach(i => { iconMap[i.name] = i.icon; });
// Extra aliases
iconMap["Droplet"] = Droplets;

export function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] || Target;
}

// Exported name lists for AI prompt building
export const TODO_ICON_NAMES = TODO_ICONS.map(i => i.name);
export const DIVIDER_ICON_NAMES = DIVIDER_ICONS.map(i => i.name);
