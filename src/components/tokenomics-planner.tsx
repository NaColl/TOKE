'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const TokenomicsPlanner = () => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [totalSupply, setTotalSupply] = useState(1000000000);
  const [initialTokenPrice, setInitialTokenPrice] = useState(0.001);
  const [fdv, setFdv] = useState(0);

  const TGE_CATEGORIES = ['publicSale', 'privateRounds', 'liquidityPool', 'ecosystem'];

  const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEEAD', '#D4A5A5', '#9B59B6'
  ];

  const [distribution, setDistribution] = useState({
    publicSale: { 
      percentage: 20,
      tge: 10,
      cliff: 0,
      duration: 12
    },
    privateRounds: {
      percentage: 15,
      tge: 5,
      cliff: 6,
      duration: 24
    },
    teamAndAdvisors: {
      percentage: 15,
      tge: 0,
      cliff: 12,
      duration: 36
    },
    development: {
      percentage: 20,
      tge: 0,
      cliff: 6,
      duration: 48
    },
    ecosystem: {
      percentage: 15,
      tge: 5,
      cliff: 3,
      duration: 36
    },
    treasury: {
      percentage: 10,
      tge: 0,
      cliff: 12,
      duration: 48
    },
    liquidityPool: {
      percentage: 5,
      tge: 20,
      cliff: 0,
      duration: 24
    }
  });

  // Calculate total percentage
  const totalPercentage = Object.values(distribution).reduce(
    (sum, data) => sum + data.percentage, 
    0
  );

  useEffect(() => {
    const newFdv = totalSupply * initialTokenPrice;
    setFdv(newFdv);
  }, [totalSupply, initialTokenPrice]);

  const generateUnlockSchedule = () => {
    const months = 48;
    const schedule = Array.from({ length: months }, (_, month) => ({
      month: month + 1,
      circulating: 0
    }));

    Object.entries(distribution).forEach(([category, data]) => {
      const tokenAmount = (totalSupply * data.percentage) / 100;
      const tgeAmount = (tokenAmount * data.tge) / 100;
      const remainingAmount = tokenAmount - tgeAmount;
      const monthlyUnlock = data.duration > 0 ? remainingAmount / data.duration : 0;

      schedule.forEach((point, idx) => {
        if (idx === 0) {
          point.circulating += tgeAmount;
        } else if (idx >= data.cliff && idx < data.cliff + data.duration) {
          point.circulating += monthlyUnlock;
        }
      });
    });

    let cumulative = 0;
    return schedule.map(point => {
      cumulative += point.circulating;
      return {
        ...point,
        circulating: cumulative,
        percentCirculating: (cumulative / totalSupply) * 100
      };
    });
  };

  const unlockSchedule = generateUnlockSchedule();

  const calculateMetrics = () => {
    const tgeCirculating = unlockSchedule[0].circulating;
    const tgeCirculatingPercent = (tgeCirculating / totalSupply) * 100;

    return {
      tgeCirculating,
      tgeCirculatingPercent,
      initialMarketCap: tgeCirculating * initialTokenPrice,
      warnings: [
        tgeCirculatingPercent > 25 && "High TGE unlock may cause price instability",
        fdv / (tgeCirculating * initialTokenPrice) > 100 && "High FDV/MCap ratio indicates significant future dilution",
        distribution.teamAndAdvisors.percentage > 20 && "Team allocation appears high",
        distribution.liquidityPool.percentage < 5 && "Low liquidity allocation may cause price volatility"
      ].filter(Boolean)
    };
  };

  const metrics = calculateMetrics();

  const handleDistributionChange = (category, field, value) => {
    const numValue = Number(value);

    if (field === 'percentage') {
      // Calculate what the total would be with the new value
      const otherCategoriesTotal = Object.entries(distribution)
        .filter(([cat]) => cat !== category)
        .reduce((sum, [_, data]) => sum + data.percentage, 0);

      const newTotal = otherCategoriesTotal + numValue;

      // Only update if total would not exceed 100%
      if (newTotal <= 100) {
        setDistribution(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            [field]: numValue
          }
        }));
      }
    } else {
      // For other fields (tge, cliff, duration), update normally
      setDistribution(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: numValue
        }
      }));
    }
  };

  // State for chart options
  const [chartOptions, setChartOptions] = useState({
    showGrid: true,
    showLegend: true
  });

  const handleChartOptionChange = (option, checked) => {
    setChartOptions(prev => ({
      ...prev,
      [option]: checked
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Advanced Tokenomics Planner
            <Info className="w-4 h-4 text-gray-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Supply</label>
                  <Input
                    type="number"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Token Price ($)</label>
                  <Input
                    type="number"
                    value={initialTokenPrice}
                    onChange={(e) => setInitialTokenPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Allocation</span>
                  <span className={`text-lg font-medium ${totalPercentage > 100 ? 'text-red-500' : 'text-green-500'}`}>
                    {totalPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                  <div 
                    className={`h-2 rounded-full ${totalPercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Initial Market Cap</div>
                  <div className="text-lg font-medium">
                    ${metrics.initialMarketCap.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Fully Diluted Valuation</div>
                  <div className="text-lg font-medium">${fdv.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">TGE Circulating %</div>
                  <div className="text-lg font-medium">
                    {metrics.tgeCirculatingPercent.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">FDV/MCap Ratio</div>
                  <div className="text-lg font-medium">
                    {(fdv / metrics.initialMarketCap).toFixed(2)}x
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(distribution).map(([category, data]) => (
                  <div key={category} className="space-y-2 border rounded-lg p-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    >
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <div className="text-sm text-gray-500">
                          {data.percentage}% ({((totalSupply * data.percentage) / 100).toLocaleString()} tokens)
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {expandedCategory === category ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>

                    <Slider
                      value={[data.percentage]}
                      onValueChange={(newValue) => handleDistributionChange(category, 'percentage', newValue[0])}
                      max={100}
                      step={1}
                      className={totalPercentage > 100 ? 'opacity-50' : ''}
                    />

                    {expandedCategory === category && (
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        {TGE_CATEGORIES.includes(category) && (
                          <div>
                            <label className="text-sm text-gray-500">TGE Unlock %</label>
                            <Input
                              type="number"
                              value={data.tge}
                              onChange={(e) => handleDistributionChange(category, 'tge', e.target.value)}
                              className="mt-1"
                              min="0"
                              max="100"
                            />
                          </div>
                        )}
                        <div>
                          <label className="text-sm text-gray-500">Cliff (months)</label>
                          <Input
                            type="number"
                            value={data.cliff}
                            onChange={(e) => handleDistributionChange(category, 'cliff', e.target.value)}
                            className="mt-1"
                            min="0"
                          />
                        </div>
                        <div className={TGE_CATEGORIES.includes(category) ? 'col-span-2' : 'col-span-1'}>
                          <label className="text-sm text-gray-500">Vesting Duration (months)</label>
                          <Input
                            type="number"
                            value={data.duration}
                            onChange={(e) => handleDistributionChange(category, 'duration', e.target.value)}
                            className="mt-1"
                            min="0"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {metrics.warnings.length > 0 && (
                <div className="space-y-2">
                  {metrics.warnings.map((warning, idx) => (
                    <Alert key={idx} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <PieChart width={400} height={300}>
                  <Pie
                    data={Object.entries(distribution).map(([name, data]) => ({
                      name: name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                      value: data.percentage
                    }))}
                    cx={200}
                    cy={150}
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {Object.entries(distribution).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-4">Token Unlock Schedule</h3>
                <div className="text-sm text-gray-500 mb-2">
                  Shows cumulative circulating supply percentage over time (months)
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={chartOptions.showGrid}
                    onChange={(e) => handleChartOptionChange('showGrid', e.target.checked)}
                  />
                  <span className="text-sm text-gray-500">Show Grid</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={chartOptions.showLegend}
                    onChange={(e) => handleChartOptionChange('showLegend', e.target.checked)}
                  />
                  <span className="text-sm text-gray-500">Show Legend</span>
                </div>
                <LineChart width={400} height={250} data={unlockSchedule}>
                  {chartOptions.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                  <XAxis 
                    dataKey="month" 
                    label={{ value: 'Months after TGE', position: 'bottom' }}
                  />
                  <YAxis 
                    label={{ value: 'Circulating Supply %', angle: -90, position: 'left' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value) => `${value.toFixed(2)}%`}
                    labelFormatter={(month) => `Month ${month}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentCirculating" 
                    stroke="#8884d8" 
                    name="Circulating Supply %"
                  />
                  {chartOptions.showLegend && <Legend />}
                </LineChart>
                <div className="text-xs text-gray-400 mt-2">
                  * Month 0 represents TGE (Token Generation Event)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenomicsPlanner;