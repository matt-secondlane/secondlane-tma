import React, { useState, useEffect } from 'react';
import { 
  ComposedChart, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Bar, Rectangle
} from 'recharts';
import { apiService } from '../../utils/api';
import { Loader } from '../Loader';
import styles from './ProjectChart.module.css';
import { ProjectGraphResponse, GraphDataPoint, OrderData } from '../../types/api';

interface ProjectChartProps {
  projectId: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
};

const CustomBarShape = (props: { x?: number; y?: number; width?: number; height?: number; fill?: string; stroke?: string }) => {
  const { x, y, width, height } = props;
  if (!x || !y || !width || !height) return null;
  
  const patternId = `diagonalHatch_${Math.floor(Math.random() * 1000)}`;
  
  return (
    <g>
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width="4" height="4">
          <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#888888" strokeWidth="1" fill="transparent" />
        </pattern>
      </defs>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`url(#${patternId})`}
        stroke="#888888"
        strokeWidth={0.5}
      />
    </g>
  );
};

// Function for processing price history
const processPriceHistory = (
  priceHistory: ProjectGraphResponse['data']['price_history'] = [],
  dataMap: Map<string, GraphDataPoint>
): Map<string, GraphDataPoint> => {
  if (priceHistory.length) {
    priceHistory.forEach(point => {
      // Only add points with non-zero spot FDV values
      if (point.spot_fdv_usd && point.spot_fdv_usd > 0) {
        dataMap.set(point.date, {
          date: point.date,
          marketValue: point.spot_fdv_usd,
          marketCap: point.market_cap_usd // Store market cap for tooltip
        });
      }
    });
  }
  
  return dataMap;
};

// Function for processing funding rounds
const processFundingRounds = (
  fundingRounds: ProjectGraphResponse['data']['funding_rounds'] = [],
  dataMap: Map<string, GraphDataPoint>
): Map<string, GraphDataPoint> => {
  if (fundingRounds.length) {
    let currentValuation = 0;
    fundingRounds.forEach(round => {
      if (round.valuation !== null) {
        currentValuation = round.valuation;
      }
      
      const entry = dataMap.get(round.date) || { date: round.date };
      entry.fundingValue = currentValuation;
      dataMap.set(round.date, entry);

      // Process fill data
      round.fill?.forEach(fillPoint => {
        const fillEntry = dataMap.get(fillPoint.date) || { date: fillPoint.date };
        fillEntry.fundingValue = fillPoint.valuation ?? currentValuation;
        dataMap.set(fillPoint.date, fillEntry);
      });
    });
  }
  
  return dataMap;
};

// Function for processing orders
const processOrders = (
  orders: ProjectGraphResponse['data']['orders'] = [],
  dataMap: Map<string, GraphDataPoint>
): Map<string, GraphDataPoint> => {
  const orderMapBuy = new Map<string, number>();
  const orderMapSell = new Map<string, number>();
  const allOrdersMap = new Map<string, { buys: OrderData[], sells: OrderData[] }>();

  if (orders.length) {
    orders.forEach(order => {
      const date = order.date;
      const fdv = order.offered_fully_diluted_valuation;
      const amount = order.offered_amount;
      const id = order.order_id;
      
      // Collecting all orders for each date
      if (!allOrdersMap.has(date)) {
        allOrdersMap.set(date, { buys: [], sells: [] });
      }
      const ordersForDate = allOrdersMap.get(date)!;
      
      if (order.type.includes('BUY')) {
        // For BUY orders we take the minimum FDV value
        if (!orderMapBuy.has(date) || fdv < orderMapBuy.get(date)!) {
          orderMapBuy.set(date, fdv);
        }
        ordersForDate.buys.push({ id, fdv, amount });
      } else if (order.type.includes('SELL')) {
        // For SELL orders we take the maximum FDV value
        if (!orderMapSell.has(date) || fdv > orderMapSell.get(date)!) {
          orderMapSell.set(date, fdv);
        }
        ordersForDate.sells.push({ id, fdv, amount });
      }
    });

    // Apply collected values to dataMap
    for (const [date, fdv] of orderMapBuy.entries()) {
      const entry = dataMap.get(date) || { date };
      entry.secondLaneBuy = fdv;
      entry.allBuyOrders = allOrdersMap.get(date)?.buys;
      dataMap.set(date, entry);
    }

    for (const [date, fdv] of orderMapSell.entries()) {
      const entry = dataMap.get(date) || { date };
      entry.secondLaneSell = fdv;
      entry.allSellOrders = allOrdersMap.get(date)?.sells;
      dataMap.set(date, entry);
    }
  }
  
  return dataMap;
};

