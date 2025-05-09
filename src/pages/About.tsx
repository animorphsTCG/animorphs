
import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8 text-fantasy-accent">About Animorphs Battle</h1>
      
      <div className="bg-black/40 rounded-lg p-6 mb-8 border border-fantasy-primary/30">
        <h2 className="text-2xl font-bold mb-4">The Game</h2>
        <p className="mb-4">
          Animorphs Battle is a strategic card game based on the popular book series. 
          Players build decks with different Animorph characters and battle against each other
          using their unique abilities and stats.
        </p>
        <p>
          The game features multiple battle modes, including single player against AI,
          1v1 multiplayer, and special tournament modes where you can test your skills
          against other players.
        </p>
      </div>
      
      <div className="bg-black/40 rounded-lg p-6 mb-8 border border-fantasy-primary/30">
        <h2 className="text-2xl font-bold mb-4">How to Play</h2>
        <p className="mb-4">
          1. <span className="text-fantasy-accent">Build your deck</span> - Select 10 cards from your collection for battle.
        </p>
        <p className="mb-4">
          2. <span className="text-fantasy-accent">Choose your battle mode</span> - Battle against AI or challenge other players online.
        </p>
        <p className="mb-4">
          3. <span className="text-fantasy-accent">Play your cards</span> - Each round, cards battle based on their stats.
        </p>
        <p className="mb-4">
          4. <span className="text-fantasy-accent">Win rounds</span> - The player who wins the most rounds wins the battle.
        </p>
        <p>
          5. <span className="text-fantasy-accent">Earn rewards</span> - Winning battles earns you points to climb the leaderboard.
        </p>
      </div>
      
      <div className="bg-black/40 rounded-lg p-6 border border-fantasy-primary/30">
        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions, suggestions, or encounter any issues,
          please contact our support team at support@animorphsbattle.com.
        </p>
        <p>
          Follow us on social media for updates and announcements:
          <span className="block mt-2">
            Twitter: @AnimorphsBattle
          </span>
          <span className="block">
            Discord: discord.gg/animorphs-battle
          </span>
        </p>
      </div>
    </div>
  );
};

export default About;
