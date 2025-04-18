
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, Users, Music, CreditCard } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7'];

interface AnalyticsData {
  totalPayments: number;
  totalRevenue: number;
  activeSubscriptions: number;
  subscriptionRevenue: number;
  totalUsers: number;
  musicEnabledUsers: number;
}

interface MonthlyData {
  name: string;
  payments: number;
  subscriptions: number;
}

interface RevenueBreakdown {
  name: string;
  value: number;
}

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPayments: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    subscriptionRevenue: 0,
    totalUsers: 0,
    musicEnabledUsers: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch payment data
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_status')
        .select('payment_date, has_paid')
        .eq('has_paid', true);
        
      if (paymentsError) throw paymentsError;
      
      // Fetch subscription data
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('music_subscriptions')
        .select('*');
        
      if (subscriptionsError) throw subscriptionsError;
      
      // Fetch user data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, music_unlocked');
        
      if (usersError) throw usersError;
      
      // Calculate analytics data
      const totalPayments = payments?.length || 0;
      const totalRevenue = totalPayments * 100; // R100 per payment
      
      const today = new Date();
      const activeSubscriptions = subscriptions?.filter(sub => 
        sub.end_date && new Date(sub.end_date) >= today
      ).length || 0;
      
      const subscriptionRevenue = activeSubscriptions * 24; // R24 per active subscription
      const totalUsers = users?.length || 0;
      const musicEnabledUsers = users?.filter(user => user.music_unlocked).length || 0;
      
      setAnalyticsData({
        totalPayments,
        totalRevenue,
        activeSubscriptions,
        subscriptionRevenue,
        totalUsers,
        musicEnabledUsers
      });
      
      // Process monthly data for chart
      const monthlyStats = generateMonthlyData(payments || [], subscriptions || []);
      setMonthlyData(monthlyStats);
      
      // Process revenue breakdown for pie chart
      const revenueData = [
        { name: 'Lifetime Purchases', value: totalRevenue },
        { name: 'Subscriptions', value: subscriptionRevenue }
      ];
      setRevenueBreakdown(revenueData);

    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch analytics data"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Generate monthly data for the last 6 months
  const generateMonthlyData = (payments: any[], subscriptions: any[]): MonthlyData[] => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('default', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      
      const startOfMonth = new Date(monthYear, monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthYear, monthDate.getMonth() + 1, 0);
      
      // Count payments for this month
      const monthPayments = payments.filter(payment => {
        if (!payment.payment_date) return false;
        const paymentDate = new Date(payment.payment_date);
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
      }).length;
      
      // Count subscriptions started this month
      const monthSubscriptions = subscriptions.filter(sub => {
        if (!sub.start_date) return false;
        const startDate = new Date(sub.start_date);
        return startDate >= startOfMonth && startDate <= endOfMonth;
      }).length;
      
      months.push({
        name: `${monthName} ${monthYear}`,
        payments: monthPayments,
        subscriptions: monthSubscriptions
      });
    }
    
    return months;
  };

  // Custom tooltip for recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border p-3 shadow-lg rounded-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.fill }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Analytics Dashboard</h3>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R{analyticsData.totalRevenue + analyticsData.subscriptionRevenue}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Lifetime payments + active subscriptions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Lifetime Purchases
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalPayments}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  R100 ZAR each (R{analyticsData.totalRevenue} total)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Subscriptions
                </CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.activeSubscriptions}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  R24 ZAR each (R{analyticsData.subscriptionRevenue} total)
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Music-Enabled Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.musicEnabledUsers}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  Out of {analyticsData.totalUsers} total users
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Activity Bar Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={60}
                      tickMargin={20}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="payments" name="Lifetime Purchases" fill="#8884d8" />
                    <Bar dataKey="subscriptions" name="New Subscriptions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Revenue Breakdown Pie Chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
