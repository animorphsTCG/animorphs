
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Zap, Users, Award } from "lucide-react";

const FeatureSection = () => {
  const features = [
    {
      title: "Strategic Battles",
      description: "Engage in turn-based strategic gameplay with unique Animorph cards",
      icon: <Shield className="h-12 w-12 text-fantasy-accent" />
    },
    {
      title: "Collect Rare Cards",
      description: "Build your deck with powerful cards, each with unique abilities and stats",
      icon: <Zap className="h-12 w-12 text-fantasy-accent" />
    },
    {
      title: "Play Online",
      description: "Challenge other players around the world in real-time battles",
      icon: <Users className="h-12 w-12 text-fantasy-accent" />
    },
    {
      title: "Earn Rewards",
      description: "Win battles to earn in-game currency and unlock exclusive content",
      icon: <Award className="h-12 w-12 text-fantasy-accent" />
    }
  ];

  return (
    <section className="py-24 bg-black/60">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 font-fantasy">
          Game <span className="text-fantasy-accent">Features</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-black/50 border border-fantasy-primary/50 hover:border-fantasy-accent transition-colors duration-300">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="mb-6 p-3 rounded-full bg-fantasy-primary/20 glow-effect">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