// Function for sorting data by date
const sortDataByDate = (dataMap: Map<string, GraphDataPoint>): GraphDataPoint[] => {
  return Array.from(dataMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const ProjectChart: React.FC<ProjectChartProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<GraphDataPoint[]>([]);
  const [hasFundingValuation, setHasFundingValuation] = useState(false);
  const [shouldShowChart, setShouldShowChart] = useState(true);

  // Note: All values on the chart (Y-axis) are represented in FDV (Fully Diluted Valuation)
  // The green line represents market cap (from market_cap_usd)
  // The blue line represents funding rounds valuation
  // The green bars represent SecondLane Buy orders
  // The hatched bars represent SecondLane Sell orders
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getProjectGraph(projectId);
        
        if (!response?.data) {
          throw new Error('No data available');
        }

        // Check if we should show the chart
        const hasOrders = response.data.orders && response.data.orders.length > 0;
        const hasPriceHistory = response.data.price_history && response.data.price_history.length > 0;
        
        // Check if any funding round has FDV and it's not zero
        let anyFundingRoundHasFDV = false;
        if (response.data.funding_rounds && response.data.funding_rounds.length > 0) {
          anyFundingRoundHasFDV = response.data.funding_rounds.some(round => 
            round.valuation !== null && round.valuation > 0
          );
          setHasFundingValuation(anyFundingRoundHasFDV);
        }

        // Check if price history has non-zero values
        let hasNonZeroPriceHistory = false;
        if (hasPriceHistory) {
          hasNonZeroPriceHistory = response.data.price_history!.some(
            item => item.spot_fdv_usd > 0
          );
        }

        // Check if orders have non-zero values
        let hasNonZeroOrders = false;
        if (hasOrders) {
          hasNonZeroOrders = response.data.orders!.some(
            order => order.offered_fully_diluted_valuation > 0
          );
        }

        // If there are funding rounds but no FDV or only zero FDVs, no orders or only zero orders, 
        // and no price history or only zero market caps, we should not show the chart
        if ((response.data.funding_rounds && 
            response.data.funding_rounds.length > 0 && 
            !anyFundingRoundHasFDV) && 
            (!hasOrders || !hasNonZeroOrders) && 
            (!hasPriceHistory || !hasNonZeroPriceHistory)) {
          setShouldShowChart(false);
          setLoading(false);
          return;
        }

        // Initialization of dataMap for storing chart data
        let dataMap = new Map<string, GraphDataPoint>();

        // Processing different types of data
        dataMap = processPriceHistory(response.data.price_history, dataMap);
        dataMap = processFundingRounds(response.data.funding_rounds, dataMap);
        dataMap = processOrders(response.data.orders, dataMap);

        // Sorting data by date
        const sortedData = sortDataByDate(dataMap);

        setChartData(sortedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  if (loading) return <div className={styles.loaderContainer}><Loader /></div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;
  if (!shouldShowChart) return <div className={styles.noDataContainer}>No chart data available</div>;
  if (!chartData.length) return <div className={styles.noDataContainer}>No data available</div>;

  return (
    <div className={styles.chartContainer}>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
            barGap={10}
            barCategoryGap="15%"
          >
            <CartesianGrid 
              strokeDasharray="3 3"
              stroke="var(--tg-theme-hint-color, rgba(0,0,0,0.1))"
              opacity={0.5}
            />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: "var(--tg-theme-text-color)" }}
              tickMargin={10}
              stroke="rgba(0,0,0,0.5)"
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: "var(--tg-theme-text-color)" }}
              width={60}
              stroke="rgba(0,0,0,0.5)"
              // Y-axis represents FDV (Fully Diluted Valuation)
            />
            
            <Tooltip 
              contentStyle={{
                backgroundColor: "var(--tg-theme-bg-color)",
                border: "1px solid rgba(0,0,0,0.1)",
                color: "var(--tg-theme-text-color)"
              }}
              formatter={(value: number, name: string, entry: {payload?: GraphDataPoint}) => {
                const formattedValue = formatCurrency(value);
                const labels = {
                  marketValue: 'Spot FDV',
                  fundingValue: 'Funding FDV',
                  secondLaneBuy: 'SecondLane Buy',
                  secondLaneSell: 'SecondLane Sell'
                };
                
                // If this is a market value entry, just show the value
                if (name === 'marketValue') {
                  return [formattedValue, labels[name as keyof typeof labels]];
                }
                
                // If this is a buy or sell order, and there is an array of all orders, enhance the tooltip
                if (entry?.payload) {
                  const data = entry.payload;
                  
                  if (name === 'secondLaneBuy' && data.allBuyOrders && data.allBuyOrders.length > 1) {
                    const allOrders = data.allBuyOrders.map((order) => 
                      `- ${formatCurrency(order.fdv)} (${formatCurrency(order.amount)})`
                    ).join('\n');
                    return [`${formattedValue}\nAll Buy Orders:\n${allOrders}`, labels[name as keyof typeof labels]];
                  }
                  
                  if (name === 'secondLaneSell' && data.allSellOrders && data.allSellOrders.length > 1) {
                    const allOrders = data.allSellOrders.map((order) => 
                      `- ${formatCurrency(order.fdv)} (${formatCurrency(order.amount)})`
                    ).join('\n');
                    return [`${formattedValue}\nAll Sell Orders:\n${allOrders}`, labels[name as keyof typeof labels]];
                  }
                }
                
                return [formattedValue, labels[name as keyof typeof labels]];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            
            <Bar 
              dataKey="secondLaneBuy"
              fill="#ccff00"
              barSize={12}
            />
            
            <Bar 
              dataKey="secondLaneSell"
              barSize={12}
              shape={<CustomBarShape />}
            />
            
            <Line
              type="monotone"
              dataKey="marketValue"
              name="Spot FDV"
              stroke="#4cd964"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls
            />
            
            {hasFundingValuation && (
              <Line
                type="stepAfter"
                dataKey="fundingValue"
                name="Funding FDV"
                stroke="#007aff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.bottomLegend}>
        <div className={styles.legendWrapper}>
          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: "#4cd964" }} />
              <span>Spot FDV</span>
            </div>
            {hasFundingValuation && (
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#007aff' }} />
                <span>Funding FDV</span>
              </div>
            )}
          </div>
          <div className={styles.legendRow}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ backgroundColor: '#ccff00' }} />
              <span>SecondLane Buy</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ 
                backgroundImage: 'repeating-linear-gradient(45deg, #888888, #888888 2px, var(--tg-theme-bg-color) 2px, var(--tg-theme-bg-color) 4px)' 
              }} />
              <span>SecondLane Sell</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectChart; 