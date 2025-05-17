
import React from 'react';
import { Button } from '@/components/ui/button';
import { DemoBattle } from '@/modules/battle/single-player';

const VisitorDemoBattle: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <DemoBattle />
    </div>
  );
};

export default VisitorDemoBattle;
