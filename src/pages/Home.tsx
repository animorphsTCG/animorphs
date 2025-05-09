
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <motion.h1 
          className="text-5xl md:text-7xl font-bold mb-4 text-fantasy-accent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Animorphs Battle
        </motion.h1>
        
        <motion.p 
          className="text-xl max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Engage in strategic card battles with your favorite Animorph characters. 
          Build your deck, challenge opponents, and rise through the ranks.
        </motion.p>
        
        <motion.div 
          className="mt-8 space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link to="/battle" className="bg-fantasy-accent text-black px-6 py-3 rounded-md text-lg font-medium hover:bg-fantasy-accent/80 transition-colors">
            Start Battle
          </Link>
          <Link to="/register" className="bg-transparent border-2 border-fantasy-accent text-fantasy-accent px-6 py-3 rounded-md text-lg font-medium hover:bg-fantasy-accent/20 transition-colors">
            Sign Up
          </Link>
        </motion.div>
      </section>
      
      <motion.section 
        className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <div className="bg-black/40 p-6 rounded-lg border border-fantasy-primary/30">
          <h2 className="text-2xl font-bold mb-4 text-fantasy-accent">Build Your Deck</h2>
          <p className="mb-4">Collect powerful cards and build strategic decks to defeat your opponents.</p>
          <Link to="/deck-builder" className="text-fantasy-accent hover:underline">Learn more →</Link>
        </div>
        
        <div className="bg-black/40 p-6 rounded-lg border border-fantasy-primary/30">
          <h2 className="text-2xl font-bold mb-4 text-fantasy-accent">Challenge Players</h2>
          <p className="mb-4">Test your skills against AI opponents or challenge real players online.</p>
          <Link to="/multiplayer" className="text-fantasy-accent hover:underline">Learn more →</Link>
        </div>
        
        <div className="bg-black/40 p-6 rounded-lg border border-fantasy-primary/30">
          <h2 className="text-2xl font-bold mb-4 text-fantasy-accent">Rise in the Rankings</h2>
          <p className="mb-4">Earn points and climb the leaderboard as you win battles.</p>
          <Link to="/profile" className="text-fantasy-accent hover:underline">Learn more →</Link>
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
